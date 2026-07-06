# Rejestr Błędów i Zadań Naprawczych (BUGS)

Ten plik służy jako główny notatnik do spisywania błędów (bugów), uwag i rzeczy do poprawy w systemie. Możesz w każdej chwili napisać do mnie "zapisz błąd..." i umieszczę go tutaj, byśmy mogli do niego wrócić.

## 🔴 Krytyczne Błędy do Naprawy
*(brak)*

## 🟡 Oczekujące Poprawki / Nowe Funkcje
- [ ] Wymyślić oryginalną nazwę dla projektu.
- [ ] Dodać zakładkę "Finanse" (zarządzanie budżetem wspierane przez AI).
- [ ] Dodać zakładkę "Treningi" (wspierane przez AI).
- [ ] Dodać zakładkę "Zarządzanie serwerem".
- [x] Połączenie Mentor -> Worker (Mentor może delegować zadania do wykonania przez Workera).
- [ ] Wbudowana przeglądarka zintegrowana z kontami użytkownika.
- [ ] Łatwiejsza konfiguracja początkowa (np. ominięcie płatnego Brave API, autoryzacja kontem Google).
- [ ] Wsparcie dla innych dostawców modeli AI (NVIDIA API, Google AI Studio itp).

## 🟢 Zrealizowane (Archiwum)
- **[Naprawione]** Odczyt czasu z powiadomień Pushbullet był przesunięty o 2h (problem z UTC vs Local Time). Zostało to poprawione bezpośrednio w silniku odczytu bazy w `agent.js`.
- **[Naprawione]** Tryb głosowy live renderował tagi markdown jako płaski tekst. Zostało to poprawione poprzez zastosowanie `ReactMarkdown` w komponencie `Terminal.jsx`.
- **[Naprawione]** Brakowało możliwości zmiany głosu w trybie głosowym - dodano opcję wyboru (Męski/Damski) i suwak prędkości w głównych ustawieniach.

---
*Plik aktualizowany na bieżąco przez asystenta AI.*
