// jumlah_soal.js

document.addEventListener('DOMContentLoaded', () => {
    const jumlahSelect = document.getElementById('jumlah');
    const infoSoal = document.getElementById('infoSoal');
    const currentUser = localStorage.getItem('currentUser') || 'Anonymous';

    fetch('data/soal.json')
    .then(response => response.json())
    .then(data => {
        // 1. Ambil riwayat user
        const riwayatKey = `riwayat_${currentUser}`;
        const riwayat = JSON.parse(localStorage.getItem(riwayatKey)) || [];

        // 2. Dapatkan ID soal yang sudah pernah dijawab benar
        const sudahBenar = riwayat
            .map(entry => entry.soalBenar || [])
            .flat()
            .map(id => parseInt(id));

        // 3. Filter soal yang BELUM pernah dijawab benar
        const belumBenar = data.filter(soal => 
            !sudahBenar.includes(parseInt(soal.ID))
        );

        // Debugging
        console.log("Soal sudah benar:", sudahBenar);
        console.log("Soal belum benar:", belumBenar);

        // 4. Tampilkan jumlah soal tersedia
        const jumlahTersedia = belumBenar.length;
        infoSoal.innerHTML = `<p>Jumlah soal tersedia: <strong>${jumlahTersedia}</strong></p>`;

        // Bersihkan isi <select>
        jumlahSelect.innerHTML = '';

        // 5. Jika jumlahTersedia < 10, dropdown naik per 1
        //    Jika ≥ 10, dropdown kelipatan 5 sampai 10
        if (jumlahTersedia < 10) {
            for (let i = 1; i <= jumlahTersedia; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i;
                jumlahSelect.appendChild(option);
            }
        } else {
            // Kelipatan 5 hingga max 10 (atau lebih, sesuai kebutuhan)
            const maxSoal = Math.min(100, jumlahTersedia);
            for (let i = 5; i <= maxSoal; i += 5) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i;
                jumlahSelect.appendChild(option);
            }
        }

        // Jika jumlahTersedia < 1, user tidak bisa pilih apapun
        if (jumlahTersedia < 1) {
            infoSoal.innerHTML += `<p class="text-danger">
                Tidak ada soal baru yang dapat dikerjakan.
            </p>`;
        }
    })
    .catch(error => {
        console.error('Error memuat soal:', error);
        infoSoal.innerHTML = `<p class="text-danger">Terjadi kesalahan saat memuat soal.</p>`;
    });

    // Event form submit
    document.getElementById('jumlahSoalForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const jumlah = parseInt(jumlahSelect.value);
        localStorage.setItem('jumlahSoal', jumlah);

        // Reset jawabanUser untuk sesi baru
        localStorage.removeItem('jawabanUser');

        // Pindah ke kuis.html
        window.location.href = 'kuis.html';
    });
});
