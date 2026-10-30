# HISTORY.md — REJESTR WERSJI I ZMIAN SYSTEMU OMNIDASH
> Dokument nadrzędny rejestru wydań.
> Standard: SemVer 2.0.0 (MAJOR.MINOR.PATCH) & Protokół Antigravity v4.0.
> Zasada: Niemutowalny, zwięzły, deterministyczny rejestr typu append-only.

---

## 0. MANIFEST CZYSTEGO RESTARTU WERSJONOWANIA (CLEAN VERSION RESET)

W systemie Legacy (`AI system dashboard github` w wersjach v1.0.0 – v3.4.0) historia zmian uległa drastycznej fragmentacji i zanieczyszczeniu:
- **Chaotyczne i gwałtowne przeskoki wersji:** Wydawanie kilku wersji drobnych (np. v3.3.0, v3.3.1, v3.3.2, v3.3.3, v3.4.0) w przeciągu kilku dni bez zachowania rygoru SemVer.
- **Nieczytelny rejestr zmian (1900+ linii szumu):** Wielokrotne powielanie opisów tych samych poprawek, dublowanie nagłówków wydań i brak przejrzystego podziału na to, co rzeczywiście wprowadzono.
- **Brak atomowości:** Zmiany kosmetyczne mieszały się z krytycznymi łatkami bezpieczeństwa i dużymi refaktoryzacjami.

**Decyzja Architektoniczna:**
Wraz z budową projektu od zera w lokalizacji `C:\Users\Jakub Lis\Desktop\01_PROJEKTY\OmniDash`, zamykamy chaotyczną linię 3.x i ustanawiamy **Czysty Restart Wersjonowania**:
1. Nowy system startuje z wersją bazową **v4.0.0 (OmniDash Reborn)**.
2. Każda kolejna wersja podlega ścisłemu SemVer:
   - **MAJOR (vX.0.0):** Przełomowa zmiana architektury, zmiana schematu bazy danych lub kontraktów API.
   - **MINOR (v4.X.0):** Nowy moduł domenowy, nowy widok lub istotne rozszerzenie funkcjonalne kompatybilne wstecz.
   - **PATCH (v4.0.X):** Precyzyjne eliminacje defektów (bugfix), poprawki bezpieczeństwa i optymalizacje wydajnościowe.
3. Każdy wpis w `HISTORY.md` musi być zwięzły, jednoznaczny i pozbawiony duplikacji.

---

## REJESTR WYDAŃ

### ## v4.0.0 — 2026-10-30 [PLANNING & BLUEPRINT]
**Status:** W TRAKCIE REALIZACJI (FAZA ARCHITEKTONICZNA)  
**Typ:** MAJOR (Kompletny Rewrite Architektoniczny od Zera)  
**Cel:** Przejście z monolitycznego, niebezpiecznego i chaotycznego kodu v3.4.0 na czyste, w pełni typowane monorepo w kontenerach Docker z natywnym interfejsem mobilnym Apple-Glass.

#### Zakres Zmian Architektonicznych:
- [+] **Nowa Architektura Monorepo (`apps/web`, `apps/api`, `apps/worker`, `packages/contracts`):**
  - Frontend: React 19 + TypeScript + TailwindCSS v4 + Shadcn/Radix UI Primitives + Framer Motion.
  - Backend: Fastify/Express TS z architekturą Clean Domain Architecture i strumieniowaniem tokenów SSE (`< 400ms TTFT`).
  - Worker: Dedykowany daemon procesów tła dla WebSocketu Pushbullet, synchronizacji Librusa i Firestore.
- [!] **Wzmocnienie Bezpieczeństwa (Zero-Trust Hardening):**
  - Całkowita eliminacja wieloznaczników `*` w CORS (`Access-Control-Allow-Origin: *` zastąpione jawną białą listą).
  - Wdrożenie Google Cloud Auth (OAuth 2.0 / Firebase Identity) z weryfikacją JWT na serwerze i białej listy administratora (`OPERATOR_EMAIL`).
  - Przejście na bazę PostgreSQL z Drizzle ORM i wymuszeniem warunku `WHERE user_id = $1` (Tenant Isolation & RLS).
  - Ochrona przed zablokowaniem serwera proxy przez Rate Limiter dzięki konfiguracji `ngx_http_realip_module` (Cloudflare / Mikrus).
- [+] **Mobilna Ergonomia i Dekompozycja Stron (Zasada ≤150-250 Linii):**
  - Likwidacja 2000-liniowych monolitów (`TimetablePage.jsx` 2053 linii, `SettingsPage.jsx` 1671 linii, `GradesPage.jsx` 1659 linii).
  - Rozbicie stron na małe mikro-komponenty (50-140 linii) z logiką w hookach TanStack Query i magazynach Zustand.
  - Architektura Strefy Kciuka (Thumb-Zone) dla smartfonów: Dolny pasek nawigacyjny (iOS Dock), natywne arkusze dolne (Bottom Sheets) z gestem Swipe-Down-to-Dismiss, obsługa klawiatury `100dvh` oraz stref bezpiecznych (`pt-safe`, `pb-safe`).
- [+] **Dokeryzacja Multi-Container (Docker Compose):**
  - Kontenery: `omnidash-web` (Nginx), `omnidash-api`, `omnidash-worker`, `omnidash-db` (PostgreSQL 16), `omnidash-redis`.
  - Multi-stage Dockerfiles redukujące obrazy do <90 MB i uruchamianie procesów jako nieuprzywilejowany użytkownik (`USER appuser`).
