import { db } from "./firebase";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { initialTripData } from "./initialData";

export async function seedDatabase() {
  try {
    await setDoc(doc(db, "trips", "hokkaido-2026"), initialTripData);
    console.log("データを投入しました！");
    return true;
  } catch (error) {
    console.error("エラー:", error);
    return false;
  }
}

// 地図URLとサウナ情報を更新する関数
export async function updateMapAndSaunaData() {
  try {
    const updatedDays = [
      {
        day: 1,
        date: "1月11日（日）",
        title: "新千歳空港 → 支笏湖 → 定山渓温泉 → 札幌",
        timeline: [
          { 
            time: "08:20", 
            title: "🛬 新千歳空港 到着", 
            desc: "荷物受け取り → 送迎バス待ち",
            mapUrl: "https://maps.google.com/?q=新千歳空港"
          },
          { 
            time: "09:30", 
            title: "🚗 ホンダレンタカー千歳店", 
            desc: "📞 0123-40-5353\n手続き（約30分）", 
            url: "https://www.hondarent.com/shop/chitose.php",
            mapUrl: "https://maps.google.com/?q=北海道千歳市真々地4丁目11番1号"
          },
          { 
            time: "10:00", 
            title: "🚗 支笏湖へ出発", 
            desc: "🚗 約45分", 
            isDrive: true 
          },
          { 
            time: "10:45 - 12:00", 
            title: "💎 支笏湖 観光", 
            desc: "透明度日本一級の湖！湖畔散策＆写真撮影\n※冬は「支笏湖氷濤まつり」準備中の可能性", 
            highlight: true,
            mapUrl: "https://maps.app.goo.gl/sYhGHbTo7Crbc2eB8"
          },
          { 
            time: "12:00", 
            title: "🚗 定山渓温泉へ出発", 
            desc: "🚗 約1時間15分", 
            isDrive: true 
          },
          { 
            time: "13:15 - 16:00", 
            title: "♨️🧖 定山渓温泉＆サウナ", 
            desc: "日帰り温泉でゆっくり「ととのう」！\nランチも温泉街で", 
            highlight: true,
            mapUrl: "https://maps.app.goo.gl/3Q4oHGokey6njx5d6"
          },
          { 
            time: "16:00", 
            title: "🚗 札幌（中島公園エリア）へ出発", 
            desc: "🚗 約45分", 
            isDrive: true 
          },
          { 
            time: "16:45", 
            title: "🏠 Airbnb チェックイン", 
            desc: "荷物を置いて少し休憩（チェックイン15:00〜）",
            mapUrl: "https://maps.google.com/?q=北海道札幌市中央区南12条西8丁目1-24+第37松井ビル"
          },
          { 
            time: "18:00頃", 
            title: "🦀 夜ごはん：二条市場で海鮮", 
            desc: "新鮮な海鮮料理！", 
            highlight: true,
            mapUrl: "https://maps.app.goo.gl/g3ySyf9XEgC3hA1T6"
          },
          { 
            time: "20:00頃", 
            title: "🍨 シメパフェ：佐々木", 
            desc: "札幌名物の締めパフェ（二条市場から徒歩2分）", 
            highlight: true,
            mapUrl: "https://maps.app.goo.gl/Sk5xQWJQBcYJPngi8"
          },
        ],
      },
      {
        day: 2,
        date: "1月12日（月）",
        title: "ルスツリゾート スノーボード",
        titleUrl: "https://rusutsu.com/trail-map/",
        timeline: [
          { 
            time: "07:00", 
            title: "🚗 宿を出発", 
            desc: "札幌（中島公園エリア）→ ルスツリゾート\n🚗 約1時間30分〜2時間", 
            isDrive: true 
          },
          { 
            time: "09:00頃", 
            title: "🎿 アミューズレンタル ルスツ", 
            desc: "〒048-1711 北海道虻田郡留寿都村泉川144-4\nスノボーレンタル手続き",
            mapUrl: "https://maps.app.goo.gl/qwqX2wDrmVMP3kyy8"
          },
          { 
            time: "09:30頃", 
            title: "🏂 ルスツリゾート到着", 
            desc: "準備して滑走開始！",
            mapUrl: "https://maps.app.goo.gl/aGrGFNbwpTcrwBs79"
          },
          { 
            time: "09:30 - 16:00", 
            title: "🏂 スノーボード！", 
            desc: "北海道最大級！37コース・パウダースノーを満喫", 
            highlight: true,
            mapUrl: "https://maps.app.goo.gl/aGrGFNbwpTcrwBs79"
          },
          { 
            time: "16:00 - 18:30", 
            title: "♨️ ルスツ温泉 ことぶきの湯", 
            desc: "日帰り入浴OK！幅20mの露天風呂＆サウナ\n大人¥1,500（タオル込）", 
            highlight: true,
            mapUrl: "https://maps.app.goo.gl/xH8nvgpWXbQPdrZc9"
          },
          { 
            time: "19:00", 
            title: "🚗 札幌へ出発", 
            desc: "🚗 約1時間45分〜2時間", 
            isDrive: true 
          },
          { 
            time: "21:00頃", 
            title: "🏠 Airbnb帰着", 
            desc: "お疲れ様！",
            mapUrl: "https://maps.google.com/?q=北海道札幌市中央区南12条西8丁目1-24+第37松井ビル"
          },
        ],
      },
      {
        day: 3,
        date: "1月13日（火）",
        title: "観光 → 新千歳空港",
        timeline: [
          { 
            time: "", 
            title: "🏙️ 日中観光", 
            desc: "小樽（定番）or その他", 
            tag: "要検討" 
          },
          { 
            time: "18:00", 
            title: "🚗 レンタカー返却", 
            desc: "ホンダレンタカー千歳店",
            mapUrl: "https://maps.google.com/?q=北海道千歳市真々地4丁目11番1号"
          },
          { 
            time: "21:00", 
            title: "✈️ 新千歳空港 出発", 
            desc: "羽田 22:40着",
            mapUrl: "https://maps.google.com/?q=新千歳空港"
          },
        ],
      },
    ];

    const updatedAccommodation = {
      name: "広々68㎡！すすきの徒歩圏内 (37-701)",
      address: "〒064-0912 北海道札幌市中央区南１２条西８丁目１−２４ 第３７松井ビル",
      details: "寝室2・ベッド8・68㎡・駐車場1台無料",
      rating: 4.89,
      access: "地下鉄中島公園駅 徒歩12分 ／ 市電中島公園通駅 徒歩5分",
      checkin: "15:00〜",
      checkout: "10:00",
      url: "https://www.airbnb.jp/rooms/1420651645550535631",
      mapUrl: "https://maps.google.com/?q=北海道札幌市中央区南12条西8丁目1-24+第37松井ビル",
    };

    const updatedSaunas = {
      infoUrl: "https://jozankei.jp/oneday/",
      recommended: [
        "定山渓ビューホテル",
        "定山渓万世閣ホテルミリオーネ",
        "定山渓 鹿の湯",
        "湯の花定山渓殿",
      ],
    };

    const updatedChecklist = [
      { text: "1日目の観光先", done: true, result: "支笏湖＆定山渓温泉（サウナ）に決定！" },
      { text: "移動手段", done: true, result: "レンタカーに決定！" },
      { text: "3日目の観光先", done: false, options: "小樽（定番）or その他" },
      { text: "海鮮料理のお店", done: true, result: "二条市場周辺に決定！" },
      { text: "定山渓のサウナ施設", done: false, options: "リンク先から選ぶ" },
    ];

    await updateDoc(doc(db, "trips", "hokkaido-2026"), {
      days: updatedDays,
      accommodation: updatedAccommodation,
      saunas: updatedSaunas,
      checklist: updatedChecklist,
      updatedAt: new Date().toISOString(),
    });
    
    console.log("地図URLとサウナ情報を更新しました！");
    return true;
  } catch (error) {
    console.error("エラー:", error);
    return false;
  }
}
