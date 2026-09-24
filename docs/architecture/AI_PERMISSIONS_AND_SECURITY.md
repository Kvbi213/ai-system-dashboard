# MODEL UPRAWNIEŃ I BEZPIECZEŃSTWA AGENTA AI (AI SECURITY & SANDBOX GOVERNANCE)

**Wersja:** v2.29.0  
**Status:** AKTYWNY | PRODUKCJA  
**Zastosowanie:** Globalne w ekosystemie OmniDash  
**Poziom Zabezpieczeń:** Zero-Trust / Enterprise Sandboxing  

---

## 1. WPROWADZENIE I ARCHITEKTURA POLICY ENGINE

Agent AI w systemie OmniDash został zaprojektowany w oparciu o paradygmat **Secure-by-Design** oraz zasadę minimalnych uprawnień (**Least Privilege Principle**). Model LLM nie posiada bezpośredniego dostępu do systemu operacyjnego stacji roboczej, powłoki systemowej ani poufnych plików konfiguracyjnych.

Każde żądanie wywołania narzędzia generowane przez model LLM przechodzi przez deterministyczny silnik reguł (**Policy Engine**) weryfikujący bezpieczeństwo operacji przed jej fizycznym wykonaniem na warstwie danych lub sieci.

```
       [ Operator / Użytkownik ]
                   │
                   ▼
       [ Model LLM (GPT-120B) ]
                   │
                   ▼ (Propozycja Tool Call)
    ┌──────────────────────────────────────────────┐
    │          OMNIDASH POLICY ENGINE              │
    │  • Weryfikacja czarnej listy plików (.env)   │
    │  • Path Traversal Guard (izolacja do root)   │
    │  • Tarcza anty-SSRF (IPv4/IPv6/RFC1918)      │
    │  • Wymóg confirmed: true dla operacji HIGH   │
    │  • Walidacja schematów i typów parametrów    │
    └──────────────────────┬───────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
      [ ZATWIERDZENIE ]           [ BLOKADA OPERACJI ]
             │                           │
             ▼                           ▼
   [ Wykonanie Narzędzia ]      [ Alert Bezpieczeństwa ]
   • Baza danych SQLite         • Odmowa wykonania
   • Cloud Firestore            • Zapis w system_logs
   • Pushbullet API             • Komunikat dla użytkownika
```

---

## 2. JAWNE ZESTAWIENIE DOSTĘPU: CO AI MOŻE, A CZEGO NIE MOŻE

Poniższa tabela stanowi wiążący rejestr granic uprawnień asystenta AI w OmniDash:

| Obszar Systemu | Status Dostępu AI | Mechanizm Zabezpieczający |
|---|---|---|
| **Pliki `.env`, `.env.*`, sekrety** | **[X] BRAK DOSTĘPU (BLOKADA)** | Twardy filtr `SENSITIVE_FILES_REGEX` w `modules/fs_explorer.js` odrzuca wszelkie próby odczytu `.env`, `.env.example`, certyfikatów i kluczy API. |
| **Klucze Firebase (`firebase-service-account.json`)** | **[X] BRAK DOSTĘPU (BLOKADA)** | Plik poświadczeń konta usługi Firebase jest objęty bezwzględną blokadą odczytu w silniku eksploratora plików. |
| **Powłoka systemowa (bash, sh, powershell, cmd)** | **[X] BRAK INTERFEJSU (BRAK DOSTĘPU)** | W kodzie backendu usunięto moduł `exec`/`child_process` dla agenta. AI nie posiada żadnego narzędzia umożliwiającego wykonanie dowolnego polecenia w powłoce OS. |
| **Pliki systemowe OS poza katalogiem projektu** | **[X] BRAK DOSTĘPU (BLOKADA)** | Mechanizm Path Traversal Shield w `readProjectFile` rozwiązuje ścieżki kanoniczne i blokuje próby ucieczki poza `$PROJECT_ROOT` (np. `../../windows/system32/cmd.exe`). |
| **Lokalna sieć LAN i adresy metadanych (SSRF)** | **[X] BRAK DOSTĘPU (BLOKADA)** | Tarcza SSRF w `modules/osint.js` blokuje skanowanie adresów pętli zwrotnej (`127.0.0.0/8`, `::1`), RFC 1918 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local/chmury (`169.254.169.254`) oraz IPv6 ULA (`fc00::/7`). |
| **Reguły bezpieczeństwa (`firestore.rules`)** | **[X] BRAK MOŻLIWOŚCI ZMIANY** | Reguły Firestore są wdrażane wyłącznie przez operatora w procesie CI/CD i kompilacji Firebase CLI. AI nie posiada narzędzi do modyfikacji reguł chmury. |
| **Baza danych SQLite (Zadania, Treningi, Finanse)** | **[OK] PEŁNY DOSTĘP KONTROLOWANY** | Wyłącznie poprzez dedykowane, parametryzowane narzędzia SQL (`ADD_TO_DO`, `DELETE_TO_DO`, `ADD_FINANCE_RECORD`, `TRANSFER_FUNDS`). Brak bezpośredniego surowego SQL. |
| **Baza Cloud Firestore** | **[OK] DOSTĘP REGULOWANY REGUŁAMI** | Dostęp ograniczony przez Firebase Security Rules; zapis do budżetu i poświadczeń Librus wymaga uprawnień `isOwner()`. |
| **Dziennik Szkolny Librus Synergia** | **[OK] DOSTĘP ŚCIŚLE READ-ONLY** | Asystent posiada wyłącznie wgląd do zbuforowanych ocen, terminarza i planu lekcji. Brak jakichkolwiek funkcji modyfikacji danych szkolnych. |
| **Powiadomienia Smartfon (Pushbullet)** | **[OK] WYSYŁANIE POWIADOMIEŃ** | Narzędzie `SEND_PUSH` pozwala asystentowi przesyłać komunikaty, alerty i raporty na telefon operatora. |
| **Wyszukiwarka Internetowa (Brave Search API)** | **[OK] ODCZYT INFORMACJI ZE ŚWIATA** | Zapytania read-only do zewnętrznego API wyszukiwarki w celu pozyskania bieżących danych faktograficznych. |

