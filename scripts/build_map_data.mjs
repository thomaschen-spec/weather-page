// 一次性建置腳本：把台灣縣市／區鄉鎮市 GeoJSON 簡化成小巧的 map-data.json，給 3D 地圖頁面用。
// 座標從經緯度轉成平面座標，邊界用距離門檻做低多邊形簡化。
// 原始資料來源（都不進 repo，只在重新產生 map-data.json 時才需要）：
// 縣市：https://raw.githubusercontent.com/g0v/twgeojson/master/json/twCounty2010.geo.json → scripts/tw-raw.geojson
// 區鄉鎮市：https://raw.githubusercontent.com/g0v/twgeojson/master/json/twTown1982.geo.json → scripts/tw-town-raw.geojson
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_PATH = path.join(__dirname, "tw-raw.geojson");
const TOWN_RAW_PATH = path.join(__dirname, "tw-town-raw.geojson");
const OUT_PATH = path.join(__dirname, "..", "public", "map", "map-data.json");

const LAT0 = 23.6; // 台灣中心緯度，當作投影基準
const LON0 = 120.9;
const M_PER_DEG_LAT = 110540;
const M_PER_DEG_LON = 111320 * Math.cos((LAT0 * Math.PI) / 180);
const SCALE = 1 / 100; // 把公尺級距離縮成場景友善的單位（台灣全島約可縮到 2500x3800 上下）

function project([lon, lat]) {
  // x 故意取負號：目前的攝影機朝北視角下，正常正負號會讓東西相反（金門變成跑到右邊）
  // 這裡直接反過來對齊實際畫面，讓「screen 右 = 地理東」，用金門/馬祖(應在左/西)驗證過
  return [-(lon - LON0) * M_PER_DEG_LON * SCALE, (lat - LAT0) * M_PER_DEG_LAT * SCALE];
}

// 封閉多邊形簡化：只保留跟前一個已保留點距離超過門檻的點，避免首尾重合造成的 RDP 退化問題
function simplify(points, minGapMeters, projectFn) {
  const kept = [points[0]];
  let [lastX, lastY] = projectFn(points[0]);
  for (let i = 1; i < points.length; i++) {
    const [x, y] = projectFn(points[i]);
    if (Math.hypot(x - lastX, y - lastY) >= minGapMeters) {
      kept.push(points[i]);
      lastX = x;
      lastY = y;
    }
  }
  if (kept.length < 4) return points.filter((_, i) => i % Math.ceil(points.length / 8) === 0);
  return kept;
}

function largestRing(geometry) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  let best = null;
  let bestArea = -1;
  for (const poly of polygons) {
    const ring = poly[0];
    const area = Math.abs(shoelaceArea(ring));
    if (area > bestArea) {
      bestArea = area;
      best = ring;
    }
  }
  return best;
}

function shoelaceArea(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return sum / 2;
}

function centroidOf(ring) {
  let x = 0, y = 0;
  for (const [px, py] of ring) {
    x += px;
    y += py;
  }
  return [x / ring.length, y / ring.length];
}

const raw = JSON.parse(readFileSync(RAW_PATH, "utf-8"));
const counties = [];

for (const feature of raw.features) {
  const name = feature.properties.COUNTYNAME;
  const ring = largestRing(feature.geometry);
  const simplified = simplify(ring, 22, project); // 相鄰保留點至少間隔約 2.2 公里（已依 SCALE 換算），做出低多邊形風格
  const projected = simplified.map(project);
  const [cx, cy] = centroidOf(ring);

  counties.push({
    name,
    outline: projected.map(([x, y]) => [Math.round(x), Math.round(y)]),
    centroidLonLat: [Number(cx.toFixed(4)), Number(cy.toFixed(4))],
    districts: [],
  });
}

const countyByName = new Map(counties.map((c) => [c.name, c]));
const townRaw = JSON.parse(readFileSync(TOWN_RAW_PATH, "utf-8"));

for (const feature of townRaw.features) {
  const countyName = feature.properties.COUNTYNAME;
  const townName = feature.properties.TOWNNAME;
  const county = countyByName.get(countyName);
  if (!county) continue; // 縣市名對不上就跳過（例如資料更新過的舊名稱）

  const ring = largestRing(feature.geometry);
  if (!ring || ring.length < 4) continue;
  const simplified = simplify(ring, 8, project); // 區的範圍比縣市小很多，門檻抓緊一點（約 800 公尺）
  const projected = simplified.map(project);
  const [cx, cy] = centroidOf(ring);

  county.districts.push({
    name: townName,
    outline: projected.map(([x, y]) => [Math.round(x), Math.round(y)]),
    centroidLonLat: [Number(cx.toFixed(4)), Number(cy.toFixed(4))],
  });
}

writeFileSync(OUT_PATH, JSON.stringify({ counties }));
const totalDistricts = counties.reduce((n, c) => n + c.districts.length, 0);
console.log(`寫入 ${counties.length} 個縣市、${totalDistricts} 個區鄉鎮市，檔案大小約 ${(readFileSync(OUT_PATH).length / 1024).toFixed(1)} KB`);
