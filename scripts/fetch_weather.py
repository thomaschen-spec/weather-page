import datetime
import pathlib
import sys
import urllib.request
import json

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from weather_codes import describe

CITY = "台北"
LATITUDE = 25.0330
LONGITUDE = 121.5654
API_URL = (
    "https://api.open-meteo.com/v1/forecast"
    f"?latitude={LATITUDE}&longitude={LONGITUDE}"
    "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m"
    "&timezone=Asia%2FTaipei"
)

ROOT = pathlib.Path(__file__).parent.parent
TEMPLATE_PATH = ROOT / "scripts" / "template.html"
OUTPUT_PATH = ROOT / "public" / "index.html"


def fetch():
    with urllib.request.urlopen(API_URL, timeout=15) as resp:
        return json.load(resp)


def render(data):
    current = data["current"]
    desc, icon = describe(current["weather_code"])
    template = TEMPLATE_PATH.read_text(encoding="utf-8")
    now = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=8)).strftime("%Y-%m-%d %H:%M")
    html = (
        template
        .replace("{{CITY}}", CITY)
        .replace("{{ICON}}", icon)
        .replace("{{TEMP}}", str(round(current["temperature_2m"])))
        .replace("{{WEATHER_DESC}}", desc)
        .replace("{{HUMIDITY}}", str(round(current["relative_humidity_2m"])))
        .replace("{{WIND}}", str(round(current["wind_speed_10m"])))
        .replace("{{UPDATED_AT}}", now)
    )
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(html, encoding="utf-8")
    print(f"寫入完成：{OUTPUT_PATH}（{desc}, {current['temperature_2m']}°C）")


if __name__ == "__main__":
    render(fetch())
