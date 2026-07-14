# 台北即時天氣 —— 排程自動更新練習

一個純靜態的天氣頁面，練「排程自動化」＋「前端 RWD／自動刷新」，不用資料庫。

```
GitHub Actions（每小時整點過 5 分跑一次）
   → 呼叫 Open-Meteo API（免金鑰）抓台北即時天氣
   → 產生新的 public/index.html
   → git commit + push
GitHub 有新 commit
   → Vercel 自動偵測、重新部署
使用者打開網址 → 看到最新一版；頁面開著每 5 分鐘自動重新整理一次
```

## 檔案說明

| 檔案 | 做什麼 |
|---|---|
| `scripts/fetch_weather.py` | 呼叫天氣 API，套進樣板產生 `public/index.html` |
| `scripts/template.html` | 頁面樣板，含 RWD CSS 與自動刷新 JS |
| `scripts/weather_codes.py` | 天氣代碼對照表（數字代碼 → 中文描述＋emoji 圖示） |
| `.github/workflows/update-weather.yml` | 排程設定：每小時觸發一次，也可以手動觸發（Actions 頁面的 Run workflow） |
| `run.bat` | 本機測試：抓一次天氣、產生頁面、用瀏覽器打開看 |

## 本機測試

雙擊 `run.bat`。

## 部署

1. 推上 GitHub（public repo 即可，沒有機密資訊，Open-Meteo 不用 API 金鑰）。
2. Vercel 連上這個 repo，Framework 選 "Other"，不需要 build command（純靜態檔案，直接 serve `public/`）。
3. GitHub Actions 排程會自動每小時更新 `public/index.html` 並 push，Vercel 偵測到新 commit 自動重新部署。

## 之後可以加的功能

- 存歷史資料做趨勢圖（那時候才需要資料庫）
- 換城市：改 `scripts/fetch_weather.py` 裡的 `LATITUDE`/`LONGITUDE`
