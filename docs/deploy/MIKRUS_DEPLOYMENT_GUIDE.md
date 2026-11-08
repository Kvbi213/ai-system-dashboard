# Przewodnik Wdrożeniowy: OmniDash na Serwerze Mikrus (2 GB RAM / 25 GB NVMe)

> **Środowisko docelowe:** VPS Mikrus (Debian Linux, LXC Proxmox VE)  
> **Zasoby serwera:** 2048 MB RAM, 25 GB NVMe SSD  
> **Współistnienie:** `OmniDash AI Dashboard` + `Kvbi Portfolio`  
> **Dedykowany branch Git:** `mikr.us`  
> **Katalog wdrożeniowy:** `/var/www/omnidash`  
> **Status:** Wdrożony i aktywny na produkcji  

---

## 1. Rzeczywiste Pomiary Alokacji RAM na Mikrusie

OmniDash został zoptymalizowany pod kątem minimalnego zużycia zasobów i działa równolegle z Portfolio bez ryzyka wyczerpania pamięci:

| Usługa Kontenerowa | Obraz Bazowy | Limit RAM | Rzeczywiste Zużycie RAM | Status |
| :--- | :--- | :--- | :--- | :--- |
| **`omnidash-api`** | `node:22-alpine` | 180 MB | **43.1 MiB** | Aktywny (Express, SQLite `node:sqlite`) |
| **`omnidash-worker`** | `node:22-alpine` | 110 MB | **18.1 MiB** | Aktywny (Cron, Librus Scraper, Pushbullet) |
| **`omnidash-redis`** | `redis:7-alpine` | 45 MB | **11.6 MiB** | Aktywny (32 MB LRU, wyłączony fork RDB) |
| **`omnidash-web`** | `nginx:alpine` | 30 MB | **5.1 MiB** | Aktywny (Nginx SPA, Gzip, reverse proxy) |
| **SUMA OMNIDASH** | — | **≤ 365 MB** | **~77.9 MiB (tylko 3.8% RAM Mikrusa!)** | Pełna stabilność |
| **Portfolio Stack** | Caddy + Node + Tunnel | 678 MB | **~112.1 MiB** | Nienaruszone, w pełni stabilne |
| **Dostępny RAM Mikrusa**| — | **2048 MB** | **> 1510 MB wolnej pamięci operacyjnej** | Zapobiega OOM Killer |

---

## 2. Architektura Routingu i Prywatny Dostęp

Ruch sieciowy do serwera Mikrus obsługiwany jest przez kontener `portfolio-frontend` (Caddy) na portach 80 i 443, zintegrowany z Cloudflare Tunnel i certyfikatem Cloudflare Origin:

```caddy
:80 {
    @omnidash {
        host dash.kvbi.pl omni.kvbi.pl omnidash.kvbi.pl hub.kvbi.pl
    }
    handle @omnidash {
        reverse_proxy omnidash-web:80 {
            header_up Host {host}
            header_up X-Real-IP {http.request.header.CF-Connecting-IP}
            header_up X-Forwarded-For {http.request.header.CF-Connecting-IP}
        }
    }
    ...
}

:443 {
    tls /etc/ssl/cloudflare/cert.pem /etc/ssl/cloudflare/key.pem

    @omnidash {
        host dash.kvbi.pl omni.kvbi.pl omnidash.kvbi.pl hub.kvbi.pl
    }
    handle @omnidash {
        reverse_proxy omnidash-web:80 {
            header_up Host {host}
            header_up X-Real-IP {http.request.header.CF-Connecting-IP}
            header_up X-Forwarded-For {http.request.header.CF-Connecting-IP}
        }
    }
    ...
}
```

### Metody Dostępu dla Operatora:

1. **Dostęp przez Subdomenę Cloudflare (`https://dash.kvbi.pl` lub `https://omni.kvbi.pl`):**
   - W panelu **Cloudflare Zero Trust** (Tunnels -> `portfolio-tunnel`):
     - Dodaj Public Hostname: `dash.kvbi.pl`
     - Service: `HTTP` -> `portfolio-frontend:80` (lub `omnidash-web:80`)
   - **LUB w Cloudflare DNS:**
     - Dodaj rekord CNAME: `dash` -> `kvbi.pl` (z pomarańczową chmurką / Proxy)
     - Caddy automatycznie rozpozna nagłówek `Host: dash.kvbi.pl` i skieruje ruch do OmniDash.

2. **Dostęp Bezpośredni przez Tunel SSH (Zawsze dostępny natychmiast):**
   ```bash
   ssh -L 3000:localhost:3000 mikrus
   ```
   Po wpisaniu tego polecenia w konsoli wystarczy otworzyć w przeglądarce:
   `http://localhost:3000`

---

## 3. Komendy Zarządzania na Mikrusie

Z poziomu katalogu `/var/www/omnidash`:

- **Podgląd stanu kontenerów:**
  ```bash
  docker compose -f docker-compose.prod.yml ps
  ```
- **Podgląd zużycia pamięci RAM na żywo:**
  ```bash
  docker stats --no-stream
  ```
- **Podgląd logów API:**
  ```bash
  docker logs -f omnidash-api
  ```
- **Podgląd logów Workera:**
  ```bash
  docker logs -f omnidash-worker
  ```
- **Aktualizacja kodu (Pull & Rebuild):**
  ```bash
  git pull origin mikr.us
  ./deploy/mikrus-deploy.sh
  ```
- **Kopia zapasowa bazy danych SQLite:**
  ```bash
  cp ./data/storage/omnidash.sqlite /var/backups/omnidash_$(date +%Y%m%d).sqlite
  ```
