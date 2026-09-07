#!/usr/bin/env python3
"""
🔍 WiFi Activity Viewer - DNS Sniffer (Edukasi)
HANYA UNTUK JARINGAN SENDIRI!
"""

from scapy.all import sniff, IP, UDP, DNS, DNSQR
import requests
from datetime import datetime

# 🔥 KONFIGURASI SUPABASE (GANTI DENGAN MILIKMU!)
SUPABASE_URL = "https://YOUR_PROJECT.supabase.co"
SUPABASE_ANON_KEY = "YOUR_PUBLISHABLE_KEY"

def process_packet(packet):
    """Proses paket DNS dan kirim ke Supabase"""
    if packet.has(DNS) and packet[DNS].qr == 0:
        try:
            domain = packet[DNSQR].qname.decode('utf-8').rstrip('.')
            source_ip = packet[IP].src

            print(f"[{datetime.now().isoformat()}] {source_ip} → {domain}")

            # Kirim ke Supabase
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/dns_logs",
                headers={
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
                },
                json={
                    "source_ip": source_ip,
                    "domain": domain,
                    "timestamp": datetime.now().isoformat()
                }
            )
            if response.status_code == 201:
                print("  ✅ Data tersimpan")
            else:
                print(f"  ⚠️ Gagal simpan: {response.status_code}")
        except Exception as e:
            print(f"  ❌ Error: {e}")

print("🔍 WiFi Activity Viewer - DNS Sniffer")
print("📡 Menangkap DNS requests... (Ctrl+C untuk berhenti)")
print("-" * 50)

sniff(filter="udp and port 53", prn=process_packet, store=0)