---

## 3. MATRYCA POZIOMÓW RYZYKA I ZARZĄDZANIE WYKONANIEM

Wszystkie operacje w ekosystemie OmniDash podzielone są na 4 twarde poziomy ryzyka:

```
                  ┌──────────────────────────────────────────────┐
  POZIOM RYZYKA   │           DZIAŁANIE POLICY ENGINE            │
  ────────────────┼──────────────────────────────────────────────┤
  [!] CRITICAL    │ BEZWZGLĘDNA BLOKADA SYSTEMOWA (HARD BLOCK)   │
  [!] HIGH        │ WYMÓG POTWIERDZENIA OPERATORA (TWO-STEP)     │
  [*] MEDIUM      │ WALIDACJA PARAMETRÓW + AUDYT W SYSTEM_LOGS   │
  [+] LOW         │ AUTOMATYCZNE WYKONANIE + REJESTRACJA ZDARZEŃ │
                  └──────────────────────────────────────────────┘
```

### 3.1. Poziom CRITICAL (Bezwzględna Blokada Systemowa)
Operacje tego typu są natychmiastowo przerywane przez kod backendu z kodem błędu. Użytkownik ani asystent nie mogą ich wymusić żadnym poleceniem konwersacyjnym:
- Próba odczytu plików środowiskowych: `.env`, `.env.local`, `.env.production`.
- Próba odczytu poświadczeń chmurowych: `firebase-service-account.json`, `temp_users.json`, kluczy `.key`/`.pem`.
- Próba wyjścia poza przestrzeń roboczą projektu (Path Traversal `../`).
- Próba wywołania polecenia powłoki systemowej (arbitrary shell command).
- Próba skanowania wywiadem OSINT adresów prywatnych sieci LAN, metadanych AWS/GCP (`169.254.169.254`) lub adresów IPv6 ULA.

### 3.2. Poziom HIGH (Wymóg Potwierdzenia / Human-in-the-Loop)
Operacje o wysokim potencjale destrukcyjnym wymagają dwuetapowej procedury weryfikacyjnej:
- **Masowe usuwanie zadań (`DELETE_TO_DO all`):**
  - Wywołanie bez parametru `confirmed: true` jest wstrzymywane przez blokadę bezpieczeństwa:  
    `Narzędzie DELETE_TO_DO [BLOKADA BEZPIECZEŃSTWA]: Usunięcie wszystkich zadań naraz zostało wstrzymane. Wymaga to jednoznacznego potwierdzenia operatora.`
  - Asystent ma obowiązek zapytać operatora o zgodę przed przekazaniem flagi `confirmed: true`.

### 3.3. Poziom MEDIUM (Ścisła Walidacja Parametryczna i Audyt)
Operacje modyfikujące stan danych finansowych lub pojedynczych wpisów:
- **Transfer środków między koszykami (`TRANSFER_FUNDS`):**
  - Wymóg dodatniej kwoty transakcji (`amount > 0`).
  - Wymóg istnienia prawidłowego koszyka źródłowego i docelowego (`needs`, `wants`, `savings`).
  - Zabezpieczenie przed transferem na ten sam koszyk.
