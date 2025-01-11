// hasil.js

let currentUser = 'Anonymous';
let jumlahSoal = 0;

document.addEventListener('DOMContentLoaded', () => {
    currentUser = localStorage.getItem('currentUser') || 'Anonymous';
    jumlahSoal = parseInt(localStorage.getItem('jumlahSoal')) || 5;

    document.getElementById('namaPengguna').textContent = `Hasil Kuis Anda - ${currentUser}`;

    // Ambil riwayat user
    const riwayatKey = `riwayat_${currentUser}`;
    const riwayat = JSON.parse(localStorage.getItem(riwayatKey)) || [];
    if (riwayat.length === 0) {
        alert('Tidak ada hasil kuis untuk ditampilkan.');
        window.location.href = 'login.html';
        return;
    }

    // Ambil sesi terakhir
    const sesiTerakhir = riwayat[riwayat.length - 1];

    // Fetch soal.json
    fetch('data/soal.json')
        .then(res => res.json())
        .then(allSoal => {
            // 1. Ambil semua soal sesuai ID di sesiTerakhir.soalIDs (TANPA re-random)
            let selectedSoal = allSoal.filter(s => sesiTerakhir.soalIDs.includes(s.ID));

            // 2. Sort agar urutannya sama dengan urutan di `soalIDs`
            selectedSoal.sort((a, b) => {
                return sesiTerakhir.soalIDs.indexOf(a.ID) - sesiTerakhir.soalIDs.indexOf(b.ID);
            });

            // Hanya ambil `jumlahSoal` sesuai data sesi
            selectedSoal = selectedSoal.slice(0, sesiTerakhir.jumlahSoal);

            // 3. Tampilkan hasil
            tampilHasilSesiTerakhir(selectedSoal, sesiTerakhir);

            // 4. Tampilkan riwayat
            tampilRiwayat(riwayat);

            // 5. Grafik Durasi (jika ada data)
            if (selectedSoal.length > 0) {
                generateGrafikWaktu(sesiTerakhir, selectedSoal);
            }

            // 6. Grafik Performa
            generateGrafikPerforma(riwayat);

            // 7. Progress Bar Kategori
            tampilProgressBarKategoriAkumulasi(allSoal, riwayat);
        })
        .catch(err => console.error('Error memuat soal:', err));

    // Tombol
    document.getElementById('ulangKuisBtn').addEventListener('click', () => {
        localStorage.removeItem('jawabanUser');
        window.location.href = 'jumlah_soal.html';
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });

    // Export
    document.getElementById('exportPdfBtn').addEventListener('click', exportPDF);
    document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);
});

// ----------------------
// 1. Tampil Hasil Sesi Terakhir
// ----------------------
function tampilHasilSesiTerakhir(soalList, sesiTerakhir) {
    const detailJawaban = document.getElementById('detailJawaban');
    if (!detailJawaban) return;
    detailJawaban.innerHTML = '';

    let totalWaktu = 0;
    let jumlahBenar = 0;

    let fastestSoal = { nomor: -1, waktu: Infinity };
    let slowestSoal = { nomor: -1, waktu: 0 };

    // Loop soalList dengan index = i
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

    document.getElementById('jumlahBenar').textContent = `${jumlahBenar} dari ${totalSoal}`;
    document.getElementById('persentaseSkor').textContent = `${persentase}%`;

    // Perubahan skor vs sesi sebelumnya
    const riwayat = JSON.parse(localStorage.getItem(`riwayat_${currentUser}`)) || [];
    if (riwayat.length > 1) {
        const sesiSebelumnya = riwayat[riwayat.length - 2];
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

    // Waktu Rata-rata
    let avgTime = (soalList.length > 0) ? (totalWaktu / soalList.length).toFixed(2) : 0;
    document.getElementById('waktuRataRata').textContent = `${avgTime} detik`;

    // Soal Tercepat
    if (fastestSoal.nomor === -1) {
        document.getElementById('soalTercepat').textContent = 'Tidak ada data waktu.';
    } else {
        document.getElementById('soalTercepat').textContent =
            `Nomor Soal: ${fastestSoal.nomor}, Waktu: ${fastestSoal.waktu} detik`;
    }

    // Soal Terlama
    if (slowestSoal.nomor === -1 || slowestSoal.waktu === 0) {
        document.getElementById('soalTerlama').textContent = 'Tidak ada data waktu.';
    } else {
        document.getElementById('soalTerlama').textContent =
            `Nomor Soal: ${slowestSoal.nomor}, Waktu: ${slowestSoal.waktu} detik`;
    }
}

// ----------------------
// 2. Riwayat
// ----------------------
function tampilRiwayat(riwayat) {
    const riwayatKuis = document.getElementById('riwayatKuis');
    if (!riwayatKuis) return;
    riwayatKuis.innerHTML = '';

    riwayat.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.tanggal}</td>
            <td>${entry.jumlahBenar}</td>
            <td>${entry.persentase}%</td>
        `;
        riwayatKuis.appendChild(row);
    });
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
function generateGrafikPerforma(riwayat) {
    const canvas = document.getElementById('grafikPerforma');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const labels = riwayat.map((_, i) => `Sesi ${i + 1}`);
    const data = riwayat.map(r => parseFloat(r.persentase));

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
                    data: labels.map(() => 70), // contoh
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
}

// ----------------------
// 5. Progress Bar Akumulasi per Kategori
// ----------------------
function tampilProgressBarKategoriAkumulasi(allSoal, riwayat) {
    const container = document.getElementById('progressBarsKategori');
    if (!container) return;
    container.innerHTML = '';

    // Hitung total soal per kategori
    const totalSoalPerKategori = {};
    allSoal.forEach(s => {
        const kat = s.Kategori || 'Lainnya';
        if (!totalSoalPerKategori[kat]) {
            totalSoalPerKategori[kat] = 0;
        }
        totalSoalPerKategori[kat]++;
    });

    // Hitung total benar user (semua sesi) per kategori
    const totalBenarPerKategori = {};
    Object.keys(totalSoalPerKategori).forEach(k => {
        totalBenarPerKategori[k] = 0;
    });

    riwayat.forEach(session => {
        for (let i = 0; i < session.jumlahSoal; i++) {
            const soalID = session.soalIDs[i];
            const soalDB = allSoal.find(s => s.ID === soalID);
            if (!soalDB) continue;

            const kat = soalDB.Kategori || 'Lainnya';
            if (session.jawabanUser[i] === soalDB.Jawaban_Benar) {
                totalBenarPerKategori[kat]++;
            }
        }
    });

    // Tampilkan progress bar
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
}

// ----------------------
// 6. Export PDF / CSV
// ----------------------
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
    for (let row of rows) {
        const cols = row.querySelectorAll('td');
        const rowData = `"${cols[0].innerText}","${cols[1].innerText}","${cols[2].innerText}","${cols[3].innerText}","${cols[4].innerText}"`;
        doc.text(rowData, 14, y);
        y += 10;
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
    }

    doc.save('hasil_kuis.pdf');
}

function exportCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "No,Soal,Jawaban Anda,Jawaban Benar,Waktu (detik)\n";

    const rows = document.getElementById('detailJawaban').querySelectorAll('tr');
    for (let row of rows) {
        const cols = row.querySelectorAll('td');
        const rowData = [
            `"${cols[0].innerText}"`,
            `"${cols[1].innerText}"`,
            `"${cols[2].innerText}"`,
            `"${cols[3].innerText}"`,
            `"${cols[4].innerText}"`
        ].join(',');
        csvContent += rowData + "\n";
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "hasil_kuis.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
