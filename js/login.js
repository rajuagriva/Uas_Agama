// login.js

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
    console.log('Login JS loaded');

    // Jika pengguna sudah login
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = 'home.html'; // Ganti dengan halaman yang sesuai
    }

    // Tombol login
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.addEventListener('click', handleLogin);
});

// Fungsi untuk login
async function handleLogin() {
    const username = document.getElementById('username').value;
    if (!username) {
        alert('Silakan masukkan nama pengguna.');
        return;
    }

    try {
        // Cek apakah user sudah ada di Firestore
        const userRef = doc(db, "users", username);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            console.log("Pengguna ditemukan:", userDoc.data());
        } else {
            // Jika pengguna tidak ditemukan, buat data baru
            await setDoc(userRef, {
                lastLogin: new Date()
            });
            console.log("Pengguna baru ditambahkan.");
        }

        // Simpan username ke localStorage dan redirect ke halaman utama
        localStorage.setItem('currentUser', username);
        window.location.href = 'home.html'; // Ganti dengan halaman yang sesuai
    } catch (error) {
        console.error("Error login:", error);
        alert("Terjadi kesalahan saat login.");
    }
}
