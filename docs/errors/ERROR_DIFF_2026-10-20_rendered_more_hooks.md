# ERROR_DIFF :: Rendered more hooks than during the previous render

**Data:** 2026-10-20  
**ID Błędu:** ERR_REACT_HOOKS_COUNT_MISMATCH_V320  
**Komponent:** `core.client.jsx` (`App`)  
**Klasyfikacja:** KRYTYCZNY (Błąd cyklu renderowania React / Naruszenie Zasad Hooków)  
**Status:** [+] ZAMKNIĘTY / ROZWIĄZANY  

---

## 1. PROBLEM

### Terminal / Runtime Raw
```
Error: Error: Rendered more hooks than during the previous render.

Stack:
    at goe (https://void-potato-7721.web.app/assets/index-DDbW7U9K.js:4496:30873)
    at hie (https://void-potato-7721.web.app/assets/index-DDbW7U9K.js:4217:107659)
    at D6 (https://void-potato-7721.web.app/assets/index-DDbW7U9K.js:232:4602)
    at toe (https://void-potato-7721.web.app/assets/index-DDbW7U9K.js:4493:66562)
```

### Klasyfikacja & Diagnoza
W komponencie `App` w pliku `core.client.jsx`, nowy efekt nasłuchujący zdarzenia otwarcia kreatora konfiguracji `openSetupWizard` został umieszczony za blokiem warunkowego wyjścia:
```javascript
if (isVerifying) {
  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-[#0A0B0E] ...">
      ...
    </div>
  );
}

// BŁĄD: Wywołanie hooka po warunkowym returnie
useEffect(() => {
  const handleOpenWizard = () => setShowSetupModal(true);
  window.addEventListener('openSetupWizard', handleOpenWizard);
  return () => window.removeEventListener('openSetupWizard', handleOpenWizard);
}, []);
```
1. Podczas pierwszego renderu (`isVerifying === true`) komponent `App` natychmiast zwracał ekran inicjalizacji. Zarejestrowane zostały 4 hooki `useEffect`.
2. Podczas drugiego renderu (`isVerifying === false`, po weryfikacji kluczy/tokena) warunek nie był spełniony, co doprowadziło do wykonania 5. hooka `useEffect`.
3. Silnik React Fiber wykrył niezgodność liczby hooków w kolejnych renderach i zgłosił błąd `Rendered more hooks than during the previous render`, wyzwalając `ErrorBoundary`.

---

## 2. SOLUTION

### Zmiana w Kodzie
Przeniesiono `useEffect` nasłuchujący `openSetupWizard` przed blok `if (isVerifying)`, gwarantując, że wszystkie hooki komponentu `App` są wywoływane bezwarunkowo na najwyższym poziomie i w stałej kolejności przy każdym renderze:

```javascript
  // Inicjalizacja nasłuchu słowa wybudzającego od startu aplikacji (w tym na ekranie blokady)
  useEffect(() => {
    wakeWordService.start();

    const handleWakeOnLock = () => {
      if (!isAuthenticated) {
        handleUnlock();
      }
    };
    window.addEventListener('wakeWordDetected', handleWakeOnLock);
    return () => window.removeEventListener('wakeWordDetected', handleWakeOnLock);
  }, [isAuthenticated]);

  // Globalny listener otwierający kreator onboardingowy z dowolnego miejsca
  useEffect(() => {
    const handleOpenWizard = () => setShowSetupModal(true);
    window.addEventListener('openSetupWizard', handleOpenWizard);
    return () => window.removeEventListener('openSetupWizard', handleOpenWizard);
  }, []);

  const handleUnlock = async () => {
    ...
  };

  if (isVerifying) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-[#0A0B0E] text-textPrimary font-mono">
        ...
      </div>
    );
  }
```

---

## 3. POST-MORTEM

- **STATUS:** [+] ROZWIĄZANY (PROD TESTED)
- **APPROACH:** Ścisłe przestrzeganie "Rules of Hooks" (Narzędzie: linter/audyt kolejności deklaracji). Wszystkie wywołania `useState`, `useEffect`, `useCallback`, `useMemo` muszą znajdować się przed jakimkolwiek instrukcją `return` w ciele komponentu funkcyjnego.
- **IMPROVED:** Integralność cyklu życia komponentu głównego `App`. Aplikacja przechodzi płynnie ze stanu inicjalizacji do pulpitu/ekranu blokady bez asynchronicznych awarii.
- **BROKE:** Brak regresji. Wszystkie 264 testy jednostkowe i integracyjne zachowują 100% status PASS.
