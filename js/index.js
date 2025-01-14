// index.js

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc } from "firebase/firestore";

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

document.addEventListener('DOMContentLoaded', () => {
    console.log('Main JS loaded');

    // Ambil data user
    const currentUser = localStorage.getItem('currentUser') || 'Anonymous';

    // Ambil riwayat kuis dari Firestore
    getUserQuizHistory(currentUser);
});

// Fungsi untuk mengambil riwayat kuis dari Firestore
async function getUserQuizHistory(user) {
    const riwayatRef = collection(db, "quizResults");
    const q = query(riwayatRef, where("user", "==", user));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.log("Tidak ada riwayat kuis untuk user ini.");
        // Anda bisa arahkan ke halaman login atau tampilkan pesan
    } else {
        querySnapshot.forEach((doc) => {
            console.log(doc.id, " => ", doc.data());
            // Proses data kuis yang diambil
            const quizResult = doc.data();
            // Lakukan sesuatu dengan data hasil kuis
        });
    }
}

// Fungsi untuk menyimpan hasil kuis ke Firestore
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