- **Usunięcie rekordu finansowego (`DELETE_FINANCE_RECORD`):**
  - Weryfikacja istnienia transakcji w bazie danych przed wykonaniem `DELETE`.
  - Obowiązkowy zapis audytowy w tabeli `system_logs` (`FINANCE_DELETE`).
- **Pojedyncze usunięcie zadania (`DELETE_TO_DO id`):**
  - Weryfikacja istnienia identyfikatora w tabeli `tasks`.
  - Raportowanie częściowego sukcesu (`notFoundIds`) przy przekazaniu listy identyfikatorów.
  - Rejestracja zdarzenia w `system_logs` (`TASK_DELETE`).

### 3.4. Poziom LOW (Operacje Bezpieczne i Odwracalne)
Operacje wykonywane natychmiastowo z zachowaniem pełnej telemetrii:
- Odczyt danych: plan lekcji, oceny Librus, bieżący budżet, pogoda Open-Meteo, alerty drogowe CANARD/GDDKiA.
- Dodanie nowego zadania (`ADD_TO_DO`).
- Dodanie rekordu treningu (`ADD_WORKOUT`).
- Dodanie pojedynczego wydatku lub przychodu (`ADD_FINANCE_RECORD`).
- Wyszukiwanie informacji w internecie (`BRAVE_SEARCH`).
- Skanowanie publicznych domen lub adresów IP w module OSINT.

---

## 4. CHARAKTERYSTYKA TRYBÓW OPERACYJNYCH AGENTA

W architekturze OmniDash wyróżnia się trzy wyspecjalizowane tryby pracy asystenta:

### 4.1. Tryb Wykonawczy: Dash AI (Worker)
- **Cel:** Maksymalna wydajność operacyjna i automatyzacja codziennych czynności.
- **Zachowanie:**
  - Operacje **LOW** oraz **MEDIUM** są wykonywane automatycznie na podstawie poleceń użytkownika, bez konieczności wielokrotnego dopytywania o trywialne potwierdzenia.
  - Operacje **HIGH** nadal bezwzględnie wymagają potwierdzenia (`confirmed: true`).
  - Blokady **CRITICAL** pozostają aktywne w 100% i nie mogą zostać wyłączone.
- **Podsumowanie:** *Mniej irytujących pytań przy zachowaniu pełnego rygoru bezpieczeństwa.*

### 4.2. Tryb Doradczy: Normal AI (Mentor)
- **Cel:** Strategiczna analityka osobista, doradztwo budżetowe, planowanie nauki i treningów.
- **Zachowanie:**
  - Skupiony na operacjach **READ-ONLY**.
  - Wykonuje dogłębne analizy postępów edukacyjnych (Librus), korelacji wydatków i alokacji oszczędności.
  - Wszelkie propozycje modyfikacji struktur danych są prezentowane jako rekomendacje dla operatora.

### 4.3. Tryb Ciągły: OmniDaemon (Mobile 24/7 Guard)
- **Cel:** Przetwarzanie asynchronicznych zdarzeń ze smartfona przez Pushbullet WebSocket.
- **Zachowanie:**
  - Samoczynne klasyfikowanie powiadomień bankowych w oknie deduplikacji 60 sekund.
  - Automatyczne przypisywanie wydatków do koszyków 50/30/20.
  - Natychmiastowe odsyłanie raportów zwrotnych na telefon w przypadku zapytań mobilnych.

---

## 5. PODSUMOWANIE DLA AUDYTORÓW BEZPIECZEŃSTWA

1. **Izolacja Poświadczeń:** Model językowy nigdy nie otrzymuje w promptach wartości kluczy API, tokenów sesyjnych ani zawartości plików `.env`. Wszelkie poświadczenia są używane wyłącznie wewnątrz kodu serwerowego przez dedykowane biblioteki.
2. **Brak Dostępu do Powłoki:** System nie udostępnia żadnego mechanizmu wywoływania poleceń powłoki (brak RCE).
3. **Deterministyczny Sandboxing:** Nawet w przypadku podatności na techniki Prompt Injection model LLM nie jest w stanie odczytać plików spoza projektu, uzyskać dostępu do sekretów ani przeskanować sieci wewnętrznej, ponieważ ograniczenia te są wymuszane na poziomie kodu interpretera narzędzi, a nie samego promptu.
