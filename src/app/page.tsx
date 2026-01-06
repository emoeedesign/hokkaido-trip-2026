"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { seedDatabase } from "@/lib/seedData";

type TimelineItem = {
  time: string;
  title: string;
  desc: string;
  url?: string;
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
  };
  days: DaySchedule[];
  spots: {
    sasaki: {
      name: string;
      address: string;
      phone: string;
      hours: string;
      closed: string;
    };
  };
  saunas: {
    name: string;
    feature: string;
    price: string;
    hours: string;
  }[];
  checklist: {
    text: string;
    done: boolean;
    result?: string;
    options?: string;
  }[];
  updatedAt: string;
};

export default function Home() {
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDays, setOpenDays] = useState<number[]>([1]);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

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
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

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

        {/* Last Updated */}
        <div className="text-center text-sm opacity-50">
          最終更新: {new Date(tripData.updatedAt).toLocaleString("ja-JP")}
        </div>
      </main>
    </div>
  );
}
