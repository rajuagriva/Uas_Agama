// kuis.js

let soalList = [];
let currentSoalIndex = 0;
let jawabanUser = [];
let jumlahSoal = 5;
let timerInterval;
let timeLeft;
let waktuSoal = []; // jika Anda butuh mencatat durasi per soal

// Firebase Firestore Initialization
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";

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
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    // Ambil jumlahSoal dari localStorage
    jumlahSoal = parseInt(localStorage.getItem('jumlahSoal')) || 5;

    // Fetch data soal dari Firestore
    fetchSoalFromFirestore()
        .then(() => {
            // 1. Acak soal (jika Anda mau) dan ambil "jumlahSoal" pertama
            soalList = soalList.sort(() => Math.random() - 0.5).slice(0, jumlahSoal);

            // 2. Inisialisasi array jawabanUser & waktuSoal
            jawabanUser = new Array(jumlahSoal).fill(undefined);
            waktuSoal = new Array(jumlahSoal).fill(0); // mencatat durasi

            // 3. Load soal pertama
            loadSoal(0);

            // 4. Mulai timer (contoh 40 detik x jumlahSoal)
            startTimer();

            // Render indikator dan progress
            renderIndikator();
            updateProgressBar();
        })
        .catch(err => {
            console.error('Error memuat soal:', err);
            alert('Terjadi kesalahan saat memuat soal.');
        });
});

// Fungsi untuk mengambil soal dari Firestore
async function fetchSoalFromFirestore() {
    try {
        const querySnapshot = await getDocs(collection(db, "soals"));
        querySnapshot.forEach((doc) => {
            soalList.push(doc.data());  // Simpan soal yang diambil dari Firestore
        });
    } catch (e) {
        console.error("Gagal mengambil data soal:", e);
        throw new Error("Gagal mengambil data soal");
    }
}

// Fungsi menampilkan soal
function loadSoal(index) {
    currentSoalIndex = index;
    const soal = soalList[index];

    document.getElementById('judulKuis').textContent = `Soal ${index + 1} dari ${jumlahSoal}`;
    document.getElementById('soal').textContent = soal.Soal;

    const container = document.getElementById('pilihanJawaban');
    container.innerHTML = '';

    // Tampilkan pilihan jawaban
    for (let key in soal.Pilihan_jawaban) {
        const div = document.createElement('div');
        div.classList.add('form-check');

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'pilihan';
        input.id = `pilihan${key}`;
        input.value = key;
        input.classList.add('form-check-input');

        // Jika user sudah pilih jawaban
        if (jawabanUser[index] === key) {
            input.checked = true;
        }

        const label = document.createElement('label');
        label.classList.add('form-check-label');
        label.htmlFor = `pilihan${key}`;
        label.textContent = soal.Pilihan_jawaban[key];

        div.appendChild(input);
        div.appendChild(label);
        container.appendChild(div);
    }

    updateNavigasi();
    renderIndikator();
    updateProgressBar();
}

// Navigasi
function updateNavigasi() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    prevBtn.disabled = (currentSoalIndex === 0);
    nextBtn.disabled = (currentSoalIndex === soalList.length - 1);
}

document.addEventListener('click', e => {
    if (e.target.matches('input[name="pilihan"]')) {
        jawabanUser[currentSoalIndex] = e.target.value;
        renderIndikator();
        updateProgressBar();
    }
});

document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentSoalIndex > 0) {
        currentSoalIndex--;
        loadSoal(currentSoalIndex);
    }
});

document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentSoalIndex < soalList.length - 1) {
        currentSoalIndex++;
        loadSoal(currentSoalIndex);
    }
});

// Tombol Selesai
document.getElementById('selesaikanBtn').addEventListener('click', () => {
    if (confirm('Yakin ingin menyelesaikan kuis?')) {
        selesaikanKuis();
    }
});

