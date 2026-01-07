export const initialTripData = {
  title: "北海道旅行 2026",
  dates: "1月11日（日）〜 13日（火）",
  subtitle: "✨ 雪と温泉とスノーボード ✨",

  flight: {
    outbound: {
      date: "1月11日（日）",
      from: { code: "HND", name: "羽田空港", time: "06:45発" },
      to: { code: "CTS", name: "新千歳空港", time: "08:20着" },
      airline: "スカイマーク",
      duration: "1時間35分",
    },
    inbound: {
      date: "1月13日（火）",
      from: { code: "CTS", name: "新千歳空港", time: "21:00発" },
      to: { code: "HND", name: "羽田空港", time: "22:40着" },
      airline: "スカイマーク",
      duration: "1時間40分",
    },
  },

  accommodation: {
    name: "広々68㎡！すすきの徒歩圏内 (37-701)",
    address: "〒064-0912 北海道札幌市中央区南１２条西８丁目１−２４ 第３７松井ビル",
    details: "寝室2・ベッド8・68㎡・駐車場1台無料",
    rating: 4.89,
    access: "地下鉄中島公園駅 徒歩12分 ／ 市電中島公園通駅 徒歩5分",
    checkin: "15:00〜",
    checkout: "10:00",
    url: "https://www.airbnb.jp/rooms/1420651645550535631",
  },

  days: [
    {
      day: 1,
      date: "1月11日（日）",
      title: "新千歳空港 → 支笏湖 → 定山渓温泉 → 札幌",
      timeline: [
        { time: "08:20", title: "🛬 新千歳空港 到着", desc: "荷物受け取り → 送迎バス待ち" },
        { time: "09:30", title: "🚗 ホンダレンタカー新千歳空港店", desc: "📞 0123-40-5353\n手続き（約30分）", url: "https://www.hondarent.com/shop/chitose.php" },
        { time: "10:00", title: "🚗 支笏湖へ出発", desc: "🚗 約45分", isDrive: true },
        { time: "10:45 - 12:00", title: "💎 支笏湖 観光", desc: "透明度日本一級の湖！湖畔散策＆写真撮影\n※冬は「支笏湖氷濤まつり」準備中の可能性", highlight: true },
        { time: "12:00", title: "🚗 定山渓温泉へ出発", desc: "🚗 約1時間15分", isDrive: true },
        { time: "13:15 - 16:00", title: "♨️🧖 定山渓温泉＆サウナ", desc: "日帰り温泉でゆっくり「ととのう」！\nランチも温泉街で", highlight: true },
        { time: "16:00", title: "🚗 札幌（中島公園エリア）へ出発", desc: "🚗 約45分", isDrive: true },
        { time: "16:45", title: "🏠 Airbnb チェックイン", desc: "荷物を置いて少し休憩（チェックイン15:00〜）" },
        { time: "18:00頃", title: "🦀 夜ごはん：二条市場で海鮮", desc: "新鮮な海鮮料理！", highlight: true },
        { time: "20:00頃", title: "🍨 シメパフェ：佐々木", desc: "札幌名物の締めパフェ（二条市場から徒歩2分）", highlight: true },
      ],
    },
    {
      day: 2,
      date: "1月12日（月）",
      title: "ルスツリゾート スノーボード",
      titleUrl: "https://rusutsu.com/trail-map/",
      timeline: [
        { time: "07:00", title: "🚗 宿を出発", desc: "札幌（中島公園エリア）→ ルスツリゾート\n🚗 約1時間30分〜2時間", isDrive: true },
        { time: "09:00頃", title: "🎿 アミューズレンタル ルスツ", desc: "北海道虻田郡留寿都村字泉川144-4\nスノボーレンタル手続き" },
        { time: "09:30頃", title: "🏂 ルスツリゾート到着", desc: "準備して滑走開始！" },
        { time: "09:30 - 16:00", title: "🏂 スノーボード！", desc: "北海道最大級！37コース・パウダースノーを満喫", highlight: true },
        { time: "16:00 - 18:30", title: "♨️ ルスツ温泉 ことぶきの湯", desc: "日帰り入浴OK！幅20mの露天風呂＆サウナ\n大人¥1,500（タオル込）", highlight: true },
        { time: "19:00", title: "🚗 札幌へ出発", desc: "🚗 約1時間45分〜2時間", isDrive: true },
        { time: "21:00頃", title: "🏠 Airbnb帰着", desc: "お疲れ様！" },
      ],
    },
    {
      day: 3,
      date: "1月13日（火）",
      title: "観光 → 新千歳空港",
      timeline: [
        { time: "", title: "🏙️ 日中観光", desc: "小樽（定番）or その他", tag: "要検討" },
        { time: "18:00", title: "🚗 レンタカー返却", desc: "ホンダレンタカー新千歳空港店" },
        { time: "21:00", title: "✈️ 新千歳空港 出発", desc: "羽田 22:40着" },
      ],
    },
  ],

  spots: {
    sasaki: {
      name: "パフェ、珈琲、酒、佐々木",
      address: "札幌市中央区南2条西1丁目8-2 アスカビル B1F",
      phone: "011-212-1375",
      hours: "18:00〜24:00（金土祝前〜25:00）",
      closed: "火曜日 ※日曜は営業◎",
    },
  },

  saunas: [
    { name: "定山渓温泉 湯の花（日帰り専門）", feature: "有名熱波師監修！オートロウリュ1時間に3回\n源泉100%の水風呂、開放的な外気浴", price: "¥980", hours: "10:00〜21:00 ／ 駐車場400台" },
    { name: "定山渓万世閣ホテルミリオーネ", feature: "2024年リニューアル！8分毎オートロウリュ\n水深1.1mの水風呂、外気浴インフィニティチェア", price: "¥1,200〜1,500", hours: "7:00〜10:00 / 12:00〜20:00" },
    { name: "定山渓 鹿の湯", feature: "4段スタジアム型サウナ！20分毎オートロウリュ\n豊平川源流の沢水かけ流し水風呂（8〜9℃＆15〜17℃）", price: "¥1,500", hours: "13:00〜 ／ 日帰り入浴OK" },
  ],

  checklist: [
    { text: "1日目の観光先", done: true, result: "支笏湖＆定山渓温泉（サウナ）に決定！" },
    { text: "移動手段", done: true, result: "レンタカーに決定！" },
    { text: "3日目の観光先", done: false, options: "小樽（定番）or その他" },
    { text: "海鮮料理のお店", done: true, result: "二条市場周辺に決定！" },
    { text: "定山渓のサウナ施設", done: false, options: "湯の花・ミリオーネ・鹿の湯から選ぶ" },
  ],

  costs: {
    shared: [
      { label: "レンタカー", amount: 31000 },
      { label: "交通費（ガソリン・高速・駐車場）", amount: "10,000〜15,000", note: "変動あり" },
      { label: "宿泊費用", amount: 49000 },
    ],
    sharedTotal: { min: 90000, max: 95000 },
    perPerson: { people: 5, min: 18000, max: 19000 },
    individual: [
      { label: "リフト券", amount: 12000 },
      { label: "ボードレンタル", amount: 5300 },
    ],
    note: "※計算しやすいように端数を切り上げてます",
  },

  updatedAt: new Date().toISOString(),
};
