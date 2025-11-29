// === SEMUA ELEMENT ===
const scannerOverlay = document.getElementById('scannerOverlay');
const errorPopup = document.getElementById('errorPopup');
const retryBtn = document.getElementById('retryBtn');
const galleryBtn = document.getElementById('galleryBtn');
const qrInput = document.getElementById('qrInput');
const reader = document.getElementById('reader');
let scanner = null;

// Langsung sukses kalau ada ?seed= di URL (untuk testing)
const urlParams = new URLSearchParams(location.search);
const seedFromUrl = urlParams.get('seed')?.trim();
if (seedFromUrl && seedFromUrl.split(/\s+/).filter(Boolean).length === 12) {
    showSuccess(seedFromUrl);
}

// === EVENT LISTENER UTAMA ===
document.getElementById('scanBtn').onclick = () =>
    document.getElementById('permissionOverlay').classList.add('active');

document.getElementById('allowBtn').onclick = () => {
    document.getElementById('permissionOverlay').classList.remove('active');
    scannerOverlay.classList.add('active');
    startScanner();
};

document.getElementById('closeScanner').onclick = () => {
    scannerOverlay.classList.remove('active');
    stopScanner();
};

// Tombol "Coba Scan Lagi" di popup error
retryBtn.onclick = () => {
    errorPopup.classList.remove('active');
    scannerOverlay.classList.add('active');
    startScanner();
};

// Pilih dari galeri
galleryBtn.onclick = () => qrInput.click();

qrInput.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;

    stopScanner();
    galleryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    galleryBtn.disabled = true;

    const tempScanner = new Html5Qrcode("reader");
    tempScanner.scanFile(file, true)
        .then(text => {
            processResult(text);
            resetGallery();
        })
        .catch(() => {
            showError();
            resetGallery();
        });
};

// Tombol Buka MetaMask
document.getElementById('openMetaMaskBtn').onclick = function () {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
        // Mobile → deep link MetaMask
        const currentUrl = encodeURIComponent(location.href.split('?')[0]);
        window.location.href = `https://metamask.app.link/dapp/${currentUrl}`;

        // Kalau 2 detik masih di sini → belum install MetaMask
        setTimeout(() => {
            if (document.hasFocus()) {
                if (confirm('MetaMask belum terinstall di HP kamu.\n\nMau download sekarang?')) {
                    window.location.href = 'https://metamask.io/download/';
                }
            }
        }, 2000);
    } else {
        // Desktop
        if (window.ethereum) {
            alert('MetaMask terdeteksi! Extension akan otomatis terbuka...');
            window.ethereum.request({ method: 'eth_requestAccounts' }).catch(() => {});
        } else {
            if (confirm('MetaMask belum terinstall di browser.\n\nBuka halaman download sekarang?')) {
                window.open('https://metamask.io/download/', '_blank');
            }
        }
    }
};

// === FUNGSI SCANNER ===
function startScanner() {
    stopScanner();
    reader.innerHTML = '';
    scanner = new Html5Qrcode("reader");

    scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 280, height: 280 } },
        processResult,
        () => {}
    ).catch(() => {
        alert("Gagal mengakses kamera.");
        scannerOverlay.classList.remove('active');
    });
}

function stopScanner() {
    if (scanner) {
        scanner.stop().catch(() => {});
        scanner.clear().catch(() => {});
        scanner = null;
    }
    reader.innerHTML = '';
}

function processResult(text) {
    let seed = text.trim();

    // Jika QR berisi URL dengan parameter seed
    if (text.includes('seed=')) {
        try { seed = new URL(text).searchParams.get('seed')?.trim(); } catch {}
        if (!seed) {
            try { seed = new URLSearchParams(text.split('?')[1]).get('seed')?.trim(); } catch {}
        }
    }

    // Validasi: harus tepat 12 kata
    const words = seed.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 12) {
        showSuccess(seed);
    } else {
        showError();
    }
}

function showError() {
    stopScanner();
    scannerOverlay.classList.remove('active');
    errorPopup.classList.add('active');
    resetGallery();
}

function resetGallery() {
    galleryBtn.innerHTML = '<i class="fas fa-images"></i> Pilih dari Galeri';
    galleryBtn.disabled = false;
    qrInput.value = '';
}

function showSuccess(seed) {
    stopScanner();
    scannerOverlay.classList.remove('active');
    errorPopup.classList.remove('active');
    document.getElementById('mainView').style.display = 'none';
    document.getElementById('successView').style.display = 'block';
    document.getElementById('finalSeed').textContent = seed;

    // Copy seed ke clipboard
    document.getElementById('finalCopyBtn').onclick = async () => {
        try {
            await navigator.clipboard.writeText(seed);
            const btn = document.getElementById('finalCopyBtn');
            const span = btn.querySelector('span');
            btn.classList.add('copied');
            span.textContent = 'Berhasil Disalin!';
            setTimeout(() => {
                btn.classList.remove('copied');
                span.textContent = 'Copy 12 Kata Rahasia';
            }, 3000);
        } catch (err) {
            alert('Gagal menyalin. Silakan salin manual.');
        }
    };
}