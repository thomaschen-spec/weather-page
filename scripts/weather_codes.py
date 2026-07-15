WEATHER_CODES = {
    0: ("晴天", "☀️"),
    1: ("大致晴朗", "🌤️"),
    2: ("多雲時晴", "⛅"),
    3: ("陰天", "☁️"),
    45: ("有霧", "🌫️"),
    48: ("霧淞", "🌫️"),
    51: ("毛毛雨(小)", "🌦️"),
    53: ("毛毛雨(中)", "🌦️"),
    55: ("毛毛雨(大)", "🌧️"),
    61: ("小雨", "🌦️"),
    63: ("中雨", "🌧️"),
    65: ("大雨", "🌧️"),
    71: ("小雪", "🌨️"),
    73: ("中雪", "🌨️"),
    75: ("大雪", "❄️"),
    80: ("陣雨(小)", "🌦️"),
    81: ("陣雨(中)", "🌧️"),
    82: ("陣雨(大)", "⛈️"),
    95: ("雷雨", "⛈️"),
    96: ("雷雨挾冰雹", "⛈️"),
    99: ("雷雨挾大冰雹", "⛈️"),
}


def describe(code):
    return WEATHER_CODES.get(code, ("未知", "❔"))


SEVERE_CODES = {65, 67, 75, 82, 95, 96, 99}


def severe_alert(weather_code, wind_speed, apparent_temp, precip_prob):
    if weather_code in SEVERE_CODES:
        return "⚠️ 大雨雷雨特報，注意防範積水、雷擊"
    if wind_speed is not None and wind_speed >= 50:
        return "⚠️ 強風特報，外出請注意招牌與飛落物"
    if apparent_temp is not None and apparent_temp >= 38:
        return "⚠️ 高溫警示，體感溫度極高，避免長時間曝曬"
    if apparent_temp is not None and apparent_temp <= 5:
        return "⚠️ 低溫特報，注意保暖"
    if precip_prob is not None and precip_prob >= 80:
        return "☔ 降雨機率很高，記得帶傘"
    return None


def outfit_suggestion(apparent_temp, precip_prob):
    if apparent_temp is None:
        base = "查不到體感溫度，先看天氣描述決定穿著"
    elif apparent_temp >= 30:
        base = "🩳 天氣炎熱，短袖短褲＋防曬，多補充水分"
    elif apparent_temp >= 25:
        base = "👕 舒適溫暖，短袖或薄長袖都可以"
    elif apparent_temp >= 20:
        base = "🧥 微涼，建議薄外套或長袖"
    elif apparent_temp >= 15:
        base = "🧣 有點涼，穿件外套比較保險"
    else:
        base = "🧤 偏冷，記得穿保暖外套，注意保暖"

    if precip_prob is not None and precip_prob >= 50:
        base += "，降雨機率高記得帶傘"
    return base
