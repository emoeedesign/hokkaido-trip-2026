import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
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
