# OMNIDASH REBORN (v4.0.0) — MANIFEST I STRATEGIA TRANSFORMACJI
> Ścieżka systemowa: `$PROJECT_ROOT/OmniDash`  
> Data audytu i planowania: 2026-10-30  
> Status: AKTYWNY SYSTEM PRODUKCYJNY (v4.0.0 Monorepo)  
> Standard wykonania: Protokół Antigravity v4.0 (Deterministic Edition)  

---

## 1. MISJA I CELE RESTRUKTURYZACJI
Projekt **OmniDash** to zintegrowany osobisty ekosystem operacyjno-asystencki łączący kognitywną inteligencję LLM (`openai/gpt-oss-120b`), telemetrię systemową w czasie rzeczywistym (SSE), zautomatyzowane śledzenie wydatków (Pushbullet WebSocket + reguła 50/30/20), integrację ze szkolnym systemem Librus Synergia (oceny, terminarz, odwołane lekcje, zastępstwa), wywiad OSINT i graf powiązań podmiotów, wywiad drogowy (CANARD/GITD + GDDKiA), nadzór budżetowy GCP Pub/Sub, rutynę treningową FBW na strychu oraz wielosilnikową syntezę mowy (Fish Audio + Edge TTS).

### Diagnoza Wersji Legacy (v3.4.0):
1. **Split-Brain Architektury:** Rozproszenie logiki pomiędzy frontendowy klient (`clientAiDispatcher.js` o wadze 154 KB), bezstanowe bramy Vercel Serverless (`/api/*`), a lokalny serwer Express (`core.server.js`). Prowadzi to do dublowania logiki narzędziowej i ryzyka wycieku promptów.
2. **Brak Ścisłego Typowania:** Całość napisana w czystym JavaScript (`.js`, `.jsx`), co utrudnia refaktoryzację, testowanie kontraktów API i wprowadza ryzyko błędów typowania (`undefined is not an object`) w runtime.
3. **Monolityczne Komponenty GUI:** Strony takie jak `Dashboard.jsx`, `ChatPage.jsx` czy `GradesPage.jsx` przekraczają 800-1200 linii kodu, łącząc logikę pobierania danych, efekty uboczne, modale i warstwę prezentacji.
4. **Brak Dokeryzacji:** Środowisko uruchamiane na hoście za pomocą `concurrently` i `wait-on`, co generuje konflikty portów, zależności Node.js oraz brak izolacji zasobów.

### Niezmienniki Nowego Systemu (v4.0.0):
- **100% Zachowania Logiki Domenowej:** Wszystkie 15 modułów, algorytm budżetowy 50/30/20, scraper Librusa, agent sprzedaży Harvey, graf encji 10 domen, tarcza SSRF, nadzór GCP Pub/Sub zostają zachowane i przepisane na czyste, przetestowane serwisy TypeScript.
- **Izolacja Kontenerowa (Docker Compose):** Pełna dokeryzacja usług: `omnidash-web`, `omnidash-api`, `omnidash-worker`, `omnidash-db` oraz opcjonalny `omnidash-redis`.
- **Nowoczesne GUI od Zera:** Przejście na TypeScript + TailwindCSS v4 + Radix/Shadcn UI + Framer Motion z architekturą Apple-Style Glass, segmentowanymi paskami i wysuwanymi szufladami (Slide-Over Drawers).
- **Zero-Trust & Backend-Centric AI:** Przeniesienie 100% wywołań narzędziowych (Tool Calling) i komunikacji z LLM do backendu ze strumieniowaniem tokenów (SSE) do frontendu.

---

## 2. PORÓWNANIE ARCHITEKTUR (LEGACY vs REBORN)

| Obszar Architektury | OmniDash Legacy (v3.4.0) | OmniDash Reborn (v4.0.0 Target) |
|---|---|---|
| **Język i Typowanie** | JavaScript (ESM + JSX, brak typów) | TypeScript 5.6+ (Strict Mode, Zod schemas) |
| **Frontend Framework** | React 18 + Vite (SPA, monolityczne strony) | React 19 / Next.js 15 lub Vite + React TS + Zustand + TanStack Query |
| **Styling & Motion** | Tailwind 3 + surowy CSS w `index.css` | Tailwind v4 + Shadcn UI + Radix Primitives + Framer Motion |
| **Architektura Kodu** | Mieszana (pliki w root, `modules/` bez ścisłych granic) | Clean Monorepo (`apps/web`, `apps/api`, `packages/contracts`) |
| **Silnik AI (Agent)** | `clientAiDispatcher.js` (154KB w przeglądarce) | Server-Side Agent Runtime + SSE Token Streaming + Tool Sandbox |
| **Infrastruktura** | Bare-metal host (`node core.server.js` + Vite dev) | Docker Compose multi-container z healthcheckami i wolumenami |
| **Baza Danych** | SQLite `tasks.sqlite` (surowy sterownik `sqlite3`) | PostgreSQL lub SQLite WAL via Drizzle ORM / Kysely + Cloud Firestore |
| **Zadania w Tle** | `setInterval` w wątku serwera HTTP | Dedykowany kontener `omnidash-worker` (BullMQ/Redis lub chronometraż TS) |
| **Bezpieczeństwo** | Klucze w `.env` i częściowo w `localStorage` | Klucze wyłącznie w sekretach backendu/Docker `.env`, Zero-Client Exposure |

---

## 3. ARCHITEKTURA I SPECYFIKACJA SYSTEMOWA
Pełna dokumentacja i specyfikacje podsystemów monorepo zostały zorganizowane w dedykowanych plikach architektury:
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Topologia monorepo, architektura domenowa, podział portów i infrastruktura Docker.
- [`HISTORY.md`](./HISTORY.md) — Niemutowalny rejestr wersji i changelog SemVer 2.0.0.
- [`TODO.md`](./TODO.md) — Strategiczny rejestr zadań bieżącego sprintu (Pushbullet bridge, dispatching, integracje chmurowe).

