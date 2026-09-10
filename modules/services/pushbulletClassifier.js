import crypto from 'crypto';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Rejestr znanych aplikacji finansowych, portfeli i banków
export const FINANCIAL_APPS = [
  'portfel', 'wallet', 'google pay', 'apple pay',
  'revolut', 'mbank', 'iko', 'pko', 'santander', 'pekao', 'peopay',
  'ing', 'moje ing', 'millennium', 'alior', 'velobank', 'nest bank',
  'curve', 'paypal', 'blik', 'citi handlowy', 'credit agricole',
  'twisto', 'zen', 'klarna'
];

// Słowa kluczowe wskazujące na transakcję płatniczą
export const TRANSACTION_KEYWORDS = [
  'płatność', 'platnosc', 'zapłacono', 'zaplacono', 'transakcja',
  'karta', 'karcie', 'zakup', 'wydatek', 'obciążenie', 'obciazenie',
  'payment', 'paid', 'purchase', 'spent', 'debit', 'pos'
];

// Wykluczenia - kody jednorazowe, 2FA, logowania, ostrzeżenia bezpieczeństwa
export const NON_EXPENSE_PATTERNS = [
  /tw[óo]j\s+kod\s+blik/i,
  /kod\s+blik[:\s]+\d{3}\s*\d{3}/i,
  /kod\s+autoryzacyjny/i,
  /has[łl]o\s+jednorazowe/i,
  /kod\s+weryfikacyjny/i,
  /kod\s+sms/i,
  /nowe\s+logowanie/i,
  /zalogowano\s+do/i,
  /zalogowano\s+na\s+nowym/i,
  /nieudana\s+pr[óo]ba/i,
  /stan\s+konta\s+wynosi/i,
  /dost[ęe]pne\s+[śs]rodki/i
];

// Mapa kategorii i kubełków 50/30/20 dla znanych merchantów
export const MERCHANT_RULE_MAP = [
  // Jedzenie (Spożywcze -> Needs)
  { regex: /biedronk|lidl|auchan|carrefour|dino|kaufland|stokrotka|żabk|zabk|aldi|polo\s*market/i, category: 'Jedzenie', bucket: 'needs', merchant: 'Sklep spożywczy' },
  // Restauracje / Fast Food -> Wants
  { regex: /mcdonald|kfc|burger\s*king|pizz|kawiarni|starbucks|costa|restauracj|kebab|sushi|ubereats|glovo|bolt\s*food|pyszne/i, category: 'Jedzenie', bucket: 'wants', merchant: 'Gastronomia' },
  // Transport i Paliwo (Stacje / Komunikacja -> Needs, Taksówki -> Wants)
  { regex: /orlen|shell|bp|circle\s*k|moya|amic|circlek/i, category: 'Transport', bucket: 'needs', merchant: 'Stacja paliw' },
  { regex: /ztm|mpk|jakdojade|pkp|intercity|koleje|polregio|bilety/i, category: 'Transport', bucket: 'needs', merchant: 'Komunikacja' },
  { regex: /uber|bolt|freenow|taxi/i, category: 'Transport', bucket: 'wants', merchant: 'Przejazdy' },
  // Rozrywka / Gry / Media -> Wants
  { regex: /steam|playstation|xbox|nintendo|gog|epic\s*games|netflix|spotify|youtube|disney|hbo|apple\.com|cinema|multikino|helios/i, category: 'Rozrywka', bucket: 'wants', merchant: 'Rozrywka i Media' },
  // Zdrowie i Higiena -> Needs
  { regex: /aptek|doz|gemini|rossmann|hebe|stomatolog|lekarz|przychodni|medicover|luxmed/i, category: 'Zdrowie', bucket: 'needs', merchant: 'Zdrowie i Apteka' },
  // Rachunki i Usługi -> Needs
  { regex: /t-mobile|orange|play|plus|vectra|upc|inea|pge|tauron|enea|energa|czynsz|sp[óo][łl]dzielni/i, category: 'Rachunki', bucket: 'needs', merchant: 'Rachunki i Usługi' }
];

const deduplicationCache = new Map();

/**
 * Czyści przedawnione wpisy z pamięci deduplikacji (starsze niż maxAgeMs)
 */
export function pruneDeduplicationCache(maxAgeMs = 120000) {
  const now = Date.now();
  for (const [hash, timestamp] of deduplicationCache.entries()) {
    if (now - timestamp > maxAgeMs) {
      deduplicationCache.delete(hash);
    }
  }
}

/**
 * Sprawdza czy powiadomienie jest duplikatem w oknie czasowym ttlMs
 */
