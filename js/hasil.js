// hasil.js

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
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Variabel global
let currentUser = 'Anonymous';
let jumlahSoal = 0;

document.addEventListener('DOMContentLoaded', () => {
    // Ambil currentUser dan jumlahSoal dari localStorage
    currentUser = localStorage.getItem('currentUser') || 'Anonymous';
    jumlahSoal = parseInt(localStorage.getItem('jumlahSoal')) || 5;

    // Update nama pengguna di UI
    document.getElementById('namaPengguna').textContent = `Hasil Kuis Anda - ${currentUser}`;

    // Ambil hasil kuis terakhir dari Firestore
    getLatestQuizResult(currentUser)
        .then(sesiTerakhir => {
            if (!sesiTerakhir) {
                alert('Tidak ada hasil kuis untuk ditampilkan.');
                window.location.href = 'login.html';
                return;
            }

            // Ambil data soal dari Firestore berdasarkan soalIDs
            return getSoalFromFirestore(sesiTerakhir.soalIDs)
                .then(allSoal => {
                    // Ambil soal yang sesuai dengan sesiTerakhir.soalIDs
                    let selectedSoal = allSoal.filter(s => sesiTerakhir.soalIDs.includes(s.ID));

                    // Sort soal agar urutannya sama dengan soalIDs
                    selectedSoal.sort((a, b) => {
                        return sesiTerakhir.soalIDs.indexOf(a.ID) - sesiTerakhir.soalIDs.indexOf(b.ID);
                    });

                    // Ambil jumlahSoal sesuai sesiTerakhir
                    selectedSoal = selectedSoal.slice(0, sesiTerakhir.jumlahSoal);

                    // Tampilkan hasil kuis di UI
                    tampilHasilSesiTerakhir(selectedSoal, sesiTerakhir);

                    // Tampilkan riwayat kuis di UI
                    tampilRiwayat(currentUser);

                    // Tampilkan grafik durasi
                    if (selectedSoal.length > 0) {
                        generateGrafikWaktu(sesiTerakhir, selectedSoal);
                    }

                    // Tampilkan grafik performa
                    generateGrafikPerforma(currentUser);

                    // Tampilkan progress bar kategori
                    tampilProgressBarKategoriAkumulasi(currentUser);
                });
        })
        .catch(err => {
            console.error('Error memuat hasil kuis:', err);
            alert('Terjadi kesalahan saat memuat hasil kuis.');
        });

    // Tombol Ulang Kuis
    document.getElementById('ulangKuisBtn').addEventListener('click', () => {
        window.location.href = 'jumlah_soal.html';
    });

    // Tombol Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        // Logout: clear localStorage dan redirect
        localStorage.clear();
        window.location.href = 'login.html';
    });

    // Export
    document.getElementById('exportPdfBtn').addEventListener('click', exportPDF);
    document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);
});

// Fungsi untuk mengambil hasil kuis terakhir dari Firestore
async function getLatestQuizResult(userId) {
    try {
        const hasilKuisRef = db.collection('hasilKuis')
            .where('userId', '==', userId)
            .orderBy('tanggal', 'desc')
            .limit(1);
        const snapshot = await hasilKuisRef.get();
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return doc.data();
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error mengambil hasil kuis terakhir:', error);
        return null;
    }
}

// Fungsi untuk mengambil data soal dari Firestore berdasarkan soalIDs
async function getSoalFromFirestore(soalIDs) {
    try {
        // Firestore 'in' query dapat menampung maksimal 10 items
        // Jika soalIDs lebih dari 10, lakukan multiple queries
        const chunkedSoalIDs = chunkArray(soalIDs, 10);
        let allSoal = [];

        for (let chunk of chunkedSoalIDs) {
            const soalRef = db.collection('soal').where('ID', 'in', chunk);
            const snapshot = await soalRef.get();
            snapshot.forEach(doc => {
                allSoal.push(doc.data());
            });
        }

        return allSoal;
    } catch (error) {
        console.error('Error mengambil soal dari Firestore:', error);
        return [];
    }
}

