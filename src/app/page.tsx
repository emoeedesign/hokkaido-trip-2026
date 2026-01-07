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

type Expense = {
  id: string;
  paidBy: string;
  description: string;
  amount: number;
  splitAmong: string[];
  date: string;
};

type ExpenseSplitter = {
  members: string[];
  expenses: Expense[];
};

type Comment = {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  targetDay: number;
  targetIndex: number;
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
  expenseSplitter?: ExpenseSplitter;
  comments?: Comment[];
  spotifyPlaylist?: string;
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

// 精算結果を計算する関数
function calculateSettlements(members: string[], expenses: Expense[]): { from: string; to: string; amount: number }[] {
  const balances: Record<string, number> = {};
  members.forEach(m => balances[m] = 0);

  expenses.forEach(expense => {
    const splitCount = expense.splitAmong.length;
    const perPerson = expense.amount / splitCount;
    balances[expense.paidBy] += expense.amount;
    expense.splitAmong.forEach(member => {
      balances[member] -= perPerson;
    });
  });

  const debtors: { name: string; amount: number }[] = [];
  const creditors: { name: string; amount: number }[] = [];

  Object.entries(balances).forEach(([name, balance]) => {
    if (balance < -1) {
      debtors.push({ name, amount: -balance });
    } else if (balance > 1) {
      creditors.push({ name, amount: balance });
    }
  });

  const settlements: { from: string; to: string; amount: number }[] = [];
  
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 1) {
      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(amount),
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 1) i++;
    if (creditor.amount < 1) j++;
  }

  return settlements;
}