// Fungsi Selesai Kuis
function selesaikanKuis() {
    // Pastikan jawaban terakhir tersimpan
    const selected = document.querySelector('input[name="pilihan"]:checked');
    if (selected) {
        jawabanUser[currentSoalIndex] = selected.value;
    }

    // Hitung jumlah benar
    let jumlahBenar = 0;
    soalList.forEach((soal, idx) => {
        if (jawabanUser[idx] === soal.Jawaban_Benar) {
            jumlahBenar++;
        }
    });

    const persentase = ((jumlahBenar / soalList.length) * 100).toFixed(2);

    // Hentikan timer
    clearInterval(timerInterval);

    // Simpan hasil ke Firestore
    saveQuizResult(jumlahBenar, persentase);

    // Simpan ke riwayat (misalnya localStorage)
    simpanRiwayat(jumlahBenar, persentase);

    // Pindah ke halaman hasil
    window.location.href = 'hasil.html';
}

// Fungsi menyimpan hasil kuis ke Firestore
async function saveQuizResult(jumlahBenar, persentase) {
    const currentUser = localStorage.getItem('currentUser') || 'Anonymous';
    const hasilKuis = {
        user: currentUser,
        jumlahBenar,
        persentase,
        jawabanUser,
        jumlahSoal,
        soalList,
        timestamp: new Date()
    };

    try {
        await addDoc(collection(db, "quizResults"), hasilKuis);
        console.log("Hasil kuis berhasil disimpan ke Firestore!");
    } catch (e) {
        console.error("Gagal menyimpan hasil kuis:", e);
    }
}

// Fungsi menyimpan riwayat ke localStorage (opsional)
function simpanRiwayat(jumlahBenar, persentase) {
    const currentUser = localStorage.getItem('currentUser') || 'Anonymous';
    const riwayatKey = `riwayat_${currentUser}`;
    const riwayat = JSON.parse(localStorage.getItem(riwayatKey)) || [];

    const tanggal = new Date().toLocaleString();

    // Kumpulkan ID soal yang benar
    let soalBenar = [];
    soalList.forEach((soal, i) => {
        if (jawabanUser[i] === soal.Jawaban_Benar) {
            soalBenar.push(soal.ID);
        }
    });

    // ID semua soal yang ditampilkan
    const soalIDs = soalList.map(s => s.ID);

    riwayat.push({
        tanggal,
        jumlahBenar,
        persentase,
        jumlahSoal,
        soalBenar,
        jawabanUser,
        soalIDs,
        waktuSoal
    });

    localStorage.setItem(riwayatKey, JSON.stringify(riwayat));
}

// Timer (40 detik x jumlahSoal)
function startTimer() {
    timeLeft = jumlahSoal * 40;
    const timerElement = document.getElementById('timer');

    timerInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;

        timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert('Waktu habis!');
            selesaikanKuis();
        } else {
            timeLeft--;

            // Catat durasi per soal (opsional)
            if (waktuSoal[currentSoalIndex] !== undefined) {
                waktuSoal[currentSoalIndex]++;
            }
        }
    }, 1000);
}

// Update Progress Bar
function updateProgressBar() {
    const progressBar = document.querySelector('.progress-bar');
    if (!progressBar) return;

    const answered = jawabanUser.filter(v => v !== undefined).length;
    const pct = (answered / jumlahSoal) * 100;

    progressBar.style.width = `${pct}%`;
    progressBar.setAttribute('aria-valuenow', pct);
    progressBar.textContent = `${Math.round(pct)}% (${answered}/${jumlahSoal} Soal)`;
}

// Render Indikator Soal
function renderIndikator() {
    const container = document.getElementById('indikatorSoal');
    if (!container) return;

    container.innerHTML = '';
    for (let i = 0; i < jumlahSoal; i++) {
        const dot = document.createElement('div');
        dot.className = `indicator-dot ${(i === currentSoalIndex) ? 'active' : ''} 
                         ${(jawabanUser[i] !== undefined) ? 'answered' : ''}`;
        dot.textContent = i + 1;
        dot.addEventListener('click', () => {
            loadSoal(i);
        });
        container.appendChild(dot);
    }
}