// Fungsi untuk memecah array menjadi chunk
function chunkArray(array, size) {
    const results = [];
    for (let i = 0; i < array.length; i += size) {
        results.push(array.slice(i, i + size));
    }
    return results;
}

// Fungsi untuk menampilkan hasil sesi terakhir
function tampilHasilSesiTerakhir(soalList, sesiTerakhir) {
    const detailJawaban = document.getElementById('detailJawaban');
    if (!detailJawaban) return;
    detailJawaban.innerHTML = '';

    let totalWaktu = 0;
    let jumlahBenar = 0;

    let fastestSoal = { nomor: -1, waktu: Infinity };
    let slowestSoal = { nomor: -1, waktu: 0 };

    soalList.forEach((soal, i) => {
        const userAnswer = sesiTerakhir.jawabanUser[i];
        const benar = (userAnswer === soal.Jawaban_Benar);
        if (benar) jumlahBenar++;

        // Waktu
        let waktu = 0;
        if (sesiTerakhir.waktuSoal && sesiTerakhir.waktuSoal[i] !== undefined) {
            waktu = parseInt(sesiTerakhir.waktuSoal[i]) || 0;
        }
        totalWaktu += waktu;

        // Fastest/slowest
        if (waktu < fastestSoal.waktu) {
            fastestSoal.nomor = i + 1;
            fastestSoal.waktu = waktu;
        }
        if (waktu > slowestSoal.waktu) {
            slowestSoal.nomor = i + 1;
            slowestSoal.waktu = waktu;
        }

        // Teks jawaban user
        let jawabanAnda = 'Tidak Dijawab';
        if (userAnswer) {
            jawabanAnda = soal.Pilihan_jawaban[userAnswer] || 'Tidak Dijawab';
        }
        const jawabanBenarText = soal.Pilihan_jawaban[soal.Jawaban_Benar] || '-';

        // Buat row
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${i + 1}</td>
            <td>${soal.Soal}</td>
            <td class="${benar ? 'text-success' : 'text-danger'}">${jawabanAnda}</td>
            <td>${jawabanBenarText}</td>
            <td>${waktu}</td>
        `;
        if (benar) row.classList.add('text-success');
        else row.classList.add('text-danger');

        detailJawaban.appendChild(row);
    });

    const totalSoal = sesiTerakhir.jumlahSoal;
    const persentase = ((jumlahBenar / totalSoal) * 100).toFixed(2);

    document.getElementById("jumlahBenar").textContent = `${jumlahBenar} dari ${totalSoal}`;
    document.getElementById("persentaseSkor").textContent = `${persentase}%`;

    // Perubahan skor vs sesi sebelumnya
    // Fetch all quiz results for the user
    getAllQuizResults(currentUser)
        .then(allResults => {
            if (allResults.length > 1) {
                const sesiSebelumnya = allResults[allResults.length - 2];
                const perubahan = (persentase - sesiSebelumnya.persentase).toFixed(2);
                const perubahanText =
                    (perubahan > 0) ? `↑ ${perubahan}%`
                    : (perubahan < 0) ? `↓ ${Math.abs(perubahan)}%`
                    : `0%`;

                const perubahanElem = document.getElementById('perubahanSkor');
                perubahanElem.textContent = `Perubahan dari sesi sebelumnya: ${perubahanText}`;

                if (perubahan > 0) {
                    perubahanElem.className = 'text-success';
                } else if (perubahan < 0) {
                    perubahanElem.className = 'text-danger';
                } else {
                    perubahanElem.className = 'text-secondary';
                }
            }
        })
        .catch(err => {
            console.error('Error memuat perubahan skor:', err);
        });

    // Waktu Rata-rata
    let avgTime = (soalList.length > 0) ? (totalWaktu / soalList.length).toFixed(2) : 0;
    document.getElementById("waktuRataRata").textContent = `${avgTime} detik`;

    // Soal Tercepat
    if (fastestSoal.nomor === -1) {
        document.getElementById("soalTercepat").textContent = 'Tidak ada data waktu.';
    } else {
        document.getElementById("soalTercepat").textContent =
            `Nomor Soal: ${fastestSoal.nomor}, Waktu: ${fastestSoal.waktu} detik`;
    }

    // Soal Terlama
    if (slowestSoal.nomor === -1 || slowestSoal.waktu === 0) {
        document.getElementById("soalTerlama").textContent = 'Tidak ada data waktu.';
    } else {
        document.getElementById("soalTerlama").textContent =
            `Nomor Soal: ${slowestSoal.nomor}, Waktu: ${slowestSoal.waktu} detik`;
    }
}

// Fungsi untuk mengambil semua hasil kuis dari Firestore
async function getAllQuizResults(userId) {
    try {
        const hasilKuisRef = db.collection('hasilKuis')
            .where('userId', '==', userId)
            .orderBy('tanggal', 'asc');
        const snapshot = await hasilKuisRef.get();
        const hasilList = [];
        snapshot.forEach(doc => {
            hasilList.push(doc.data());
        });
        return hasilList;
    } catch (error) {
        console.error('Error mengambil semua hasil kuis:', error);
        return [];
    }
}

// Fungsi untuk menampilkan riwayat kuis
async function tampilRiwayat(userId) {
    const riwayatKuis = document.getElementById('riwayatKuis');
    if (!riwayatKuis) return;
    riwayatKuis.innerHTML = '';

    try {
        const semuaHasil = await getAllQuizResults(userId);
        semuaHasil.forEach(entry => {
            const row = riwayatKuis.insertRow();
            const tanggal = entry.tanggal.toDate().toLocaleString();
            row.insertCell(0).textContent = tanggal;
            row.insertCell(1).textContent = entry.jumlahBenar;
            row.insertCell(2).textContent = entry.persentase + "%";
        });
    } catch (error) {
        console.error('Error menampilkan riwayat kuis:', error);
    }
}

// ----------------------
// 3. Grafik Durasi
// ----------------------
function generateGrafikWaktu(sesiTerakhir, soalList) {
    const canvas = document.getElementById('grafikWaktu');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const labels = soalList.map((_, i) => `Soal ${i + 1}`);
    const dataWaktu = soalList.map((soal, i) => {
        if (!sesiTerakhir.waktuSoal) return 0;
        return parseInt(sesiTerakhir.waktuSoal[i]) || 0;
    });

    const backgroundColors = soalList.map((soal, i) => {
        const userAnswer = sesiTerakhir.jawabanUser[i];
        return (userAnswer === soal.Jawaban_Benar) 
            ? 'rgba(54, 162, 235, 0.6)'
            : 'rgba(255, 99, 132, 0.6)';
    });
    const borderColors = backgroundColors.map(c => c.replace('0.6', '1'));

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Waktu Pengerjaan (detik)',
                data: dataWaktu,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: ctx => `Waktu: ${ctx.parsed.y} detik`
                    }
                },
                title: {
                    display: true,
                    text: 'Grafik Durasi Pengerjaan per Soal'
                },
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// ----------------------
// 4. Grafik Performa
// ----------------------
async function generateGrafikPerforma(userId) {
    const canvas = document.getElementById('grafikPerforma');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    try {
        const semuaHasil = await getAllQuizResults(userId);
        const labels = semuaHasil.map((_, i) => `Sesi ${i + 1}`);
        const data = semuaHasil.map(r => parseFloat(r.persentase));

        new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Persentase Skor',
                        data,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Rata-rata Pengguna',
                        data: labels.map(() => 70), // Contoh, ganti dengan data rata-rata pengguna
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderDash: [5, 5],
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}%`
                        }
                    },
                    title: {
                        display: true,
                        text: 'Grafik Performa Seiring Waktu'
                    }
                },
                scales: {
                    y: { beginAtZero: true, max: 100 }
                }
            }
        });
    } catch (error) {
        console.error('Error generateGrafikPerforma:', error);
    }
}

