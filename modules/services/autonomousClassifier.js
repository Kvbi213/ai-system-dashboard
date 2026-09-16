/**
 * Autonomiczny Klasyfikator Intencji Badawczych i Mobilnych (Autonomous Classifier)
 * Czysty moduł JavaScript bez zależności od środowiska Node/SQLite.
 * Kompatybilny z Vite Browser, Vercel Serverless oraz Node Daemon.
 */

/**
 * Sprawdza czy tekst jest pytaniem o status / stan pracy ze smartfona lub czatu
 */
export function isStatusInquiry(text) {
  if (!text || typeof text !== 'string') return false;
  const t = text.trim().toLowerCase();

  // Jeśli użytkownik zleca przygotowanie, wygenerowanie lub stworzenie raportu/badania - to jest zlecenie, a nie zapytanie o status
  if (
    t.startsWith('przygotuj ') || 
    t.startsWith('wygeneruj ') || 
    t.startsWith('stwórz ') || 
    t.startsWith('stworz ') || 
    t.startsWith('zrób ') || 
    t.startsWith('zrob ') || 
    t.includes('przygotuj raport') ||
    t.includes('stwórz raport')
  ) {
    return false;
  }

  const keywords = [
    'stan', 'status', 'jak idzie', 'jak tam', 'co robisz', 'co tam',
    'ile jeszcze', 'postęp', 'postep', 'jak leci', 'na jakim etapie',
    'gdzie jesteś', 'co robisz teraz', 'stan pracy', 'podaj raport',
    'jaki raport', 'raport o stanie', 'daj raport'
  ];

  if (t === 'raport' || t === 'raport?' || t === 'status?' || t === 'stan?') {
    return true;
  }

  return keywords.some(kw => t === kw || t.startsWith(kw + ' ') || t.endsWith(' ' + kw) || t.includes(kw));
}

/**
 * Sprawdza czy tekst jest poleceniem zatrzymania / anulowania
 */
export function isAbortCommand(text) {
  if (!text || typeof text !== 'string') return false;
  const t = text.trim().toLowerCase();
  const stopKeywords = ['stop', 'zatrzymaj', 'anuluj', 'przerwij', 'pauza', 'stój', 'stoj', 'kill'];
  return stopKeywords.some(kw => t === kw || t.startsWith(kw + ' '));
}

/**
 * Wykrywa intencję dogłębnego badania sieci / zbierania danych o modelach / kompleksowego wyszukiwania
 */
export function isDeepResearchIntent(text) {
  if (!text || typeof text !== 'string') return false;
  if (isStatusInquiry(text) || isAbortCommand(text)) return false;
  const t = text.trim().toLowerCase();

  const triggerPhrases = [
    'zbadaj', 'przebadaj', 'przeszukaj', 'zbierz', 'szukaj', 'znajdź', 'poszukaj',
    'analizuj', 'przeanalizuj', 'szczegółowe dane', 'szczegolowe dane',
    'wszystko o', 'na ich temat wszystkiego', 'który ma najlepszą', 'który z modeli',
    'porównaj modele', 'modele ai', 'modele sztucznej inteligencji',
    'brave search', 'plany i roadmapy', 'roadmap', 'przyszłość modeli',
    'zbierz informacje', 'przeszukaj sieć', 'przeszukaj internet', 'research'
  ];

  return triggerPhrases.some(phrase => t.includes(phrase));
}

/**
 * Wykrywa czy wiadomość ze smartfona jest zleceniem nowego zadania badawczego
 */
export function extractTaskFromPhone(text) {
  if (!text || typeof text !== 'string') return null;

  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  const prefixes = [
    /^omni:\s*/i,
    /^agent:\s*/i,
    /^zadanie:\s*/i,
    /^zbadaj:\s*/i,
    /^zbadaj\s+/i,
    /^przebadaj\s+/i,
    /^sprawdź\s+/i,
    /^research:\s*/i,
    /^szukaj:\s*/i,
    /^zbierz:\s*/i,
    /^przeszukaj:\s*/i
  ];

  for (const prefix of prefixes) {
    if (prefix.test(trimmed)) {
      return trimmed.replace(prefix, '').trim();
    }
  }

  // Jeśli brak prefiksu, sprawdź czy to nie zapytanie o stan lub zatrzymanie
  if (isStatusInquiry(text) || isAbortCommand(text)) return null;

  // Jeśli tekst zawiera bezpośrednie czasowniki zlecające
  if (
    lower.startsWith('znajdź ') || 
    lower.startsWith('analizuj ') || 
    lower.startsWith('poszukaj ') || 
    lower.startsWith('przeszukaj ') || 
    lower.startsWith('zbierz ') || 
    lower.startsWith('szukaj ')
  ) {
    return trimmed;
  }

  if (isDeepResearchIntent(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Generuje deterministyczny, awaryjny plan badawczy bez użycia sieci
 */
export function generateFallbackPlan(goal) {
  const clean = (goal || 'Badanie').trim();
  const lower = clean.toLowerCase();
  const isNoOpenSource = /nie.*(open[- ]?source|opensorce|otwart[a-z]*\s+kod)/i.test(lower) || /dostępne\s+w\s+(chacie|chat)/i.test(lower);

  if (isNoOpenSource && (lower.includes('model') || lower.includes('ai') || lower.includes('llm'))) {
    return {
      title: 'Badanie Komercyjnych Modeli AI w Czacie 2026',
      steps: [
        { step: 1, query: 'top commercial chat AI models 2026 OpenAI ChatGPT Plus Pro Anthropic Claude Pro Google Gemini Advanced', focus: 'Porównanie komercyjnych modeli w czacie i benchmarki' },
        { step: 2, query: 'OpenAI ChatGPT o1 o3-mini Claude 3.7 Sonnet Gemini 2.0 Pro chat roadmap 2026', focus: 'Roadmapy, plany rozwoju i przyszłość ekosystemów czatowych' },
        { step: 3, query: 'commercial AI chat subscriptions pricing limits context window ChatGPT Pro Claude Pro Gemini Advanced 2026', focus: 'Limity wiadomości, subskrypcje, okna kontekstu i możliwości interfejsów' }
      ]
    };
  }

  if (lower.includes('model') || lower.includes('ai') || lower.includes('llm')) {
    return {
      title: 'Badanie Modeli AI i Roadmap',
      steps: [
        { step: 1, query: 'top AI frontier models 2026 benchmarks OpenAI Claude Gemini DeepSeek', focus: 'Porównanie modeli czołowych i benchmarki' },
        { step: 2, query: 'OpenAI GPT-5 Google Gemini 2.5 Claude 3.7 DeepSeek roadmap 2026', focus: 'Roadmapy, plany rozwoju i przyszłość' },
        { step: 3, query: 'AI LLM models architecture context window technical specs', focus: 'Parametry techniczne, okna kontekstu i architektura' }
      ]
    };
  }
  return {
    title: clean.substring(0, 40),
    steps: [
      { step: 1, query: `${clean} roadmap 2026`, focus: 'Główne trendy i kierunki rozwoju' },
      { step: 2, query: `${clean} news analysis`, focus: 'Najnowsze analizy branżowe' },
      { step: 3, query: `${clean} technical specs comparison`, focus: 'Szczegółowe zestawienie danych i specyfikacji' }
    ]
  };
}
