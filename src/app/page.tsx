"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { seedDatabase } from "@/lib/seedData";
import { 
  fetchWeatherForecast, 
  locations, 
  type DailyForecast,
  getForecastForDate 
} from "@/lib/weather";

type TimelineItem = {
  time: string;
  title: string;
  desc: string;
  url?: string;
  mapUrl?: string;
  isDrive?: boolean;
  highlight?: boolean;
  tag?: string;
};

type DaySchedule = {
  day: number;
  date: string;
  title: string;
  titleUrl?: string;
  timeline: TimelineItem[];
};

type CostItem = {
  label: string;
  amount: number | string;
  note?: string;
};

type Costs = {
  shared: CostItem[];
  sharedTotal: { min: number; max: number };
  perPerson: { people: number; min: number; max: number };
  individual: CostItem[];
  note: string;
};

type Saunas = {
  infoUrl: string;
  recommended: string[];
};

type TripData = {
  title: string;
  dates: string;
  subtitle: string;
  flight: {
    outbound: {
      date: string;
      from: { code: string; name: string; time: string };
      to: { code: string; name: string; time: string };
      airline: string;
      duration: string;
    };
    inbound: {
      date: string;
      from: { code: string; name: string; time: string };
      to: { code: string; name: string; time: string };
      airline: string;
      duration: string;
    };
  };
  accommodation: {
    name: string;
    address: string;
    details: string;
    rating: number;
    access: string;
    checkin: string;
    checkout: string;
    url: string;
    mapUrl?: string;
  };
  days: DaySchedule[];
  spots: {
    sasaki: {
      name: string;
      address: string;
      phone: string;
      hours: string;
      closed: string;
      mapUrl?: string;
    };
  };
  saunas: Saunas;
  checklist: {
    text: string;
    done: boolean;
    result?: string;
    options?: string;
  }[];
  costs?: Costs;
  updatedAt: string;
};

