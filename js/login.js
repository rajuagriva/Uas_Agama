// login.js

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();

    // Simple validation
    if(username === "") {
        alert("Silakan masukkan username.");
        return;
    }

    // Simulate login success
    localStorage.setItem('currentUser', username);
    window.location.href = 'jumlah_soal.html';
});