// SpotifyのURLからIDを抽出
function extractSpotifyId(url: string): string | null {
  // https://open.spotify.com/playlist/xxxxx?si=yyyy
  const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
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

  // 割り勘計算機のstate
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [newExpense, setNewExpense] = useState({
    paidBy: "",
    description: "",
    amount: "",
    splitAmong: [] as string[],
  });

  // コメント機能のstate
  const [commentTarget, setCommentTarget] = useState<{ day: number; index: number } | null>(null);
  const [newComment, setNewComment] = useState({ author: "", text: "" });

  // Spotifyのstate
  const [showSpotifyForm, setShowSpotifyForm] = useState(false);
  const [spotifyUrl, setSpotifyUrl] = useState("");

  // 旅行日程
  const tripDates = {
    day1: "2026-01-11",
    day2: "2026-01-12", 
    day3: "2026-01-13",
  };

  // デフォルトメンバー
  const defaultMembers = ["和也", "こばお", "かいと", "さやか", "もえぎちゃん"];

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

  // 割り勘関連の関数
  const getMembers = () => {
    return tripData?.expenseSplitter?.members || defaultMembers;
  };

  const getExpenses = () => {
    return tripData?.expenseSplitter?.expenses || [];
  };

  const handleAddExpense = async () => {
    if (!tripData || !newExpense.paidBy || !newExpense.description || !newExpense.amount) {
      alert("すべての項目を入力してください");
      return;
    }

    const expense: Expense = {
      id: Date.now().toString(),
      paidBy: newExpense.paidBy,
      description: newExpense.description,
      amount: parseInt(newExpense.amount),
      splitAmong: newExpense.splitAmong.length > 0 ? newExpense.splitAmong : getMembers(),
      date: new Date().toISOString(),
    };

    const currentExpenses = getExpenses();
    const updatedExpenseSplitter = {
      members: getMembers(),
      expenses: [...currentExpenses, expense],
    };

    await updateDoc(doc(db, "trips", "hokkaido-2026"), {
      expenseSplitter: updatedExpenseSplitter,
      updatedAt: new Date().toISOString(),
    });

    setNewExpense({ paidBy: "", description: "", amount: "", splitAmong: [] });
    setShowExpenseForm(false);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!tripData) return;
    
    const currentExpenses = getExpenses();
    const updatedExpenses = currentExpenses.filter(e => e.id !== expenseId);
    
    await updateDoc(doc(db, "trips", "hokkaido-2026"), {
      expenseSplitter: {
        members: getMembers(),
        expenses: updatedExpenses,
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const toggleSplitMember = (member: string) => {
    setNewExpense(prev => ({
      ...prev,
      splitAmong: prev.splitAmong.includes(member)
        ? prev.splitAmong.filter(m => m !== member)
        : [...prev.splitAmong, member],
    }));
  };

  // コメント関連の関数
  const getComments = () => {
    return tripData?.comments || [];
  };

  const getCommentsForItem = (day: number, index: number) => {
    return getComments().filter(c => c.targetDay === day && c.targetIndex === index);
  };

  const handleAddComment = async () => {
    if (!tripData || !commentTarget || !newComment.author || !newComment.text) {
      alert("名前とコメントを入力してください");
      return;
    }

    const comment: Comment = {
      id: Date.now().toString(),
      author: newComment.author,
      text: newComment.text,
      timestamp: new Date().toISOString(),
      targetDay: commentTarget.day,
      targetIndex: commentTarget.index,
    };

    const currentComments = getComments();

    await updateDoc(doc(db, "trips", "hokkaido-2026"), {
      comments: [...currentComments, comment],
      updatedAt: new Date().toISOString(),
    });

    setNewComment({ author: "", text: "" });
    setCommentTarget(null);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!tripData) return;
    
    const updatedComments = getComments().filter(c => c.id !== commentId);
    
    await updateDoc(doc(db, "trips", "hokkaido-2026"), {
      comments: updatedComments,
      updatedAt: new Date().toISOString(),
    });
  };

  // Spotify関連の関数
  const handleSaveSpotify = async () => {
    if (!tripData || !spotifyUrl) return;

    const playlistId = extractSpotifyId(spotifyUrl);
    if (!playlistId) {
      alert("正しいSpotifyプレイリストのURLを入力してください");
      return;
    }

    await updateDoc(doc(db, "trips", "hokkaido-2026"), {
      spotifyPlaylist: playlistId,
      updatedAt: new Date().toISOString(),
    });

    setSpotifyUrl("");
    setShowSpotifyForm(false);
  };

  // 各日の天気を取得するヘルパー関数
  const getWeatherForDay = (dayNum: number): { forecast: DailyForecast | null; location: string } => {
    const dateKey = dayNum === 1 ? tripDates.day1 : dayNum === 2 ? tripDates.day2 : tripDates.day3;
    
    let locationKey = "sapporo";
    if (dayNum === 1) {
      locationKey = "jozankei";
    } else if (dayNum === 2) {
      locationKey = "rusutsu";
    } else {
      locationKey = "sapporo";
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

  const members = getMembers();
  const expenses = getExpenses();
  const settlements = calculateSettlements(members, expenses);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

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
            <button onClick={() => saveEdit("title")} className="text-[#4ecdc4]">✓</button>
            <button onClick={() => setEditingField(null)} className="text-[#ff6b9d]">✕</button>
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
        {/* Spotify Playlist */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-5 border border-white/20">
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection("spotify")}
          >
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>🎵</span> ドライブプレイリスト
            </h2>
            <span className={`opacity-40 transition-transform ${openSections.includes("spotify") ? "rotate-180" : ""}`}>
              ▼
            </span>
          </div>

          {openSections.includes("spotify") && (
            <div className="mt-4">
              {tripData.spotifyPlaylist ? (
                <div>
                  <iframe
                    src={`https://open.spotify.com/embed/playlist/${tripData.spotifyPlaylist}?utm_source=generator&theme=0`}
                    width="100%"
                    height="352"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="rounded-xl"
                  />
                  <button
                    onClick={() => setShowSpotifyForm(true)}
                    className="mt-3 text-sm text-[#4ecdc4] hover:underline"
                  >
                    プレイリストを変更
                  </button>
                </div>
              ) : showSpotifyForm ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={spotifyUrl}
                    onChange={(e) => setSpotifyUrl(e.target.value)}
                    placeholder="SpotifyプレイリストのURLを貼り付け"
                    className="w-full bg-white/10 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#1DB954]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveSpotify}
                      className="flex-1 py-2 bg-[#1DB954] text-white rounded-lg font-bold hover:bg-[#1ed760] transition"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setShowSpotifyForm(false)}
                      className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowSpotifyForm(true)}
                  className="w-full py-3 bg-[#1DB954]/20 text-[#1DB954] rounded-xl font-bold hover:bg-[#1DB954]/30 transition"
                >
                  🎵 プレイリストを追加
                </button>
              )}
            </div>
          )}
        </div>

        {/* Weather Forecast */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-5 border border-white/20">
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection("weather")}
          >
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>🌤️</span> 天気予報
            </h2>
            <span className={`opacity-40 transition-transform ${openSections.includes("weather") ? "rotate-180" : ""}`}>
              ▼
            </span>
          </div>

          {openSections.includes("weather") && (
            <div className="mt-4 space-y-4">
              {weatherLoading ? (
                <div className="text-center py-8 opacity-50">天気情報を取得中...</div>
              ) : (
                <>
                  <div>
                    <div className="text-sm text-[#4ecdc4] font-bold mb-2">1月11日（日）─ 支笏湖・定山渓</div>
                    <WeatherCard forecast={getWeatherForDay(1).forecast} />
                  </div>
                  <div>
                    <div className="text-sm text-[#ff6b9d] font-bold mb-2">1月12日（月）─ ルスツリゾート 🏂</div>
                    <WeatherCard forecast={getWeatherForDay(2).forecast} showSnowboard={true} />
                  </div>
                  <div>
                    <div className="text-sm text-[#4ecdc4] font-bold mb-2">1月13日（火）─ 札幌・新千歳</div>
                    <WeatherCard forecast={getWeatherForDay(3).forecast} />
                  </div>
                  <p className="text-xs text-center opacity-40 mt-4">※ Open-Meteo APIより取得（7日間予報）</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Expense Splitter */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-5 border border-white/20">
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection("expenses")}
          >
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>💸</span> 割り勘計算
            </h2>
            <span className={`opacity-40 transition-transform ${openSections.includes("expenses") ? "rotate-180" : ""}`}>
              ▼
            </span>
          </div>

          {openSections.includes("expenses") && (
            <div className="mt-4 space-y-4">
              {!showExpenseForm ? (
                <button
                  onClick={() => setShowExpenseForm(true)}
                  className="w-full py-3 bg-[#4ecdc4]/20 text-[#4ecdc4] rounded-xl font-bold hover:bg-[#4ecdc4]/30 transition"
                >
                  ＋ 支払いを追加
                </button>
              ) : (
                <div className="bg-white/5 rounded-xl p-4 space-y-4">
                  <div>
                    <label className="text-sm opacity-70 block mb-1">誰が払った？</label>
                    <div className="flex flex-wrap gap-2">
                      {members.map(member => (
                        <button
                          key={member}
                          onClick={() => setNewExpense(prev => ({ ...prev, paidBy: member }))}
                          className={`px-3 py-1 rounded-full text-sm transition ${
                            newExpense.paidBy === member ? "bg-[#4ecdc4] text-[#1a1a2e]" : "bg-white/10 hover:bg-white/20"
                          }`}
                        >
                          {member}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm opacity-70 block mb-1">何に使った？</label>
                    <input
                      type="text"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="例：夕食代、タクシー代"
                      className="w-full bg-white/10 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#4ecdc4]"
                    />
                  </div>
                  <div>
                    <label className="text-sm opacity-70 block mb-1">いくら？</label>
                    <input
                      type="number"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="金額を入力"
                      className="w-full bg-white/10 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#4ecdc4]"
                    />
                  </div>
                  <div>
                    <label className="text-sm opacity-70 block mb-1">誰で割る？（選択しないと全員）</label>
                    <div className="flex flex-wrap gap-2">
                      {members.map(member => (
                        <button
                          key={member}
                          onClick={() => toggleSplitMember(member)}
                          className={`px-3 py-1 rounded-full text-sm transition ${
                            newExpense.splitAmong.includes(member) ? "bg-[#ff6b9d] text-white" : "bg-white/10 hover:bg-white/20"
                          }`}
                        >
                          {member}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddExpense}
                      className="flex-1 py-2 bg-[#4ecdc4] text-[#1a1a2e] rounded-lg font-bold hover:bg-[#3dbdb5] transition"
                    >
                      追加
                    </button>
                    <button
                      onClick={() => {
                        setShowExpenseForm(false);
                        setNewExpense({ paidBy: "", description: "", amount: "", splitAmong: [] });
                      }}
                      className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              )}

              {expenses.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm text-[#4ecdc4] font-bold">支払い履歴</h3>
                  {expenses.map(expense => (
                    <div key={expense.id} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold">{expense.description}</div>
                        <div className="text-sm opacity-70">
                          {expense.paidBy} が支払い → {expense.splitAmong.length}人で割り勘
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold text-[#4ecdc4]">¥{expense.amount.toLocaleString()}</div>
                          <div className="text-xs opacity-50">
                            (¥{Math.round(expense.amount / expense.splitAmong.length).toLocaleString()}/人)
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-[#ff6b9d] hover:bg-[#ff6b9d]/20 p-1 rounded"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="bg-[#4ecdc4]/20 rounded-xl p-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">支払い合計</span>
                      <span className="text-xl font-bold text-[#4ecdc4]">¥{totalExpenses.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {settlements.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm text-[#ff6b9d] font-bold">💰 精算</h3>
                  <div className="bg-[#ff6b9d]/20 rounded-xl p-4 space-y-2">
                    {settlements.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{s.from}</span>
                          <span className="text-[#ff6b9d]">→</span>
                          <span className="font-bold">{s.to}</span>
                        </div>
                        <span className="font-bold text-[#ff6b9d]">¥{s.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {expenses.length === 0 && (
                <p className="text-center text-sm opacity-50 py-4">まだ支払い記録がありません</p>
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
            <span className={`opacity-40 transition-transform ${openSections.includes("flight") ? "rotate-180" : ""}`}>
              ▼
            </span>
          </div>

          {openSections.includes("flight") && (
            <div className="mt-4 space-y-4">
              <div className="bg-[#4ecdc4]/20 rounded-xl p-4">
                <div className="text-sm text-[#4ecdc4] mb-2">往路 ─ {tripData.flight.outbound.date}</div>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{tripData.flight.outbound.from.code}</div>
                    <div className="text-sm opacity-70">{tripData.flight.outbound.from.name}</div>
                    <div className="text-[#4ecdc4]">{tripData.flight.outbound.from.time}</div>
                  </div>
                  <div className="text-2xl">✈︎→</div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{tripData.flight.outbound.to.code}</div>
                    <div className="text-sm opacity-70">{tripData.flight.outbound.to.name}</div>
                    <div className="text-[#4ecdc4]">{tripData.flight.outbound.to.time}</div>
                  </div>
                </div>
                <div className="text-center text-sm opacity-70 mt-2">
                  {tripData.flight.outbound.airline} 直行便 {tripData.flight.outbound.duration}
                </div>
              </div>

              <div className="bg-[#4ecdc4]/20 rounded-xl p-4">
                <div className="text-sm text-[#4ecdc4] mb-2">復路 ─ {tripData.flight.inbound.date}</div>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{tripData.flight.inbound.from.code}</div>
                    <div className="text-sm opacity-70">{tripData.flight.inbound.from.name}</div>
                    <div className="text-[#4ecdc4]">{tripData.flight.inbound.from.time}</div>
                  </div>
                  <div className="text-2xl">✈︎→</div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{tripData.flight.inbound.to.code}</div>
                    <div className="text-sm opacity-70">{tripData.flight.inbound.to.name}</div>
                    <div className="text-[#4ecdc4]">{tripData.flight.inbound.to.time}</div>
                  </div>
                </div>
                <div className="text-center text-sm opacity-70 mt-2">
                  {tripData.flight.inbound.airline} 直行便 {tripData.flight.inbound.duration}
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
            <span className={`opacity-40 transition-transform ${openSections.includes("accommodation") ? "rotate-180" : ""}`}>
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
              <p className="mt-2 text-sm opacity-90">{tripData.accommodation.address}</p>
              {tripData.accommodation.mapUrl && <MapButton url={tripData.accommodation.mapUrl} />}
              <p className="mt-2 text-sm opacity-70">{tripData.accommodation.details}</p>
              <p className="text-sm opacity-70">★{tripData.accommodation.rating} ／ {tripData.accommodation.access}</p>
              <p className="text-sm opacity-70">
                チェックイン{tripData.accommodation.checkin} ／ チェックアウト{tripData.accommodation.checkout}
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
                {!weatherLoading && getWeatherForDay(day.day).forecast && (
                  <div className="text-2xl">{getWeatherForDay(day.day).forecast?.weatherIcon}</div>
                )}
                <span className={`opacity-40 transition-transform ${openDays.includes(day.day) ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </div>

              {openDays.includes(day.day) && (
                <div className="mt-4 ml-4 border-l-2 border-white/20 pl-4 space-y-4">
                  {day.timeline.map((item, idx) => {
                    const itemComments = getCommentsForItem(day.day, idx);
                    const isCommentTarget = commentTarget?.day === day.day && commentTarget?.index === idx;
                    
                    return (
                      <div
                        key={idx}
                        className={`relative ${
                          item.highlight
                            ? "bg-[#ff6b9d]/20 -ml-4 pl-4 py-2 rounded-r-xl border-l-2 border-[#ff6b9d]"
                            : ""
                        }`}
                      >
                        {item.time && (
                          <div className="text-xs text-[#4ecdc4] font-bold mb-1">{item.time}</div>
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
                            <span className="ml-2 text-xs bg-[#ff6b9d] px-2 py-1 rounded">{item.tag}</span>
                          )}
                        </div>
                        <div className="text-sm opacity-70 whitespace-pre-line">{item.desc}</div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          {item.mapUrl && <MapButton url={item.mapUrl} />}
                          <button
                            onClick={() => setCommentTarget(isCommentTarget ? null : { day: day.day, index: idx })}
                            className="inline-flex items-center gap-1 text-xs bg-[#6b89ff]/30 hover:bg-[#6b89ff]/50 text-[#6b89ff] px-2 py-1 rounded-full transition"
                          >
                            💬 {itemComments.length > 0 ? itemComments.length : ""}
                          </button>
                        </div>

                        {/* コメント表示 */}
                        {itemComments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {itemComments.map(comment => (
                              <div key={comment.id} className="bg-white/5 rounded-lg p-2 text-sm">
                                <div className="flex justify-between items-start">
                                  <span className="font-bold text-[#6b89ff]">{comment.author}</span>
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="text-xs opacity-50 hover:opacity-100"
                                  >
                                    ✕
                                  </button>
                                </div>
                                <p className="opacity-90">{comment.text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* コメント入力フォーム */}
                        {isCommentTarget && (
                          <div className="mt-2 bg-white/5 rounded-lg p-3 space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {members.map(member => (
                                <button
                                  key={member}
                                  onClick={() => setNewComment(prev => ({ ...prev, author: member }))}
                                  className={`px-2 py-1 rounded-full text-xs transition ${
                                    newComment.author === member
                                      ? "bg-[#6b89ff] text-white"
                                      : "bg-white/10 hover:bg-white/20"
                                  }`}
                                >
                                  {member}
                                </button>
                              ))}
                            </div>
                            <input
                              type="text"
                              value={newComment.text}
                              onChange={(e) => setNewComment(prev => ({ ...prev, text: e.target.value }))}
                              placeholder="コメントを入力..."
                              className="w-full bg-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#6b89ff]"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleAddComment}
                                className="flex-1 py-1 bg-[#6b89ff] text-white rounded-lg text-sm font-bold hover:bg-[#5a78ee] transition"
                              >
                                投稿
                              </button>
                              <button
                                onClick={() => {
                                  setCommentTarget(null);
                                  setNewComment({ author: "", text: "" });
                                }}
                                className="px-3 py-1 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition"
                              >
                                閉じる
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
              <span className={`opacity-40 transition-transform ${openSections.includes("saunas") ? "rotate-180" : ""}`}>
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
                      <span key={idx} className="bg-white/10 px-3 py-1 rounded-full text-sm">{name}</span>
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
                    item.done ? "bg-[#4ecdc4] border-[#4ecdc4] text-[#1a1a2e]" : "border-white/50"
                  }`}
                >
                  {item.done && "✓"}
                </button>
                <div>
                  <div className={item.done ? "line-through opacity-60" : "font-bold"}>{item.text}</div>
                  <div className={`text-sm ${item.done ? "text-[#4ecdc4]" : "opacity-70"}`}>
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
              <span className={`opacity-40 transition-transform ${openSections.includes("costs") ? "rotate-180" : ""}`}>
                ▼
              </span>
            </div>

            {openSections.includes("costs") && (
              <div className="mt-4 space-y-6">
                <div>
                  <h3 className="text-sm text-[#4ecdc4] font-bold mb-3">🚗 みんなで割り勘</h3>
                  <div className="space-y-2">
                    {tripData.costs.shared.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="opacity-90">
                          {item.label}
                          {item.note && <span className="text-xs opacity-50 ml-2">({item.note})</span>}
                        </span>
                        <span className="font-bold">{formatAmount(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 bg-[#4ecdc4]/20 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="opacity-70">合計</span>
                      <span className="font-bold">
                        ¥{tripData.costs.sharedTotal.min.toLocaleString()} 〜 ¥{tripData.costs.sharedTotal.max.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-lg">
                      <span className="text-[#4ecdc4]">{tripData.costs.perPerson.people}人で割ると</span>
                      <span className="font-bold text-[#4ecdc4]">
                        ¥{tripData.costs.perPerson.min.toLocaleString()} 〜 ¥{tripData.costs.perPerson.max.toLocaleString()}
                        <span className="text-sm opacity-70">/人</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm text-[#ff6b9d] font-bold mb-3">🎿 個人で払うもの</h3>
                  <div className="space-y-2">
                    {tripData.costs.individual.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-white/10">
                        <span className="opacity-90">{item.label}</span>
                        <span className="font-bold">{formatAmount(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 bg-[#ff6b9d]/20 rounded-xl p-4">
                    <div className="flex justify-between items-center text-lg">
                      <span className="text-[#ff6b9d]">個人負担 合計</span>
                      <span className="font-bold text-[#ff6b9d]">
                        ¥{tripData.costs.individual.reduce((sum, item) => {
                          if (typeof item.amount === "number") return sum + item.amount;
                          return sum;
                        }, 0).toLocaleString()}
                        <span className="text-sm opacity-70">/人</span>
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-center opacity-50">{tripData.costs.note}</p>
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
