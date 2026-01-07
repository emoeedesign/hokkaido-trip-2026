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

// 費用データだけを追加する関数
export async function addCostsData() {
  try {
    const costsData = {
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
    };

    await updateDoc(doc(db, "trips", "hokkaido-2026"), {
      costs: costsData,
      updatedAt: new Date().toISOString(),
    });
    
    console.log("費用データを追加しました！");
    return true;
  } catch (error) {
    console.error("エラー:", error);
    return false;
  }
}