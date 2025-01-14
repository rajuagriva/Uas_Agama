// jumlah_soal.js

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

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
    console.log('Jumlah Soal JS loaded');

    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'login.html'; // Redirect jika belum login
    }

    // Ambil data jumlah soal yang sudah dipilih sebelumnya dari Firestore
    getUserQuizData(currentUser);

    // Tombol submit jumlah soal
    const submitBtn = document.getElementById('submitJumlahSoalBtn');
    submitBtn.addEventListener('click', handleJumlahSoalSubmit);
});

// Fungsi untuk mengambil data jumlah soal dari Firestore
async function getUserQuizData(user) {
    try {
        const userRef = doc(db, "users", user);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const jumlahSoal = userData.jumlahSoal || 5; // Default 5 soal jika belum ada data
            document.getElementById('jumlahSoalInput').value = jumlahSoal;
        } else {
            console.log("Pengguna tidak ditemukan di Firestore");
        }
    } catch (error) {
        console.error("Error mengambil data jumlah soal:", error);
    }
}

// Fungsi untuk menyimpan jumlah soal yang dipilih oleh pengguna
async function handleJumlahSoalSubmit() {
    const currentUser = localStorage.getItem('currentUser');
    const jumlahSoal = document.getElementById('jumlahSoalInput').value;

    if (!jumlahSoal || isNaN(jumlahSoal) || jumlahSoal < 1) {
        alert('Silakan pilih jumlah soal yang valid.');
        return;
    }

    try {
        // Update jumlah soal di Firestore
        const userRef = doc(db, "users", currentUser);
        await setDoc(userRef, { jumlahSoal: parseInt(jumlahSoal) }, { merge: true });

        // Simpan jumlah soal ke localStorage untuk kebutuhan selanjutnya
        localStorage.setItem('jumlahSoal', jumlahSoal);

        console.log("Jumlah soal berhasil disimpan di Firestore.");
        window.location.href = 'quiz.html'; // Redirect ke halaman quiz
    } catch (error) {
        console.error("Error menyimpan jumlah soal:", error);
        alert("Terjadi kesalahan saat menyimpan jumlah soal.");
    }
}
