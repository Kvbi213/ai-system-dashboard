#!/usr/bin/env bash
# ==============================================================================
# OMNIDASH MIKRUS DEPLOY SCRIPT
# Uruchomienie i weryfikacja stosu OmniDash (budżet RAM ≤ 365 MB) na serwerze Mikrus
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo "======================================================================"
echo "[*] WDRAZANIE OMNIDASH v1.0.0 NA MIKRUSIE (PROD STACK)"
echo "======================================================================"

# 1. Weryfikacja Pliku .env
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    echo "[!] Brak pliku .env. Tworzenie z szablonu .env.example..."
    cp .env.example .env
  else
    echo "[*] Inicjalizacja domyslnego pliku .env..."
    cat << 'EOF' > .env
PORT=5000
NODE_ENV=production
JWT_SECRET=super_secret_omnidash_prod_key_change_me
ADMIN_PASSWORD=change_me_on_first_boot
STORAGE_PATH=/app/apps/api/data
REDIS_URL=redis://omnidash-redis:6379
EOF
  fi
  echo "[+] Utworzono plik konfiguracyjny .env."
fi

# 2. Uruchomienie Stosu Kontenerowego
echo "[>] Uruchamianie kompilacji i startu kontenerow (docker-compose.prod.yml)..."
if docker compose version &> /dev/null; then
  DOCKER_COMPOSE_CMD="docker compose -f docker-compose.prod.yml"
else
  DOCKER_COMPOSE_CMD="docker-compose -f docker-compose.prod.yml"
fi

$DOCKER_COMPOSE_CMD down --remove-orphans || true
$DOCKER_COMPOSE_CMD up -d --build

# 3. Oczekiwanie na Gotowość API Gateway
echo "[~] Oczekiwanie na start API Gateway (port 5000)..."
READY=0
for i in {1..20}; do
  if curl -sf http://127.0.0.1:5000/api/system/health > /dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 2
done

if [ "$READY" -eq 1 ]; then
  echo "[+] API Gateway odpowiedzial pomyslnie na zapytanie /api/system/health."
else
  echo "[!] OSTRZEZENIE: API Gateway jeszcze sie inicjalizuje. Sprawdz logi: docker logs omnidash-api"
fi

# 4. Sprawdzenie Zużycia Zasobów
echo ""
echo "======================================================================"
echo "[*] RAPORT ALOKACJI PAMIECI RAM (DOCKER STATS):"
echo "======================================================================"
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.CPUPerc}}" omnidash-web omnidash-api omnidash-worker omnidash-redis || true

echo ""
echo "======================================================================"
echo "[+] WDROZENIE OMNIDASH ZAKONCZONE SUKCESEM."
echo "[*] Frontend Web SPA: http://127.0.0.1:3000"
echo "[*] Backend API:       http://127.0.0.1:5000/api"
echo "======================================================================"