export function isDuplicateNotification(appName, title, body, cache = deduplicationCache, ttlMs = 60000) {
  const normalized = `${(appName || '').trim()}|${(title || '').trim()}|${(body || '').trim()}`.toLowerCase();
  const hash = crypto.createHash('sha256').update(normalized).digest('hex');
  const now = Date.now();
  
  if (cache.has(hash)) {
    const prevTime = cache.get(hash);
    if (now - prevTime <= ttlMs) {
      return true;
    }
  }
  
  cache.set(hash, now);
  if (cache === deduplicationCache && cache.size > 200) {
    pruneDeduplicationCache();
  }
  return false;
}

/**
 * Sprawdza czy powiadomienie dotyczy kontekstu finansowego / transakcyjnego
 */
export function isFinancialNotification(appName = '', title = '', body = '') {
  const fullText = `${appName} ${title} ${body}`.toLowerCase();
  
  // 1. Sprawdź czy aplikacja znajduje się na liście finansowych
  const lowerApp = (appName || '').toLowerCase();
  const isFinancialApp = FINANCIAL_APPS.some(app => lowerApp.includes(app));
  
  // 2. Sprawdź obecność kwoty i waluty
  const hasCurrencyPattern = /(?:\d+[.,]\d{1,2}|\d+)\s*(?:pln|z[łl]|eur|usd|\$|gbp)/i.test(fullText) ||
                             /(?:pln|z[łl]|eur|usd|\$|gbp)\s*(?:\d+[.,]\d{1,2}|\d+)/i.test(fullText);
  
  // 3. Sprawdź obecność słów kluczowych transakcji
  const hasTransactionKeyword = TRANSACTION_KEYWORDS.some(kw => fullText.includes(kw));

  if (isFinancialApp) {
    return hasCurrencyPattern || hasTransactionKeyword;
  }

  return hasCurrencyPattern && hasTransactionKeyword;
}

/**
 * Sprawdza czy powiadomienie jest operacją niefinansową (np. kod BLIK, SMS 2FA)
 */
export function isNonExpenseNotification(title = '', body = '') {
  const fullText = `${title} ${body}`;
  return NON_EXPENSE_PATTERNS.some(pattern => pattern.test(fullText));
}

/**
 * Szybka heurystyczna ekstrakcja kwoty, waluty, podmiotu i alokacji 50/30/20
 */
export function extractExpenseHeuristic(appName = '', title = '', body = '') {
  const fullText = `${title} ${body}`.trim();
  
  let amount = 0;
  let currency = 'PLN';

  const amountMatch = fullText.match(/(?:(?:zap[łl]acono|p[łl]atno[śs][ćc]|kwot[aę]|na\s+kwot[ęe]|suma|warto[śs][ćc]|spent|paid|amount)\s*:?\s*)?([0-9]+[.,][0-9]{2}|[0-9]+)\s*(pln|z[łl]|eur|usd|\$|gbp)/i) ||
                      fullText.match(/(pln|z[łl]|eur|usd|\$|gbp)\s*([0-9]+[.,][0-9]{2}|[0-9]+)/i) ||
                      fullText.match(/([0-9]+[.,][0-9]{2})\s*(pln|z[łl]|eur|usd|\$|gbp)?/i);

  if (amountMatch) {
    if (amountMatch[1] && isNaN(parseFloat(amountMatch[1].replace(',', '.')))) {
      // Format: "PLN 34.90"
      currency = (amountMatch[1] || 'PLN').toUpperCase().replace('ZŁ', 'PLN').replace('ZL', 'PLN').replace('$', 'USD');
      amount = parseFloat(amountMatch[2].replace(',', '.'));
    } else {
      // Format: "34.90 PLN"
      amount = parseFloat(amountMatch[1].replace(',', '.'));
      if (amountMatch[2]) {
        currency = amountMatch[2].toUpperCase().replace('ZŁ', 'PLN').replace('ZL', 'PLN').replace('$', 'USD');
      }
    }
  }

  // Identyfikacja merchanta, kategorii i kubełka
  let category = 'Inne';
  let bucket = 'needs';
  let merchant = '';

  for (const rule of MERCHANT_RULE_MAP) {
    const match = fullText.match(rule.regex);
    if (match) {
      category = rule.category;
      bucket = rule.bucket;
      merchant = match[0].charAt(0).toUpperCase() + match[0].slice(1);
      break;
    }
  }

  if (!merchant) {
    const placeMatch = fullText.match(/(?:w|at|dla|sklepie)\s+([A-Za-z0-9żźćńółęąśŻŹĆĄŚĘŁÓŃ.-]+)/i);
    if (placeMatch && placeMatch[1] && placeMatch[1].length > 2) {
      merchant = placeMatch[1];
    }
  }

  const description = merchant 
    ? `Zakup w: ${merchant} [Auto-Portfel]`
    : `Płatność mobilna (${appName || 'Telefon'}) [Auto-Portfel]`;

  return {
    is_expense: amount > 0,
    amount,
    currency,
    category,
    bucket,
    merchant,
    description,
    confidence: merchant ? 0.85 : 0.65,
    method: 'heuristic'
  };
}