// ----------------------
// 5. Progress Bar Akumulasi per Kategori
// ----------------------
async function tampilProgressBarKategoriAkumulasi(userId) {
    const container = document.getElementById('progressBarsKategori');
    if (!container) return;
    container.innerHTML = '';

    try {
        // Ambil semua hasil kuis untuk user
        const semuaHasil = await getAllQuizResults(userId);

        // Ambil semua soal dari Firestore untuk mendapatkan kategori
        const allSoalSnapshot = await db.collection('soal').get();
        const allSoal = {};
        allSoalSnapshot.forEach(doc => {
            allSoal[doc.data().ID] = doc.data();
        });

        // Hitung total soal per kategori dan total benar per kategori
        const totalSoalPerKategori = {};
        const totalBenarPerKategori = {};

        semuaHasil.forEach(entry => {
            entry.soalIDs.forEach((soalID, i) => {
                const soal = allSoal[soalID];
                if (soal) {
                    const kategori = soal.Kategori || 'Lainnya';
                    totalSoalPerKategori[kategori] = (totalSoalPerKategori[kategori] || 0) + 1;
                    if (entry.jawabanUser[i] === soal.Jawaban_Benar) {
                        totalBenarPerKategori[kategori] = (totalBenarPerKategori[kategori] || 0) + 1;
                    }
                }
            });
        });

        // Tampilkan progress bar per kategori
        Object.keys(totalSoalPerKategori).forEach(kat => {
            const totalSoalKat = totalSoalPerKategori[kat];
            const totalBenarKat = totalBenarPerKategori[kat] || 0;
            const persen = (totalSoalKat > 0)
                ? ((totalBenarKat / totalSoalKat) * 100).toFixed(2)
                : 0;

            const wrapper = document.createElement('div');
            wrapper.classList.add('mb-3');

            const label = document.createElement('h5');
            label.textContent = `${kat} (${totalBenarKat}/${totalSoalKat}) = ${persen}%`;
            wrapper.appendChild(label);

            const progressDiv = document.createElement('div');
            progressDiv.classList.add('progress');
            progressDiv.style.height = '25px';

            const bar = document.createElement('div');
            bar.classList.add('progress-bar');
            bar.setAttribute('role', 'progressbar');
            bar.setAttribute('aria-valuenow', persen);
            bar.setAttribute('aria-valuemin', '0');
            bar.setAttribute('aria-valuemax', '100');
            bar.style.width = `${persen}%`;
            bar.textContent = `${persen}%`;

            progressDiv.appendChild(bar);
            wrapper.appendChild(progressDiv);

            container.appendChild(wrapper);
        });

    } catch (error) {
        console.error('Error tampilProgressBarKategoriAkumulasi:', error);
    }
}

