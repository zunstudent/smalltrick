const SUPABASE_URL = 'https://fjjdbvyqqpshaxgqavnx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_FGhSQDZF4jZGniE1F3RPrA_3i57aI4p';

(function matrixEffect() {
    const canvas = document.getElementById('matrix');
    const ctx = canvas.getContext('2d');
    const fontSize = 12;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';
    let drops = [];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drops = Array(Math.ceil(canvas.width / fontSize)).fill(0);
    }

    function draw() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff4188';
        ctx.font = `${fontSize}px monospace`;
        drops.forEach((drop, index) => {
            ctx.fillText(chars[Math.floor(Math.random() * chars.length)], index * fontSize, drop * fontSize);
            if (drop * fontSize > canvas.height && Math.random() > 0.975) drops[index] = 0;
            drops[index]++;
        });
    }

    resize();
    window.addEventListener('resize', resize);
    setInterval(draw, 60);
})();

async function showRandomImage() {
    const image = document.getElementById('random-image');
    try {
        const response = await fetch(`https://picsum.photos/400/300?random=${Date.now()}`);
        image.src = response.url;
    } catch {
        image.alt = '[ IMAGE UNAVAILABLE ]';
    }
}

function getDeviceInfo() {
    const userAgent = navigator.userAgent;
    const device = /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent)
        ? (/iPhone|iPad/i.test(userAgent) ? 'Apple Mobile' : 'Android Mobile')
        : 'Desktop/Laptop';
    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac OS')) os = 'macOS';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('Linux')) os = 'Linux';

    let browser = 'Other';
    if (userAgent.includes('Edg')) browser = 'Edge';
    else if (userAgent.includes('OPR')) browser = 'Opera';
    else if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    return { device, os, browser };
}

function hashValue(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index++) {
        hash = ((hash << 5) - hash) + value.charCodeAt(index);
        hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
}

function getCanvasFingerprint() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.textBaseline = 'top';
    context.font = '14px Arial';
    context.fillStyle = '#f60';
    context.fillRect(10, 10, 100, 30);
    context.fillStyle = '#069';
    context.fillText('SmallTrick consented test', 2, 15);
    return `0x${hashValue(canvas.toDataURL())}`;
}

async function getBatteryInfo() {
    if (!navigator.getBattery) return { level: null, charging: null };
    try {
        const battery = await navigator.getBattery();
        return { level: Math.round(battery.level * 100), charging: battery.charging };
    } catch {
        return { level: null, charging: null };
    }
}

function getNetworkInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return {
        type: connection?.effectiveType || connection?.type || 'unavailable',
        downlink: typeof connection?.downlink === 'number' ? `${connection.downlink} Mbps` : 'unavailable'
    };
}

function getPreciseLocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve({ latitude: null, longitude: null, source: 'unavailable' });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude, source: 'GPS' }),
            () => resolve({ latitude: null, longitude: null, source: 'denied/unavailable' }),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
    });
}

async function getIpLocation() {
    try {
        const response = await fetch('https://ipwho.is/');
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'IP lookup failed');
        return { ip: data.ip, location: `${data.city}, ${data.region}, ${data.country}` };
    } catch {
        return { ip: 'unavailable', location: 'unavailable' };
    }
}

function updateValue(id, value) {
    document.getElementById(id).textContent = value ?? 'not shared';
}

async function collectAndSendData(permissions) {
    const status = document.getElementById('status');
    status.textContent = 'collecting only the approved diagnostics...';
    const device = permissions.diagnostics ? getDeviceInfo() : { device: null, os: null, browser: null };
    const battery = permissions.diagnostics ? await getBatteryInfo() : { level: null, charging: null };
    const network = permissions.diagnostics ? getNetworkInfo() : { type: null, downlink: null };
    const ipData = permissions.diagnostics ? await getIpLocation() : { ip: null, location: null };
    const preciseLocation = permissions.location ? await getPreciseLocation() : { latitude: null, longitude: null, source: 'not shared' };
    const fingerprint = permissions.fingerprint ? getCanvasFingerprint() : null;
    const cpuCores = permissions.diagnostics ? navigator.hardwareConcurrency || null : null;

    updateValue('device-info', device.device && `${device.device} (${device.os})`);
    updateValue('battery-info', battery.level === null ? null : `${battery.level}% - ${battery.charging ? 'charging' : 'discharging'}`);
    updateValue('ip-info', ipData.ip && `${ipData.ip} -> ${ipData.location}`);
    updateValue('system-info', device.browser);
    updateValue('fingerprint-info', fingerprint);
    updateValue('network-info', network.type && `${network.type} / ${network.downlink}`);
    updateValue('cpu-info', cpuCores);
    updateValue('precise-location-info', preciseLocation.latitude === null ? preciseLocation.source : `${preciseLocation.latitude}, ${preciseLocation.longitude}`);
    document.getElementById('data-container').classList.remove('hidden');

    const payload = {
        device_type: device.device,
        os_name: device.os,
        browser_name: device.browser,
        battery_level: battery.level === null ? null : `${battery.level}%`,
        battery_charging: battery.charging,
        ip_address: ipData.ip,
        location: ipData.location,
        latitude: preciseLocation.latitude,
        longitude: preciseLocation.longitude,
        fingerprint,
        connection_type: network.type,
        cpu_cores: cpuCores,
        timestamp: new Date().toISOString()
    };

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/battery_data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`server returned ${response.status}`);
        status.textContent = 'data transmitted with your selected permissions';
        status.style.color = '#00ff41';
    } catch (error) {
        status.textContent = `transmission failed: ${error.message}`;
        status.style.color = '#ff4444';
    }
}

function init() {
    showRandomImage();
    const startButton = document.getElementById('start-collection');
    const consentStatus = document.getElementById('consent-status');
    startButton.addEventListener('click', () => {
        const permissions = {
            diagnostics: document.getElementById('consent-diagnostics').checked,
            location: document.getElementById('consent-location').checked,
            fingerprint: document.getElementById('consent-fingerprint').checked
        };
        if (!permissions.diagnostics && !permissions.location && !permissions.fingerprint) {
            consentStatus.textContent = 'Choose at least one permission, or close this page.';
            return;
        }
        startButton.disabled = true;
        consentStatus.textContent = 'Permission recorded for this session.';
        collectAndSendData(permissions);
    });
}

document.addEventListener('DOMContentLoaded', init);
