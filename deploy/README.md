# Przewodnik Wdrożeniowy: OmniDash na Serwerze Mikrus (2 GB RAM / 25 GB NVMe)

> **Środowisko docelowe:** VPS Mikrus (LXC / KVM)  
> **Zasoby:** 2048 MB RAM, 25 GB NVMe SSD  
> **Współistnienie:** `OmniDash AI Dashboard` + `Kvbi Portfolio`  
> **Dedykowany branch Git:** `mikr.us`  

---

## 1. Architektura Alokacji Pamięci RAM

Aby zapobiec wywołaniu jądrowego mechanizmu **OOM Killer** i zagwarantować pełną stabilność zarówno dla systemu OmniDash, jak i systemu Portfolio, wprowadzono rygorystyczny budżet pamięciowy:

| Usługa Kontenerowa | Obraz Bazowy | Limit RAM (`mem_limit`) | Rezerwacja RAM | Cel Architektoniczny |
| :--- | :--- | :--- | :--- | :--- |
| **`omnidash-api`** | `node:22-alpine` | **180 MB** | 90 MB | Express Gateway, SSE, relacyjny SQLite `node:sqlite`, serwer MCP |
| **`omnidash-worker`** | `node:22-alpine` | **110 MB** | 50 MB | Harmonogram Cron, Pushbullet Dispatcher, anty-bot scraper Librus |
| **`omnidash-redis`** | `redis:7-alpine` | **45 MB** | 20 MB | Pamięć podręczna (max 32 MB LRU, wyłączony fork RDB) |
| **`omnidash-web`** | `nginx:alpine` | **30 MB** | 15 MB | Statyczny serwer SPA, kompresja Gzip, obsługa `try_files` |
| **SUMA OMNIDASH** | — | **≤ 365 MB** | **~175 MB** | **Zajmuje tylko ~18% pamięci Mikrusa** |
| **Pozostałe Zasoby** | — | **~1680 MB** | — | Dostępne dla OS (200 MB), Portfolio (400 MB) i buforów (1080 MB) |

---

## 2. Krok 1: Klonowanie Dedykowanej Gałęzi `mikr.us` na Mikrusie

Zaloguj się na serwer Mikrus przez SSH i pobierz kod z gałęzi `mikr.us`:

```bash
# Sklonowanie projektu z dedykowanej gałęzi
git clone -b mikr.us https://github.com/Kvbi213/ai-system-dashboard.git /opt/omnidash
cd /opt/omnidash
```

---

## 3. Krok 2: Przygotowanie Środowiska i Aktywacja SWAP

Uruchom skrypt przygotowawczy, który:
- Sprawdzi pamięć RAM i utworzy **1.5 GB pliku wymiany SWAP** (kluczowy bufor bezpieczeństwa przed OOM Killerem).
- Przygotuje katalog trwałego przechowywania bazy SQLite (`./data/storage`).
- Zweryfikuje obecność Dockera i wtyczki Compose.

```bash
chmod +x deploy/mikrus-setup.sh deploy/mikrus-deploy.sh
sudo ./deploy/mikrus-setup.sh
```

---

## 4. Krok 3: Konfiguracja Zmiennych Środowiskowych

Utwórz i dostosuj plik `.env`:

```bash
cp .env.example .env
nano .env
```

Zdefiniuj wymagane klucze:
```env
PORT=5000
NODE_ENV=production
JWT_SECRET=twoj_bezpieczny_klucz_jwt_generowany_losowo
STORAGE_PATH=/app/apps/api/data
REDIS_URL=redis://omnidash-redis:6379
PUSHBULLET_API_KEY=o.twoj_klucz_pushbullet_opcjonalnie
GROQ_API_KEY=gsk_twoj_klucz_groq_dla_ai
```

---

## 5. Krok 4: Wdrożenie i Uruchomienie Stosu

Uruchom automatyczny skrypt wdrożeniowy:

```bash
./deploy/mikrus-deploy.sh
```

Skrypt automatycznie:
1. Zbuduje zoptymalizowane obrazy wieloetapowe.
2. Nałoży limity cgroups na pamięć RAM i rotację logów (ochrona 25 GB dysku).
3. Przeprowadzi test zdrowia na endpoint `/api/system/health`.
4. Wyświetli raport z `docker stats` potwierdzający łączne zużycie RAM poniżej 365 MB.

---

## 6. Krok 5: Współistnienie z Portfolio (Nadrzędny Nginx Host)

Aby na serwerze Mikrus równolegle działało Twoje Portfolio oraz OmniDash pod osobnymi domenami lub subdomenami, wykorzystaj szablon reverse proxy:

```bash
sudo cp deploy/nginx/mikrus-reverse-proxy.conf.example /etc/nginx/sites-available/ecosystem.conf
sudo nano /etc/nginx/sites-available/ecosystem.conf
```

Przykładowy podział:
- `https://dash.twojadomena.pl` -> `http://127.0.0.1:3000` (OmniDash Web + API Proxy)
- `https://twojadomena.pl` -> `http://127.0.0.1:3001` (Kvbi Portfolio)

Aktywuj stronę i zrestartuj Nginxa:
```bash
sudo ln -s /etc/nginx/sites-available/ecosystem.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. Kopia Zapasowa Danych i Przyszłościowy Moduł `.exe`

- **Trwałość danych:** Wszystkie ustawienia, streaki nawyków, cele i transakcje zapisywane są w pliku `./data/storage/omnidash.sqlite`. Kopia zapasowa polega na skopiowaniu tego jednego pliku.
- **Dedykowany Moduł `.exe` (Planowany w kolejnym etapie):** Samodzielna aplikacja desktopowa w Go/Node-caxa, która pozwoli operatorowi na jednym kliknięciem:
  - Zrzucać kopię zapasową bazy danych z Mikrusa na lokalny PC.
  - Wypychać nowe konfiguracje i synchronizować stan offline/online.