// Fungsi untuk mengexport hasil kuis ke PDF
function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Hasil Kuis Anda', 14, 22);

    doc.setFontSize(12);
    doc.text(`Jumlah Benar: ${document.getElementById('jumlahBenar').innerText}`, 14, 32);
    doc.text(`Persentase Skor: ${document.getElementById('persentaseSkor').innerText}`, 14, 40);

    // Detail Jawaban
    doc.text('Detail Jawaban:', 14, 50);
    let y = 60;
    const rows = document.getElementById('detailJawaban').querySelectorAll('tr');
    rows.forEach(row => {
        const cols = row.querySelectorAll('td');
        const rowData = `"${cols[0].innerText}","${cols[1].innerText}","${cols[2].innerText}","${cols[3].innerText}","${cols[4].innerText}"`;
        doc.text(rowData, 14, y);
        y += 10;
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
    });

    doc.save('hasil_kuis.pdf');
}

// Fungsi untuk mengexport hasil kuis ke CSV
function exportCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "No,Soal,Jawaban Anda,Jawaban Benar,Waktu (detik)\n";

    const rows = document.getElementById('detailJawaban').querySelectorAll('tr');
    rows.forEach(row => {
        const cols = row.querySelectorAll('td');
        const rowData = [
            `"${cols[0].innerText}"`,
            `"${cols[1].innerText}"`,
            `"${cols[2].innerText}"`,
            `"${cols[3].innerText}"`,
            `"${cols[4].innerText}"`
        ].join(',');
        csvContent += rowData + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "hasil_kuis.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
