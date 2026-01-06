import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDmu9drGOroNTjbW5RLL_EbkbfHkBrzS1Q",
  authDomain: "hokkaido-trip-2026-61c2e.firebaseapp.com",
  projectId: "hokkaido-trip-2026-61c2e",
  storageBucket: "hokkaido-trip-2026-61c2e.firebasestorage.app",
  messagingSenderId: "954671780596",
  appId: "1:954671780596:web:90ccf900f0c2b9227e44a1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);