// 地図ボタンコンポーネント
function MapButton({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs bg-[#4ecdc4]/30 hover:bg-[#4ecdc4]/50 text-[#4ecdc4] px-2 py-1 rounded-full transition mt-1"
      onClick={(e) => e.stopPropagation()}
    >
      📍 地図
    </a>
  );
}

// 天気カードコンポーネント
function WeatherCard({ forecast, showSnowboard = false }: { forecast: DailyForecast | null; showSnowboard?: boolean }) {
  if (!forecast) {
    return (
      <div className="bg-white/5 rounded-lg p-3 text-center text-sm opacity-50">
        天気情報を取得中...
      </div>
    );
  }

  return (
    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{forecast.weatherIcon}</span>
          <div>
            <div className="font-bold">{forecast.weatherLabel}</div>
            <div className="text-sm opacity-70">{forecast.location}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">
            <span className="text-[#ff6b9d]">{forecast.tempMax}°</span>
            <span className="opacity-50 mx-1">/</span>
            <span className="text-[#4ecdc4]">{forecast.tempMin}°</span>
          </div>
          {forecast.snowfall > 0 && (
            <div className="text-sm text-[#4ecdc4]">
              ❄️ 積雪 {forecast.snowfall}cm
            </div>
          )}
        </div>
      </div>
      {showSnowboard && (
        <div 
          className="mt-3 text-center py-2 rounded-lg font-bold"
          style={{ backgroundColor: `${forecast.snowboardCondition.color}30`, color: forecast.snowboardCondition.color }}
        >
          {forecast.snowboardCondition.label}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDays, setOpenDays] = useState<number[]>([1]);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  
  // 天気予報のstate
  const [weatherData, setWeatherData] = useState<Record<string, DailyForecast[]>>({});
  const [weatherLoading, setWeatherLoading] = useState(true);

  // 旅行日程（2026年1月11日〜13日）
  const tripDates = {
    day1: "2026-01-11",
    day2: "2026-01-12", 
    day3: "2026-01-13",
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "trips", "hokkaido-2026"),
      (docSnap) => {
        if (docSnap.exists()) {
          setTripData(docSnap.data() as TripData);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 天気予報を取得
  useEffect(() => {
    async function loadWeather() {
      setWeatherLoading(true);
      try {
        const results: Record<string, DailyForecast[]> = {};
        
        // 各地点の天気を取得
        for (const [key, loc] of Object.entries(locations)) {
          results[key] = await fetchWeatherForecast(loc.lat, loc.lon, loc.name);
        }
        
        setWeatherData(results);
      } catch (error) {
        console.error("天気予報の取得に失敗:", error);
      }
      setWeatherLoading(false);
    }
    
    loadWeather();
  }, []);

  const handleSeed = async () => {
    await seedDatabase();
  };

  const toggleDay = (day: number) => {
    setOpenDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const startEdit = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
  };

  const saveEdit = async (field: string) => {
    if (!tripData) return;

    const updates: Record<string, string> = {};
    updates[field] = editValue;
    updates["updatedAt"] = new Date().toISOString();

    await updateDoc(doc(db, "trips", "hokkaido-2026"), updates);
    setEditingField(null);
  };

  const toggleChecklist = async (index: number) => {
    if (!tripData) return;

    const newChecklist = [...tripData.checklist];
    newChecklist[index].done = !newChecklist[index].done;

    await updateDoc(doc(db, "trips", "hokkaido-2026"), {
      checklist: newChecklist,
      updatedAt: new Date().toISOString(),
    });
  };

  const formatAmount = (amount: number | string) => {
    if (typeof amount === "number") {
      return `¥${amount.toLocaleString()}`;
    }
    return `¥${amount}`;
  };

  // 各日の天気を取得するヘルパー関数
  const getWeatherForDay = (dayNum: number): { forecast: DailyForecast | null; location: string } => {
    const dateKey = dayNum === 1 ? tripDates.day1 : dayNum === 2 ? tripDates.day2 : tripDates.day3;
    
    // 日によって表示する地点を変える
    let locationKey = "sapporo";
    if (dayNum === 1) {
      locationKey = "jozankei"; // 1日目は定山渓メイン
    } else if (dayNum === 2) {
      locationKey = "rusutsu"; // 2日目はルスツ
    } else {
      locationKey = "sapporo"; // 3日目は札幌
    }
    
    const forecasts = weatherData[locationKey] || [];
    const forecast = getForecastForDate(forecasts, dateKey);
    
    return { forecast, location: locationKey };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    );
  }

  if (!tripData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">データがありません</p>
          <button
            onClick={handleSeed}
            className="bg-[#4ecdc4] text-[#1a1a2e] px-6 py-3 rounded-lg font-bold hover:bg-[#3dbdb5] transition"
          >
            初期データを投入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white">
      {/* Header */}
      <header className="text-center py-12 px-4">
        {editingField === "title" ? (
          <div className="flex items-center justify-center gap-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="bg-white/10 text-3xl font-bold text-center rounded px-4 py-2"
              autoFocus
            />
            <button
              onClick={() => saveEdit("title")}
              className="text-[#4ecdc4]"
            >
              ✓
            </button>
            <button
              onClick={() => setEditingField(null)}
              className="text-[#ff6b9d]"
            >
              ✕
            </button>
          </div>
        ) : (
          <h1
            onClick={() => startEdit("title", tripData.title)}
            className="text-4xl font-bold bg-gradient-to-r from-[#ff6b9d] via-[#4ecdc4] to-[#6b89ff] bg-clip-text text-transparent cursor-pointer hover:opacity-80"
          >
            {tripData.title} ❄️
          </h1>
        )}
        <p className="mt-4 text-lg opacity-90">{tripData.dates}</p>
        <p className="mt-2 opacity-70">{tripData.subtitle}</p>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-12">
        {/* Weather Forecast */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-5 border border-white/20">
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection("weather")}
          >
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>🌤️</span> 天気予報
            </h2>
            <span
              className={`opacity-40 transition-transform ${
                openSections.includes("weather") ? "rotate-180" : ""
              }`}
            >
              ▼
            </span>
          </div>

          {openSections.includes("weather") && (
            <div className="mt-4 space-y-4">
              {weatherLoading ? (
                <div className="text-center py-8 opacity-50">
                  天気情報を取得中...
                </div>
              ) : (
                <>
                  {/* Day 1 */}
                  <div>
                    <div className="text-sm text-[#4ecdc4] font-bold mb-2">
                      1月11日（日）─ 支笏湖・定山渓
                    </div>
                    <WeatherCard forecast={getWeatherForDay(1).forecast} />
                  </div>
                  
                  {/* Day 2 - スノボの日 */}
                  <div>
                    <div className="text-sm text-[#ff6b9d] font-bold mb-2">
                      1月12日（月）─ ルスツリゾート 🏂
                    </div>
                    <WeatherCard forecast={getWeatherForDay(2).forecast} showSnowboard={true} />
                  </div>
                  
                  {/* Day 3 */}
                  <div>
                    <div className="text-sm text-[#4ecdc4] font-bold mb-2">
                      1月13日（火）─ 札幌・新千歳
                    </div>
                    <WeatherCard forecast={getWeatherForDay(3).forecast} />
                  </div>
                  
                  <p className="text-xs text-center opacity-40 mt-4">
                    ※ Open-Meteo APIより取得（7日間予報）
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Flight Info */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-5 border border-white/20">
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection("flight")}
          >
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>✈️</span> フライト情報
            </h2>
            <span
              className={`opacity-40 transition-transform ${
                openSections.includes("flight") ? "rotate-180" : ""
              }`}
            >
              ▼
            </span>
          </div>

          {openSections.includes("flight") && (
            <div className="mt-4 space-y-4">
              {/* Outbound */}
              <div className="bg-[#4ecdc4]/20 rounded-xl p-4">
                <div className="text-sm text-[#4ecdc4] mb-2">
                  往路 ─ {tripData.flight.outbound.date}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {tripData.flight.outbound.from.code}
                    </div>
                    <div className="text-sm opacity-70">
                      {tripData.flight.outbound.from.name}
                    </div>
                    <div className="text-[#4ecdc4]">
                      {tripData.flight.outbound.from.time}
                    </div>
                  </div>
                  <div className="text-2xl">✈︎→</div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {tripData.flight.outbound.to.code}
                    </div>
                    <div className="text-sm opacity-70">
                      {tripData.flight.outbound.to.name}
                    </div>
                    <div className="text-[#4ecdc4]">
                      {tripData.flight.outbound.to.time}
                    </div>
                  </div>
                </div>
                <div className="text-center text-sm opacity-70 mt-2">
                  {tripData.flight.outbound.airline} 直行便{" "}
                  {tripData.flight.outbound.duration}
                </div>
              </div>

              {/* Inbound */}
              <div className="bg-[#4ecdc4]/20 rounded-xl p-4">
                <div className="text-sm text-[#4ecdc4] mb-2">
                  復路 ─ {tripData.flight.inbound.date}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {tripData.flight.inbound.from.code}
                    </div>
                    <div className="text-sm opacity-70">
                      {tripData.flight.inbound.from.name}
                    </div>
                    <div className="text-[#4ecdc4]">
                      {tripData.flight.inbound.from.time}
                    </div>
                  </div>
                  <div className="text-2xl">✈︎→</div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {tripData.flight.inbound.to.code}
                    </div>
                    <div className="text-sm opacity-70">
                      {tripData.flight.inbound.to.name}
                    </div>
                    <div className="text-[#4ecdc4]">
                      {tripData.flight.inbound.to.time}
                    </div>
                  </div>
                </div>
                <div className="text-center text-sm opacity-70 mt-2">
                  {tripData.flight.inbound.airline} 直行便{" "}
                  {tripData.flight.inbound.duration}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Accommodation */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-5 border border-white/20">
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection("accommodation")}
          >
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>🏠</span> 宿泊先
            </h2>
            <span
              className={`opacity-40 transition-transform ${
                openSections.includes("accommodation") ? "rotate-180" : ""
              }`}
            >
              ▼
            </span>
          </div>

          {openSections.includes("accommodation") && (
            <div className="mt-4">
              <a
                href={tripData.accommodation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4ecdc4] font-bold hover:underline"
              >
                {tripData.accommodation.name} 🔗
              </a>
              <p className="mt-2 text-sm opacity-90">
                {tripData.accommodation.address}
              </p>
              {tripData.accommodation.mapUrl && (
                <MapButton url={tripData.accommodation.mapUrl} />
              )}
              <p className="mt-2 text-sm opacity-70">
                {tripData.accommodation.details}
              </p>
              <p className="text-sm opacity-70">
                ★{tripData.accommodation.rating} ／{" "}
                {tripData.accommodation.access}
              </p>
              <p className="text-sm opacity-70">
                チェックイン{tripData.accommodation.checkin} ／ チェックアウト
                {tripData.accommodation.checkout}
              </p>
            </div>
          )}
        </div>

        {/* Schedule */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-5 border border-white/20">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <span>📅</span> スケジュール
          </h2>

          {tripData.days.map((day) => (
            <div key={day.day} className="mb-4">
              <div
                className="flex items-center gap-4 cursor-pointer p-3 rounded-xl bg-white/5 hover:bg-white/10 transition"
                onClick={() => toggleDay(day.day)}
              >
                <div className="bg-gradient-to-br from-[#ff6b9d] to-[#4ecdc4] rounded-xl w-14 h-14 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold">{day.day}</span>
                  <span className="text-xs">DAY</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{day.date}</h3>
                  <p className="text-sm opacity-70">
                    {day.titleUrl ? (
                      <a
                        href={day.titleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#4ecdc4] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {day.title} 🔗
                      </a>
                    ) : (
                      day.title
                    )}
                  </p>
                </div>
                {/* 天気アイコンをDAYカードに表示 */}
                {!weatherLoading && getWeatherForDay(day.day).forecast && (
                  <div className="text-2xl">
                    {getWeatherForDay(day.day).forecast?.weatherIcon}
                  </div>
                )}
                <span
                  className={`opacity-40 transition-transform ${
                    openDays.includes(day.day) ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </div>

              {openDays.includes(day.day) && (
                <div className="mt-4 ml-4 border-l-2 border-white/20 pl-4 space-y-4">
                  {day.timeline.map((item, idx) => (
                    <div
                      key={idx}
                      className={`relative ${
                        item.highlight
                          ? "bg-[#ff6b9d]/20 -ml-4 pl-4 py-2 rounded-r-xl border-l-2 border-[#ff6b9d]"
                          : ""
                      }`}
                    >
                      {item.time && (
                        <div className="text-xs text-[#4ecdc4] font-bold mb-1">
                          {item.time}
                        </div>
                      )}
                      <div className="font-bold">
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#4ecdc4] hover:underline"
                          >
                            {item.title} 🔗
                          </a>
                        ) : (
                          item.title
                        )}
                        {item.tag && (
                          <span className="ml-2 text-xs bg-[#ff6b9d] px-2 py-1 rounded">
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <div className="text-sm opacity-70 whitespace-pre-line">
                        {item.desc}
                      </div>
                      {item.mapUrl && <MapButton url={item.mapUrl} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Saunas */}
        {tripData.saunas && (
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-5 border border-white/20">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("saunas")}
            >
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span>🧖</span> 定山渓サウナ施設
              </h2>
              <span
                className={`opacity-40 transition-transform ${
                  openSections.includes("saunas") ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </div>

            {openSections.includes("saunas") && (
              <div className="mt-4">
                <a
                  href={tripData.saunas.infoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[#ff6b9d]/20 text-[#ff6b9d] px-4 py-2 rounded-lg hover:bg-[#ff6b9d]/30 transition mb-4"
                >
                  📖 日帰り入浴施設一覧を見る 🔗
                </a>
                
                <div className="mt-4">
                  <p className="text-sm text-[#4ecdc4] font-bold mb-2">おすすめ施設</p>
                  <div className="flex flex-wrap gap-2">
                    {tripData.saunas.recommended.map((name, idx) => (
                      <span
                        key={idx}
                        className="bg-white/10 px-3 py-1 rounded-full text-sm"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Checklist */}
        <div className="bg-[#1e1e32]/90 backdrop-blur rounded-2xl p-6 mb-5 border border-white/30">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <span>📝</span> 決めること
          </h2>

          <div className="space-y-3">
            {tripData.checklist.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 py-3 border-b border-white/10 last:border-0"
              >
                <button
                  onClick={() => toggleChecklist(idx)}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${
                    item.done
                      ? "bg-[#4ecdc4] border-[#4ecdc4] text-[#1a1a2e]"
                      : "border-white/50"
                  }`}
                >
                  {item.done && "✓"}
                </button>
                <div>
                  <div
                    className={
                      item.done ? "line-through opacity-60" : "font-bold"
                    }
                  >
                    {item.text}
                  </div>
                  <div
                    className={`text-sm ${
                      item.done ? "text-[#4ecdc4]" : "opacity-70"
                    }`}
                  >
                    {item.done ? `→ ${item.result}` : item.options}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Costs */}
        {tripData.costs && (
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-5 border border-white/20">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("costs")}
            >
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span>💰</span> 費用
              </h2>
              <span
                className={`opacity-40 transition-transform ${
                  openSections.includes("costs") ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </div>

            {openSections.includes("costs") && (
              <div className="mt-4 space-y-6">
                {/* Shared Costs */}
                <div>
                  <h3 className="text-sm text-[#4ecdc4] font-bold mb-3">
                    🚗 みんなで割り勘
                  </h3>
                  <div className="space-y-2">
                    {tripData.costs.shared.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center py-2 border-b border-white/10"
                      >
                        <span className="opacity-90">
                          {item.label}
                          {item.note && (
                            <span className="text-xs opacity-50 ml-2">
                              ({item.note})
                            </span>
                          )}
                        </span>
                        <span className="font-bold">
                          {formatAmount(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 bg-[#4ecdc4]/20 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="opacity-70">合計</span>
                      <span className="font-bold">
                        ¥{tripData.costs.sharedTotal.min.toLocaleString()} 〜 ¥
                        {tripData.costs.sharedTotal.max.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-lg">
                      <span className="text-[#4ecdc4]">
                        {tripData.costs.perPerson.people}人で割ると
                      </span>
                      <span className="font-bold text-[#4ecdc4]">
                        ¥{tripData.costs.perPerson.min.toLocaleString()} 〜 ¥
                        {tripData.costs.perPerson.max.toLocaleString()}
                        <span className="text-sm opacity-70">/人</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Individual Costs */}
                <div>
                  <h3 className="text-sm text-[#ff6b9d] font-bold mb-3">
                    🎿 個人で払うもの
                  </h3>
                  <div className="space-y-2">
                    {tripData.costs.individual.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center py-2 border-b border-white/10"
                      >
                        <span className="opacity-90">{item.label}</span>
                        <span className="font-bold">
                          {formatAmount(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 bg-[#ff6b9d]/20 rounded-xl p-4">
                    <div className="flex justify-between items-center text-lg">
                      <span className="text-[#ff6b9d]">個人負担 合計</span>
                      <span className="font-bold text-[#ff6b9d]">
                        ¥
                        {tripData.costs.individual
                          .reduce((sum, item) => {
                            if (typeof item.amount === "number") {
                              return sum + item.amount;
                            }
                            return sum;
                          }, 0)
                          .toLocaleString()}
                        <span className="text-sm opacity-70">/人</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Note */}
                <p className="text-xs text-center opacity-50">
                  {tripData.costs.note}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Last Updated */}
        <div className="text-center text-sm opacity-50">
          最終更新: {new Date(tripData.updatedAt).toLocaleString("ja-JP")}
        </div>
      </main>
    </div>
  );
}
