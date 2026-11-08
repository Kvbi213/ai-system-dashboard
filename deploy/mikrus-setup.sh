#!/usr/bin/env bash
# ==============================================================================
# OMNIDASH MIKRUS SETUP SCRIPT
# Przygotowanie środowiska Mikrus VPS (2 GB RAM / 25 GB NVMe) pod OmniDash & Portfolio
# ==============================================================================

set -euo pipefail

echo "======================================================================"
echo "[*] INICJALIZACJA SRODOWISKA MIKRUS VPS DLA OMNIDASH v1.0.0"
echo "======================================================================"

# 1. Weryfikacja Uprawnień
if [ "$EUID" -ne 0 ]; then
  echo "[!] UWAGA: Skrypt zaleca uprawnienia roota lub sudo do konfiguracji SWAP."
fi

# 2. Weryfikacja Pamięci RAM i SWAP
TOTAL_RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
TOTAL_RAM_MB=$((TOTAL_RAM_KB / 1024))
CURRENT_SWAP_KB=$(grep SwapTotal /proc/meminfo | awk '{print $2}')
CURRENT_SWAP_MB=$((CURRENT_SWAP_KB / 1024))

echo "[*] Wykryta pamiec RAM: ${TOTAL_RAM_MB} MB"
echo "[*] Wykryta pamiec SWAP: ${CURRENT_SWAP_MB} MB"

if [ "$CURRENT_SWAP_MB" -lt 1024 ]; then
  echo "[~] SWAP mniejszy niz 1024 MB. Konfiguracja 1.5 GB pliku wymiany SWAP..."
  if [ -f /swapfile ]; then
    echo "[*] Istniejacy /swapfile zostanie odswiezony."
    swapoff /swapfile 2>/dev/null || true
    rm -f /swapfile
  fi
  fallocate -l 1536M /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=1536
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile

  if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
  sysctl vm.swappiness=15 || true
  echo "[+] Piekielnie bezpieczny bufor SWAP 1.5 GB zostal aktywowany."
else
  echo "[+] Zasob pamieci SWAP (${CURRENT_SWAP_MB} MB) jest wystarczajacy."
fi

# 3. Weryfikacja Miejsca na Dysku
FREE_DISK_MB=$(df -m . | awk 'NR==2 {print $4}')
echo "[*] Wolne miejsce na dysku: ${FREE_DISK_MB} MB"
if [ "$FREE_DISK_MB" -lt 3000 ]; then
  echo "[!] OSTRZEZENIE: Wolne miejsce na dysku ponizej 3 GB. Oczysc cache przed instalacja."
fi

# 4. Utworzenie Wolumenow dla Bazy Danych SQLite
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
STORAGE_DIR="${PROJECT_ROOT}/data/storage"

mkdir -p "$STORAGE_DIR"
chmod -R 775 "$STORAGE_DIR"
echo "[+] Przygotowano katalog bazy SQLite: ${STORAGE_DIR}"

# 5. Sprawdzenie Dockera i Wtyczki Compose
if ! command -v docker &> /dev/null; then
  echo "[!] BŁĄD: Docker nie jest zainstalowany. Zainstaluj Dockera komenda:"
  echo "    curl -fsSL https://get.docker.com | sh"
  exit 1
fi

if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
  echo "[!] BŁĄD: Wtyczka docker-compose nie jest zainstalowana."
  exit 1
fi

echo "======================================================================"
echo "[+] SRODOWISKO MIKRUS GOTOWE DO URUCHOMIENIA OMNIDASH."
echo "[*] Nastepny krok: ./deploy/mikrus-deploy.sh"
echo "======================================================================"
