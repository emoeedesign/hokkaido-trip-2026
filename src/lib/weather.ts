// 天気予報を取得するユーティリティ
// Open-Meteo API（無料・APIキー不要）を使用

// 各地点の緯度経度
export const locations = {
  sapporo: { lat: 43.0618, lon: 141.3545, name: "札幌" },
  chitose: { lat: 42.8206, lon: 141.6503, name: "千歳" },
  shikotsu: { lat: 42.7589, lon: 141.3628, name: "支笏湖" },
  jozankei: { lat: 42.9689, lon: 141.1667, name: "定山渓" },
  rusutsu: { lat: 42.7500, lon: 140.8833, name: "ルスツ" },
};

// 天気コードから天気情報を取得
export function getWeatherInfo(code: number): { icon: string; label: string; snowChance: boolean } {
  // WMO Weather interpretation codes
  // https://open-meteo.com/en/docs
  const weatherMap: Record<number, { icon: string; label: string; snowChance: boolean }> = {
    0: { icon: "☀️", label: "快晴", snowChance: false },
    1: { icon: "🌤️", label: "晴れ", snowChance: false },
    2: { icon: "⛅", label: "くもり時々晴れ", snowChance: false },
    3: { icon: "☁️", label: "くもり", snowChance: false },
    45: { icon: "🌫️", label: "霧", snowChance: false },
    48: { icon: "🌫️", label: "霧氷", snowChance: true },
    51: { icon: "🌧️", label: "小雨", snowChance: false },
    53: { icon: "🌧️", label: "雨", snowChance: false },
    55: { icon: "🌧️", label: "強い雨", snowChance: false },
    56: { icon: "🌨️", label: "凍雨", snowChance: true },
    57: { icon: "🌨️", label: "強い凍雨", snowChance: true },
    61: { icon: "🌧️", label: "小雨", snowChance: false },
    63: { icon: "🌧️", label: "雨", snowChance: false },
    65: { icon: "🌧️", label: "大雨", snowChance: false },
    66: { icon: "🌨️", label: "凍雨", snowChance: true },
    67: { icon: "🌨️", label: "強い凍雨", snowChance: true },
    71: { icon: "🌨️", label: "小雪", snowChance: true },
    73: { icon: "❄️", label: "雪", snowChance: true },
    75: { icon: "❄️", label: "大雪", snowChance: true },
    77: { icon: "🌨️", label: "霧雪", snowChance: true },
    80: { icon: "🌧️", label: "にわか雨", snowChance: false },
    81: { icon: "🌧️", label: "にわか雨", snowChance: false },
    82: { icon: "⛈️", label: "激しいにわか雨", snowChance: false },
    85: { icon: "🌨️", label: "にわか雪", snowChance: true },
    86: { icon: "❄️", label: "激しいにわか雪", snowChance: true },
    95: { icon: "⛈️", label: "雷雨", snowChance: false },
    96: { icon: "⛈️", label: "雷雨（雹あり）", snowChance: false },
    99: { icon: "⛈️", label: "激しい雷雨", snowChance: false },
  };

  return weatherMap[code] || { icon: "❓", label: "不明", snowChance: false };
}

// スノボ日和かどうかを判定
export function getSnowboardCondition(
  weatherCode: number,
  snowfall: number,
  tempMax: number,
  tempMin: number
): { label: string; color: string } {
  const weather = getWeatherInfo(weatherCode);
  
  // 大雪で新雪パウダー期待
  if (snowfall >= 10) {
    return { label: "🎿 パウダー日和！", color: "#4ecdc4" };
  }
  
  // 雪が降っていて気温が低い（良いコンディション）
  if (weather.snowChance && tempMax <= 0) {
    return { label: "❄️ スノボ日和！", color: "#4ecdc4" };
  }
  
  // 晴れで気温がちょうど良い
  if ((weatherCode <= 3) && tempMax <= 0 && tempMin >= -15) {
    return { label: "☀️ 絶好のスノボ日和！", color: "#ff6b9d" };
  }
  
  // 普通のコンディション
  if (tempMax <= 5) {
    return { label: "🏂 滑れる！", color: "#6b89ff" };
  }
  
  // 気温が高め
  return { label: "🌡️ 暖かめ", color: "#ffaa00" };
}

export type DailyForecast = {
  date: string;
  location: string;
  weatherCode: number;
  weatherIcon: string;
  weatherLabel: string;
  tempMax: number;
  tempMin: number;
  snowfall: number;
  precipitation: number;
  snowboardCondition: { label: string; color: string };
};

// 天気予報を取得
export async function fetchWeatherForecast(
  lat: number,
  lon: number,
  locationName: string
): Promise<DailyForecast[]> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum&timezone=Asia/Tokyo&forecast_days=7`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("Weather API error");
    
    const data = await response.json();
    
    const forecasts: DailyForecast[] = data.daily.time.map((date: string, i: number) => {
      const weatherCode = data.daily.weather_code[i];
      const weatherInfo = getWeatherInfo(weatherCode);
      const tempMax = data.daily.temperature_2m_max[i];
      const tempMin = data.daily.temperature_2m_min[i];
      const snowfall = data.daily.snowfall_sum[i];
      
      return {
        date,
        location: locationName,
        weatherCode,
        weatherIcon: weatherInfo.icon,
        weatherLabel: weatherInfo.label,
        tempMax,
        tempMin,
        snowfall,
        precipitation: data.daily.precipitation_sum[i],
        snowboardCondition: getSnowboardCondition(weatherCode, snowfall, tempMax, tempMin),
      };
    });
    
    return forecasts;
  } catch (error) {
    console.error("天気予報の取得に失敗:", error);
    return [];
  }
}

// 複数地点の天気を取得
export async function fetchMultiLocationForecast(): Promise<Record<string, DailyForecast[]>> {
  const results: Record<string, DailyForecast[]> = {};
  
  for (const [key, loc] of Object.entries(locations)) {
    results[key] = await fetchWeatherForecast(loc.lat, loc.lon, loc.name);
  }
  
  return results;
}

// 特定の日付の天気を取得
export function getForecastForDate(
  forecasts: DailyForecast[],
  targetDate: string // YYYY-MM-DD形式
): DailyForecast | null {
  return forecasts.find(f => f.date === targetDate) || null;
}
