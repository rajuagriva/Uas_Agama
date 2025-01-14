// main.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('Main JS loaded');
});

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// Konfigurasi Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDRyIff2gv_ZaZA_UvrArw_nWTTsigMzf0",
    authDomain: "afdeling-409ff.firebaseapp.com",
    databaseURL: "https://afdeling-409ff.firebaseio.com",
    projectId: "afdeling-409ff",
    storageBucket: "afdeling-409ff.firebasestorage.app",
    messagingSenderId: "38168645544",
    appId: "1:38168645544:web:e7d7fa2eb3414213bf579d"
  };

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Inisialisasi Firestore
const db = getFirestore(app);

// Contoh: Menyimpan data hasil kuis ke Firestore
async function saveQuizResult(user, score) {
  try {
    const docRef = await addDoc(collection(db, "quizResults"), {
      user: user,
      score: score,
      timestamp: new Date()
    });
    console.log("Hasil kuis disimpan dengan ID:", docRef.id);
  } catch (e) {
    console.error("Gagal menyimpan hasil kuis:", e);
  }
}
