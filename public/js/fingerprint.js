// ============================================================
// 🆔 BROWSER FINGERPRINT (Sederhana)
// ============================================================
function getFingerprint() {
    const components = [
        navigator.userAgent,
        navigator.language,
        navigator.platform,
        window.screen.width,
        window.screen.height,
        window.screen.colorDepth,
        navigator.hardwareConcurrency || '',
        navigator.deviceMemory || ''
    ];

    // Buat hash sederhana
    let hash = 0;
    const str = components.join('||');
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
}

// Tambahkan ke payload di main.js
// fingerprint: getFingerprint()