import { describe, it, expect } from 'vitest';
import {
  isFinancialNotification,
  isNonExpenseNotification,
  isDuplicateNotification,
  extractExpenseHeuristic,
  formatExpenseConfirmation
} from '../modules/services/pushbulletClassifier.js';
import {
  parseAndExecuteAiActionsWithWidgets,
  isPushRequest,
  extractPushDetails
} from '../modules/services/clientAiDispatcher.js';
import { formatPushText } from '../modules/services/pushbulletService.js';

describe('Pushbullet Financial Notification Classifier', () => {
  describe('isFinancialNotification', () => {
    it('powinien rozpoznać powiadomienia z aplikacji portfelowych i bankowych z kwotą', () => {
      expect(isFinancialNotification('Portfel Google', 'Płatność kartą', 'Zapłacono 34,90 PLN w Biedronka')).toBe(true);
      expect(isFinancialNotification('Google Wallet', 'Payment successful', 'Paid 45.00 PLN at Carrefour')).toBe(true);
      expect(isFinancialNotification('Revolut', 'Płatność zrealizowana', 'Wydano 69.99 PLN w STEAM GAMES')).toBe(true);
      expect(isFinancialNotification('mBank', 'Karta', 'Transakcja na kwotę 15,20 zł w Żabka')).toBe(true);
      expect(isFinancialNotification('PKO IKO', 'Płatność zbliżeniowa', 'Płatność kartą 150.00 PLN w Orlen')).toBe(true);
    });

    it('powinien odrzucić wiadomości niezwiązane z finansami', () => {
      expect(isFinancialNotification('WhatsApp', 'Mama', 'Kup chleb wracając do domu')).toBe(false);
      expect(isFinancialNotification('System', 'Pobieranie', 'Plik pobrany pomyślnie')).toBe(false);
      expect(isFinancialNotification('Instagram', 'Nowy polubienie', 'Użytkownik polubił Twój post')).toBe(false);
    });

    it('powinien rozpoznać słowa kluczowe transakcji z walutą nawet z nieznanej aplikacji', () => {
      expect(isFinancialNotification('Aplikacja Testowa', 'Płatność kartą', 'Płatność 120 PLN zrealizowana')).toBe(true);
      expect(isFinancialNotification('Aplikacja Testowa', 'Zakup', 'Kwota transakcji: 49.99 EUR')).toBe(true);
    });
  });

  describe('isNonExpenseNotification (Filtr fałszywych alarmów)', () => {
    it('powinien odrzucić jednorazowe kody BLIK', () => {
      expect(isNonExpenseNotification('PKO Bank', 'Twój kod BLIK to 839 102. Kod ważny przez 2 minuty.')).toBe(true);
      expect(isNonExpenseNotification('mBank', 'Kod BLIK: 491 204')).toBe(true);
    });

    it('powinien odrzucić kody SMS 2FA i autoryzacje', () => {
      expect(isNonExpenseNotification('Alior Bank', 'Kod autoryzacyjny: 839182 do zmiany limitu')).toBe(true);
      expect(isNonExpenseNotification('Bank Millennium', 'Twoje hasło jednorazowe to: 192842')).toBe(true);
      expect(isNonExpenseNotification('SMS', 'Kod weryfikacyjny Google: G-491029')).toBe(true);
    });

    it('powinien odrzucić alerty logowania i salda', () => {
      expect(isNonExpenseNotification('Revolut', 'Nowe logowanie do konta z urządzenia Windows')).toBe(true);
      expect(isNonExpenseNotification('Santander', 'Zalogowano do serwisu Santander internet')).toBe(true);
      expect(isNonExpenseNotification('Pekao', 'Dostępne środki na rachunku: 1250.00 PLN')).toBe(true);
    });

    it('nie powinien odrzucać rzeczywistych wydatków i zakupów', () => {
      expect(isNonExpenseNotification('Portfel Google', 'Zapłacono 34,90 PLN w Biedronka')).toBe(false);
      expect(isNonExpenseNotification('Revolut', 'Płatność kartą w kwocie 12.00 PLN w Cafe')).toBe(false);
    });
  });

  describe('isDuplicateNotification (Deduplikacja)', () => {
    it('powinien wykrywać zduplikowane powiadomienia w oknie czasowym', () => {
      const testCache = new Map();
      const isDup1 = isDuplicateNotification('Portfel', 'Płatność', 'Zapłacono 20 PLN w Lidl', testCache, 1000);
      expect(isDup1).toBe(false); // Pierwsze wystąpienie

      const isDup2 = isDuplicateNotification('Portfel', 'Płatność', 'Zapłacono 20 PLN w Lidl', testCache, 1000);
      expect(isDup2).toBe(true); // Powtórzenie w oknie 1s

      const isDiff = isDuplicateNotification('Portfel', 'Płatność', 'Zapłacono 30 PLN w Lidl', testCache, 1000);
      expect(isDiff).toBe(false); // Inna treść -> brak duplikatu
    });
  });

  describe('extractExpenseHeuristic & Alokacja 50/30/20', () => {
    it('powinien poprawnie zakwalifikować zakupy spożywcze (Biedronka) do Needs', () => {
      const result = extractExpenseHeuristic('Portfel Google', 'Płatność zbliżeniowa', 'Zapłacono 54,20 PLN w sklepie Biedronka');
      expect(result.is_expense).toBe(true);
      expect(result.amount).toBe(54.20);
      expect(result.currency).toBe('PLN');
      expect(result.category).toBe('Jedzenie');
      expect(result.bucket).toBe('needs');
      expect(result.merchant.toLowerCase()).toContain('biedronk');
    });

    it('powinien poprawnie zakwalifikować gastronomię (McDonalds) do Wants', () => {
      const result = extractExpenseHeuristic('Google Wallet', 'Transakcja', 'Płatność 31.50 zł w McDonald\'s');
      expect(result.is_expense).toBe(true);
      expect(result.amount).toBe(31.50);
      expect(result.category).toBe('Jedzenie');
      expect(result.bucket).toBe('wants');
    });

    it('powinien poprawnie zakwalifikować gry i rozrywkę (Steam) do Wants', () => {
      const result = extractExpenseHeuristic('Revolut', 'Płatność kartą', 'Wydano 129.99 PLN w STEAM GAMES');
      expect(result.is_expense).toBe(true);
      expect(result.amount).toBe(129.99);
      expect(result.category).toBe('Rozrywka');
      expect(result.bucket).toBe('wants');
      expect(result.merchant.toLowerCase()).toContain('steam');
    });

    it('powinien poprawnie zakwalifikować stację paliw (Orlen) do Needs', () => {
      const result = extractExpenseHeuristic('IKO', 'Płatność kartą', 'Transakcja na kwotę 210,50 PLN na stacji Orlen');
      expect(result.is_expense).toBe(true);
      expect(result.amount).toBe(210.50);
      expect(result.category).toBe('Transport');
      expect(result.bucket).toBe('needs');
    });

    it('powinien poprawnie zakwalifikować aptekę (DOZ) do Needs', () => {
      const result = extractExpenseHeuristic('Portfel Google', 'Płatność', 'Zapłacono 48.00 PLN w Apteka DOZ');
      expect(result.is_expense).toBe(true);
      expect(result.amount).toBe(48.00);
      expect(result.category).toBe('Zdrowie');
      expect(result.bucket).toBe('needs');
    });
  });

  describe('formatExpenseConfirmation', () => {
    it('powinien generować czytelne potwierdzenie dla powiadomień Push', () => {
      const text = formatExpenseConfirmation({
        amount: 45.50,
        currency: 'PLN',
        merchant: 'Biedronka',
        bucket: 'needs',
        category: 'Jedzenie'
      });
      expect(text).toContain('45.50 PLN');
      expect(text).toContain('Biedronka');
      expect(text).toContain('Potrzeby');
      expect(text).toContain('Jedzenie');
    });
  });

  describe('Action Tag [ACTION:SEND_PUSH]', () => {
    it('powinien usunąć znacznik SEND_PUSH z czyszczonego tekstu asystenta AI', () => {
      const aiResponse = 'Oto lista Twoich zadań na dziś. Właśnie przesłałem ją na Twój telefon.\n[ACTION:SEND_PUSH title="Zadania na dziś" body="1. Trening 2. Raport 3. Zakupy"]';
      const { cleanedText } = parseAndExecuteAiActionsWithWidgets(aiResponse);
      expect(cleanedText).toBe('Oto lista Twoich zadań na dziś. Właśnie przesłałem ją na Twój telefon.');
      expect(cleanedText).not.toContain('ACTION:SEND_PUSH');
    });

    it('powinien usunąć halucynowaną sekcję poradnikową "Co zrobić z tymi informacjami?"', () => {
      const aiResponse = `| Dzień | Godzina | Przedmiot |
|---|---|---|
| czwartek | 12:20 | Matematyka |

---

#### Co zrobić z tymi informacjami?
- Skopiuj powyższą tabelę i wyślij ją do siebie np. przez SMS, e‑mail lub komunikator.
- Jeśli potrzebujesz, mogę dodać tę lekcję do Twojego kalendarza lub ustawić przypomnienie – daj znać, a wykonam odpowiednią akcję.`;
      const { cleanedText } = parseAndExecuteAiActionsWithWidgets(aiResponse);
      expect(cleanedText).not.toContain('Co zrobić z tymi informacjami');
      expect(cleanedText).not.toContain('Skopiuj powyższą tabelę');
      expect(cleanedText).toContain('Matematyka');
    });

    it('powinien przechwycić i zastąpić halucynowaną odmowę wysyłki push, gdy użytkownik prosi o wysyłkę na telefon', () => {
      const hallucinatedDenial = 'Niestety w aktualnym zestawie dostępnych akcji systemowych nie ma polecenia umożliwiającego wysyłanie push‑powiadomień na telefon.';
      const { cleanedText } = parseAndExecuteAiActionsWithWidgets(hallucinatedDenial, 'Wyślij Testowy Push na Telefon');
      expect(cleanedText).toContain('Wysłano powiadomienie Push na Twój telefon');
      expect(cleanedText).not.toContain('nie ma polecenia');
    });
  });

  describe('Autonomous Push Intent Detection (isPushRequest & extractPushDetails)', () => {
    it('powinien poprawnie wykrywać intencję wysłania powiadomienia na telefon', () => {
      expect(isPushRequest('wyślij mi na telefon następną lekcję')).toBe(true);
      expect(isPushRequest('jaka jest nastepna lekcja i wyslij to na tel')).toBe(true);
      expect(isPushRequest('prześlij na telefon zadania na dziś')).toBe(true);
      expect(isPushRequest('sprawdź pogodę i wyślij powiadomienie push')).toBe(true);
      expect(isPushRequest('wyślij na smartfon')).toBe(true);
      expect(isPushRequest('czy możesz to przesłać na komórkę?')).toBe(true);
      expect(isPushRequest('Wyślij Testowy Push na Telefon')).toBe(true);
      expect(isPushRequest('testowy push')).toBe(true);
    });

    it('powinien zwracać false dla zapytań bez intencji push', () => {
      expect(isPushRequest('jaka jest następna lekcja?')).toBe(false);
      expect(isPushRequest('pokaż mi plan zajęć na czwartek')).toBe(false);
      expect(isPushRequest('ile wydałem w tym miesiącu na jedzenie?')).toBe(false);
      expect(isPushRequest('')).toBe(false);
      expect(isPushRequest(null)).toBe(false);
      expect(isPushRequest(undefined)).toBe(false);
    });

    it('powinien wyodrębnić adekwatny tytuł i oczyszczoną treść w extractPushDetails', () => {
      const query = 'wyślij mi na telefon plan lekcji';
      const aiResponse = `**Plan Lekcji na Dziś:**
| Godzina | Przedmiot | Sala |
| 08:00 | Fizyka | 101 |
| 09:00 | Matematyka | 202 |

[ACTION:SEND_PUSH title="Plan" body="test"]`;

      const details = extractPushDetails(query, aiResponse);
      expect(details.title).toBe('OmniDash: Plan Lekcji');
      expect(details.body).not.toContain('ACTION:SEND_PUSH');
      expect(details.body).not.toContain('**');
      expect(details.body).toContain('Fizyka');
      expect(details.body).toContain('Matematyka');
      expect(details.body.length).toBeLessThanOrEqual(280);
    });

    it('powinien dopasować tytuł dla zapytań o pogodę, zadania i finanse', () => {
      expect(extractPushDetails('jaka jest pogoda i wyślij na tel', '18C, deszcz').title).toBe('OmniDash: Prognoza Pogody');
      expect(extractPushDetails('wyślij na telefon moje zadania todo', '1. Kup mleko').title).toBe('OmniDash: Zadania');
      expect(extractPushDetails('wyślij na tel raport finanse i wydatki', 'Suma: 150 PLN').title).toBe('OmniDash: Finanse');
      expect(extractPushDetails('wyślij mi to na telefon', 'Informacja ogólna').title).toBe('OmniDash Powiadomienie');
    });
  });

  describe('formatPushText (Formatowanie powiadomień Push)', () => {
    it('powinien zamieniać dosłowne sekwencje \\n i \\r\\n na rzeczywiste znaki nowej linii', () => {
      const raw = '08:00 - 08:45: WF\\n08:50 - 09:35: Matematyka\\r\\n09:40 - 10:25: Język Polski';
      const formatted = formatPushText(raw);
      expect(formatted).not.toContain('\\n');
      expect(formatted).not.toContain('\\r');
      expect(formatted).toContain('\n');
      expect(formatted.split('\n')).toHaveLength(3);
    });

    it('powinien usuwać znaczniki Markdown (**pogrubienie**, kursywy, nagłówki)', () => {
      const raw = '### **Plan Lekcji na Dziś:**\n* Punkt 1: _Ważne_\n`kod testowy`';
      const formatted = formatPushText(raw);
      expect(formatted).not.toContain('**');
      expect(formatted).not.toContain('###');
      expect(formatted).not.toContain('_');
      expect(formatted).not.toContain('`');
      expect(formatted).toContain('Plan Lekcji na Dziś:');
      expect(formatted).toContain('Punkt 1: Ważne');
      expect(formatted).toContain('kod testowy');
    });

    it('powinien przekształcać wiersze tabel Markdown na estetyczne punkty listy z wyróżnioną salą i skrótem', () => {
      const markdownTable = `| Godzina | Przedmiot | Sala |
|---|---|---|
| 08:00 - 08:45 | Wychowanie Fizyczne | Sala 1.16 |
| 08:50 - 09:35 | Matematyka | Sala 2.04 |`;
      const formatted = formatPushText(markdownTable);
      expect(formatted).not.toContain('|');
      expect(formatted).toContain('• 08:00 - 08:45 [Sala 1.16] WF');
      expect(formatted).toContain('• 08:50 - 09:35 [Sala 2.04] Matematyka');
    });

    it('powinien formatować surowe wpisy planu lekcji z długimi nazwami, wyodrębniać salę, nauczyciela i usuwać zbędne typy zajęć', () => {
      const rawTimetable = `08:00-08:45 Pracownia urządzeń techniki komputerowej (Sala 1.16, PW, Laboratorium)
\\n08:50-09:35 Pracownia urządzeń techniki komputerowej (Sala 1.16, PW, Laboratorium)
\\n09:40-10:25 Zajęcia z wychowawcą (Sala 1.16, ZJ, Inne)
\\n10:40-11:25 Wychowanie fizyczne (Hala, GŁ, Ćwiczenia)
\\n12:20-13:05 Pracownia systemów operacyjnych (Sala 1.16, SR, Laboratorium)
\\n14:05-14:50 Matematyka (Sala 26, ZB, Wykład)`;

      const formatted = formatPushText(rawTimetable);
      expect(formatted).not.toContain('\\n');
      expect(formatted).not.toContain('Laboratorium');
      expect(formatted).not.toContain('Ćwiczenia');
      expect(formatted).not.toContain('Wykład');

      expect(formatted).toContain('• 08:00 - 08:45 [Sala 1.16] Pracownia UTK (PW)');
      expect(formatted).toContain('• 08:50 - 09:35 [Sala 1.16] Pracownia UTK (PW)');
      expect(formatted).toContain('• 09:40 - 10:25 [Sala 1.16] Godz. wychowawcza (ZJ)');
      expect(formatted).toContain('• 10:40 - 11:25 [Hala] WF (GŁ)');
      expect(formatted).toContain('• 12:20 - 13:05 [Sala 1.16] Pracownia SO (SR)');
      expect(formatted).toContain('• 14:05 - 14:50 [Sala 26] Matematyka (ZB)');
    });

    it('powinien formatować zakresy godzin bez punktorów dodając estetyczny punktor •', () => {
      const schedule = '08:00-08:45 WF\n08:50 - 09:35 Matematyka';
      const formatted = formatPushText(schedule);
      expect(formatted).toContain('• 08:00 - 08:45 WF');
      expect(formatted).toContain('• 08:50 - 09:35 Matematyka');
    });

    it('powinien poprawnie obsługiwać puste wartości', () => {
      expect(formatPushText('')).toBe('');
      expect(formatPushText(null)).toBe('');
      expect(formatPushText(undefined)).toBe('');
    });
  });
});

