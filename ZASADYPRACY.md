# ZASADYPRACY.md
Ten plik stanowi nadrzędne reguły protokołu System v3.0.0.

Zasady:
1. Filar Trwałości — Persistence & Expansion: Bezwzględny zakaz usuwania wypracowanych elementów, rozszerzanie poprzez moduły. Ślad architektoniczny w ARCHITECTURE.md i HISTORY.md.
2. Hierarchia Folderów: Obowiązkowy układ z `core.*`, `ZASADYPRACY.md`, `ARCHITECTURE.md`, `HISTORY.md` oraz folderami `/modules/`, `/docs/`, `/data/`, `/assets/`.
3. Rygor Terminologiczny: Profesjonalny język inżynieryjny (np. "eliminacja defektów", a nie "naprawa bugów").
4. Synchronizacja Środowiskowa: Projekt żyje w lokalizacji Pulpitu i jest synchronizowany z powłokami.
5. Wersjonowanie (SemVer): Tylko format MAJOR.MINOR.PATCH w plikach HISTORY.md i /docs/versions/.
6. Audyt Przedwdrożeniowy: Weryfikacja kodu, dokumentacji, bezpieczeństwa, struktury przed każdą zmianą.
7. Priorytet Zero: Wczytanie ZASADYPRACY.md przed każdym działaniem.
8. Mapowanie Architektury: ARCHITECTURE.md musi zawsze odzwierciedlać strukturę i zaleźności.
9. Niemutowalny Rejestr Wersji: HISTORY.md jest dopisywany (append-only), nie modyfikowany.
10. Protokół ERROR_DIFF: Rejestracja błędów w `/docs/errors/` w celu iteracyjnej naprawy.
11. Ghost Operator: Brak logowania danych osobowych operatora, używanie substytutów (np. `$API_KEY`).
12. Rygor Wizualny Dokumentacji: Jasne struktury, odpowiednie formatowanie Markdown.
13. Debug-First: Sprawdzenie stanu środowiska przed wprowadzaniem zmian.
14. Auto-Mapper: Skrypty aktualizujące dokumentację.
15. Secure-by-Design: Wyodrębnienie wrażliwych zmiennych środowiskowych do .env.
16. Live-Verification: Sprawdzenie środowiska uruchomieniowego.
17. Triple-Efficiency: Kod zoptymalizowany pod kątem wydajności.
18. Absolute Obedience: Bezwzględne wykonywanie poleceń zgodnie z protokołem.
19. Code Completeness: Zakaz "placeholderów" TODO w kodzie.
20. Ghost Mode: Minimalny szum konwersacyjny, tylko konkretny log inżynieryjny.
21. Adaptive-Clean: Skupienie na nowoczesnym designie i estetyce w UI (Hyper-Minimalism, Glassmorphism).
22. Aggregate Report: Raporty zbiorcze ze statystykami zmian.
23. Izolacja Poświadczeń: Klucze np. API przechowywane bezpiecznie.
24. Path Integrity Standard: Sprawdzanie i poszanowanie struktury ścieżek projektowych.
25. Log Format: Standaryzowane logowanie błędów i informacji.
26. Auto-Commit Protocol: Każda zmiana kodu, nowa funkcjonalność i aktualizacja musi być po ukończeniu natychmiast wrzucana do repozytorium (git add, commit, push) przez agenta AI.
