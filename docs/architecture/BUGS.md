# Rejestr Błędów i Zadań Naprawczych (BUGS & ROADMAP)

Ten plik służy jako bieżący notatnik zgłoszeń operacyjnych. Pełny, strategiczny rejestr zadań i roadmap znajduje się w pliku:
`docs/architecture/ROADMAP_TODO.md`.

## [KRYTYCZNY] Główne Zadania Rozwojowe (Priorytet P0)
- [ ] **TASK-01:** Kompleksowy Redesign GUI & Architektura Mobile-First v3.0 (likwidacja scroll-jackingu, podwójnego paddingu, interaktywny tracker FBW na strych). Zob. `docs/architecture/MASTER_GUI_REDESIGN_DOCUMENT.md`.
- [ ] **TASK-02:** Wielometodowy System Kont Użytkowników & Firebase Multi-Auth (Google Sign-In, Email/Password/Link, SMS OTP, model multi-tenant w Firestore `users/{uid}`, rozszerzenia Firebase Extensions: Trigger Email, Resize Images, Delete User Data). Zob. `docs/architecture/ROADMAP_TODO.md`.

## [ŚREDNI] Oczekujące Poprawki / Nowe Funkcje
- [x] Wymyślić oryginalną nazwę dla projektu (OmniDash).
- [x] Dodać zakładkę "Finanse" (zarządzanie budżetem 50/30/20 wspierane przez AI).
- [x] Dodać zakładkę "Treningi" (wspierane przez AI, FBW Strych).
- [x] Dodać zakładkę "Zarządzanie serwerem" (`/server` ServerPage.jsx).
- [x] Połączenie Mentor -> Worker (delegowanie zadań).
- [ ] Wbudowana przeglądarka zintegrowana z kontami użytkownika.
- [ ] Wsparcie dla bezpośredniego streamingu WebRTC Audio dla Hej Omni.
- [ ] Moduł bramy IoT Smart Access (ESP32 / MQTT Mosquitto).

## [NISKI] Zrealizowane (Archiwum)
- **[Naprawione]** Odczyt czasu z powiadomień Pushbullet był przesunięty o 2h (UTC vs Local Time).
- **[Naprawione]** Tryb głosowy live renderował tagi markdown jako płaski tekst.
- **[Naprawione]** Brakowało możliwości zmiany głosu w trybie głosowym - dodano Fish Audio oraz Edge Neural TTS.
- **[Naprawione]** Scraper Librus pomijał odwołane lekcje – wdrożono pełne wykrywanie tagów `<s>` i statusów zastępstw.
- **[Naprawione]** Odświeżanie ocen w `GradesPage` miało pozorny czas 10ms – wdrożono progres bar min. 800ms i realną synchronizację.

---
*Plik zsynchronizowany z `docs/architecture/ROADMAP_TODO.md` oraz Obsidian Vault.*