/**
 * Kognitywna klasyfikacja wydatku przez model LLM (Groq) z fallbackiem heurystycznym
 */
export async function classifyExpenseWithAi(appName = '', title = '', body = '', options = {}) {
  // 1. Sprawdzenie wstępne
  if (!isFinancialNotification(appName, title, body)) {
    return { is_financial: false, is_expense: false, reason: 'Powiadomienie nie jest finansowe.' };
  }

  // 2. Odsianie kodów autoryzacyjnych i alertów
  if (isNonExpenseNotification(title, body)) {
    return { is_financial: true, is_expense: false, reason: 'Powiadomienie to kod BLIK/2FA lub alert bezpieczeństwa.' };
  }

  const apiKey = options.apiKey || process.env.GROQ_API_KEY;
  const hasValidKey = apiKey && apiKey !== 'your_groq_api_key' && apiKey !== 'unconfigured_key';

  // 3. Próba klasyfikacji LLM
  if (hasValidKey) {
    try {
      const groq = new Groq({ apiKey });
      const prompt = `Jesteś analitykiem finansowym systemu OmniDash.
Przeanalizuj powiadomienie push z telefonu i wyodrębnij parametry transakcji.

Aplikacja: "${appName}"
Tytuł: "${title}"
Treść: "${body}"

Zasady klasyfikacji budżetu 50/30/20:
- "needs" (Potrzeby): zakupy spożywcze (dyskonty, markety), leki, stacje paliw, bilety MPK/PKP, rachunki, czynsz, podstawowe usługi.
- "wants" (Zachcianki): restauracje, kawiarnie, jedzenie z dowozem, gry wideo (Steam, PS), streaming (Netflix, Spotify), kino, odzież, elektronika rekreacyjna, przejazdy taxi/Uber.
- "savings" (Oszczędności): przelewy na konto oszczędnościowe, lokaty, zakup akcji/krypto.

Zwróć WYŁĄCZNIE obiekt JSON w formacie:
{
  "is_expense": true,
  "amount": 34.90,
  "currency": "PLN",
  "category": "Jedzenie",
  "bucket": "needs",
  "merchant": "Biedronka",
  "description": "Zakup artykułów spożywczych (Biedronka)",
  "reasoning": "Zakup w markecie spożywczym kwalifikuje się jako potrzeby."
}`;

      const response = await groq.chat.completions.create({
        model: options.model || 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const raw = response.choices[0]?.message?.content;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.amount === 'number' && parsed.amount > 0) {
          return {
            is_financial: true,
            is_expense: Boolean(parsed.is_expense),
            amount: parsed.amount,
            currency: parsed.currency || 'PLN',
            category: parsed.category || 'Inne',
            bucket: ['needs', 'wants', 'savings'].includes(parsed.bucket) ? parsed.bucket : 'needs',
            merchant: parsed.merchant || '',
            description: parsed.description || `Płatność ${parsed.merchant || ''} [Auto-AI]`,
            reasoning: parsed.reasoning || '',
            confidence: 0.95,
            method: 'llm'
          };
        }
      }
    } catch (err) {
      console.warn('[!] PUSHBULLET CLASSIFIER: Fallback LLM -> Heurystyka z powodu błędu:', err.message);
    }
  }

  // 4. Fallback heurystyczny
  const heuristic = extractExpenseHeuristic(appName, title, body);
  return {
    is_financial: true,
    ...heuristic
  };
}

/**
 * Formatuje zwięzłe potwierdzenie do wysłania na telefon operatora
 */
export function formatExpenseConfirmation(expense) {
  const bucketMap = {
    needs: 'Potrzeby 🍎',
    wants: 'Zachcianki 🎮',
    savings: 'Oszczędności 🏦'
  };
  const bucketLabel = bucketMap[expense.bucket] || expense.bucket;
  const merchantLabel = expense.merchant ? ` (${expense.merchant})` : '';
  return `Zarejestrowano wydatek: ${expense.amount.toFixed(2)} ${expense.currency}${merchantLabel} ➔ ${bucketLabel} [${expense.category}]`;
}
