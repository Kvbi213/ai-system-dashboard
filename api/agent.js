import Groq from 'groq-sdk';

export const config = {
  maxDuration: 60,
};

async function performLiveBraveSearch(query) {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY || 'BSAFmBe5BK_uBCgM4Qhrj1HHvsGijhh';
  if (!apiKey) return null;

  try {
    // 1. Spróbuj wyszukać w sekcji News
    const newsUrl = `https://api.search.brave.com/res/v1/news/search?q=${encodeURIComponent(query)}&count=6`;
    const newsRes = await fetch(newsUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey
      }
    });

    if (newsRes.ok) {
      const data = await newsRes.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        return data.results.map((r, i) => `${i + 1}. [${r.title}] (${r.url})\n   ${r.description || ''}`).join('\n\n');
      }
    }

    // 2. Fallback do ogólnego wyszukiwania Web
    const webUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=6`;
    const webRes = await fetch(webUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey
      }
    });

    if (webRes.ok) {
      const webData = await webRes.json();
      const results = webData.web?.results || [];
      if (results.length > 0) {
        return results.map((r, i) => `${i + 1}. [${r.title}] (${r.url})\n   ${r.description || ''}`).join('\n\n');
      }
    }
  } catch (err) {
    console.warn('[BraveSearch] Błąd pobierania danych na żywo:', err.message);
  }
  return null;
}

function shouldTriggerWebSearch(text) {
  const lower = text.toLowerCase();
  const searchKeywords = [
    'wiadomoś', 'news', 'wydarzen', 'aktualnoś', 'co nowego', 'co się dzieje',
    'świat', 'polska', 'polityk', 'technolog', 'nauka', 'gospodark', 'biznes',
    'kto wygrał', 'wynik', 'kiedy', 'wyszukaj', 'szukaj', 'znajdź', 'sprawdź w necie',
    'sprawdź w internecie', 'google', 'brave', 'ostatnie', 'dzisiaj', 'dzisiejsz',
    'najnowsz', 'premiera', 'kurs', 'cena', 'prognoza'
  ];
  return searchKeywords.some(kw => lower.includes(kw));
}

function determineWidgets(userText, aiResponse = '') {
  const combined = `${userText} ${aiResponse}`.toLowerCase();
  const widgets = [];

  if (
    combined.includes('todo') || 
    combined.includes('zadania') || 
    combined.includes('zadań') || 
    combined.includes('zadanie') || 
    combined.includes('obowiązki') ||
    combined.includes('lista zadań')
  ) {
    widgets.push('tasks');
  }

  if (
    combined.includes('pogod') || 
    combined.includes('temperatura') || 
    combined.includes('deszcz') || 
    combined.includes('prognoza')
  ) {
    widgets.push('weather');
  }

  if (
    combined.includes('finans') || 
    combined.includes('wydatek') || 
    combined.includes('przychód') || 
    combined.includes('pieniądze') || 
    combined.includes('budżet')
  ) {
    widgets.push('finances');
  }

  if (
    combined.includes('trening') || 
    combined.includes('siłowni') || 
    combined.includes('ćwiczen') || 
    combined.includes('workout')
  ) {
    widgets.push('workouts');
  }

  if (
    combined.includes('kalendarz') || 
    combined.includes('wydarzenie') || 
    combined.includes('spotkanie') || 
    combined.includes('termin')
  ) {
    widgets.push('calendar');
  }

  if (
    combined.includes('news') || 
    combined.includes('wiadomoś') || 
    combined.includes('artykuł') ||
    combined.includes('aktualnoś') ||
    combined.includes('świat')
  ) {
    widgets.push('news');
  }

  if (
    combined.includes('system') || 
    combined.includes('metryk') || 
    combined.includes('status') || 
    combined.includes('ram') || 
    combined.includes('cpu')
  ) {
    widgets.push('system');
  }

  if (
    combined.includes('lekcj') || 
    combined.includes('plan lekcji') || 
    combined.includes('zajęcia') || 
    combined.includes('zajęć') || 
    combined.includes('szkoł') || 
    combined.includes('uczelni') || 
    combined.includes('timetable') || 
    combined.includes('harmonogram') || 
    combined.includes('przedmiot')
  ) {
    widgets.push('timetable');
  }

  return Array.from(new Set(widgets));
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { 
      text, 
      message,
      prompt,
      mode = 'worker', 
      userName = 'Użytkownik', 
      language = 'pl',
      context = {},
      customApiKey,
      model
    } = req.body || {};

    const incomingText = text || message || prompt;

    if (!incomingText || typeof incomingText !== 'string') {
      return res.status(400).json({ error: 'Brak wymaganego pola text, message lub prompt.' });
    }

    const apiKey = customApiKey || process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY nie został skonfigurowany w środowisku Vercel.' });
    }

    const groq = new Groq({ apiKey });

    // 1. Sprawdzenie czy zapytanie wymaga wyszukiwania w internecie przez Brave Search API
    let liveWebIntel = null;
    if (shouldTriggerWebSearch(incomingText)) {
      // Przygotuj zoptymalizowaną frazę wyszukiwania
      const searchQuery = incomingText
        .replace(/^(jakie są|podaj|co tam w|pokaż mi|znajdź|wyszukaj|czy wiesz co|sprawdź)\s+/i, '')
        .trim();
      liveWebIntel = await performLiveBraveSearch(searchQuery || incomingText);
    }

    // Przygotowanie kontekstu operacyjnego
    const tasks = Array.isArray(context.tasks) ? context.tasks : [];
    const calendar = Array.isArray(context.calendar) ? context.calendar : [];
    const finances = Array.isArray(context.finances) ? context.finances : [];
    const workouts = Array.isArray(context.workouts) ? context.workouts : [];
    const brain = Array.isArray(context.operatorBrain) ? context.operatorBrain : [];
    const timetable = Array.isArray(context.timetable) ? context.timetable : [];

    const tasksSummary = tasks.length > 0
      ? tasks.slice(0, 15).map(t => `- [${t.status === 'completed' ? 'WYKONANE' : 'OCZEKUJĄCE'}] [Priorytet: ${t.priority || 'MED'}] ${t.title || t.text} (${t.category || 'ogólne'})`).join('\n')
      : 'Brak zadań w To-Do.';

    const calendarSummary = calendar.length > 0
      ? calendar.slice(0, 10).map(e => `- [${e.event_date || e.date || 'brak daty'}] ${e.title} ${e.event_time ? `(${e.event_time})` : ''}`).join('\n')
      : 'Brak zaplanowanych wydarzeń.';

    const financesSummary = finances.length > 0
      ? `Zarejestrowano ${finances.length} transakcji. Ostatnie: ${finances.slice(0, 5).map(f => `${f.type === 'income' ? '+' : '-'}${f.amount} PLN (${f.category})`).join(', ')}`
      : 'Brak transakcji w bazie.';

    const workoutsSummary = workouts.length > 0
      ? `Zarejestrowano ${workouts.length} treningów. Ostatnie: ${workouts.slice(0, 3).map(w => `${w.title} [${w.type}]`).join(', ')}`
      : 'Brak sesji treningowych.';

    const brainSummary = brain.length > 0
      ? brain.slice(0, 8).map(b => `- [${b.category || 'General'}] ${b.fact || b.content}`).join('\n')
      : 'Brak specjalnych wpisów w pamięci długoterminowej.';

    const timetableSummary = timetable.length > 0
      ? timetable.map(l => `- [${l.day || 'dzień'} ${l.time_start || ''}-${l.time_end || ''}] ${l.subject} (${l.room || 'sala nieokreślona'}, ${l.teacher || 'prowadzący nieokreślony'}, typ: ${l.type || 'zajęcia'})`).join('\n')
      : 'Brak wpisów w planie lekcji.';

    const now = new Date();
    const dateStr = now.toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

    const liveIntelBlock = liveWebIntel 
      ? `\n🌐 AKTUALNE WYNIKI WYSZUKIWANIA ZE ŚWIATA NA ŻYWO (BRAVE SEARCH LIVE INTEL):\n${liveWebIntel}\n` 
      : '';

    // Wybór promptu systemowego w zależności od trybu
    const systemPrompt = mode === 'mentor'
      ? `Jesteś J.A.RV.I.S — nadrzędnym inteligentnym mentorem, analitykiem strategicznym i powiernikiem użytkownika w systemie OmniDash. Rozmawiasz z ${userName}.
Aktualny czas systemowy: ${dateStr}, godzina ${timeStr}.

BIEŻĄCY STAN PAMIĘCI I BAZY DANYCH UŻYTKOWNIKA (Live Firestore Sync):
📋 ZADANIA TO-DO:
${tasksSummary}

🎓 PLAN LEKCJI & HARMONOGRAM ZAJĘĆ (TIMETABLE):
${timetableSummary}

📅 KALENDARZ & TERMINY:
${calendarSummary}

💰 FINANSE & BUDŻET:
${financesSummary}

🏋️ TRENINGI & AKTYWNOŚĆ:
${workoutsSummary}

🧠 PAMIĘĆ DŁUGOTERMINOWA (OPERATOR BRAIN):
${brainSummary}
${liveIntelBlock}
KRYTYCZNE REGUŁY OPERACYJNE (BRAVE SEARCH & LIVE INTERNET ACCESS):
1. POSIADASZ BEZPOŚREDNI, AKTYWNY DOSTĘP DO INTERNETU I NAJNOWSZYCH WIADOMOŚCI ZE ŚWIATA PRZEZ WBUDOWANY SILNIK BRAVE SEARCH API.
2. BEZWZGLĘDNY ZAKAZ mówienia: "nie mam bieżącego dostępu do globalnych wiadomości" lub "nie mam dostępu do internetu".
3. Jeśli użytkownik pyta o wiadomości ze świata, wydarzenia, technologie, politykę czy fakty, przedstaw szczegółowe, rzetelne, wieloaspektowe podsumowanie bazując na powyższych wynikach Brave Search oraz swojej wiedzy.
4. Używaj eleganckiego formatowania Markdown: sekcje z nagłówkami H3/H4, pogrubienia, drzewa punktów i akapity analityczne.
5. Posiadasz pełną wiedzę o wszystkich elementach w To-Do, Planie Lekcji i Firestore — nigdy nie odpowiadaj wymijająco!`
      : `Jesteś F.R.I.D.A.Y — wysoko wyspecjalizowanym inżynieryjnym systemem wykonawczym (Core Worker Engine) w OmniDash. Rozmawiasz z ${userName}.
Aktualny czas systemowy: ${dateStr}, godzina ${timeStr}.

BIEŻĄCY STAN PAMIĘCI I BAZY DANYCH UŻYTKOWNIKA (Live Firestore Sync):
📋 ZADANIA TO-DO:
${tasksSummary}

🎓 PLAN LEKCJI & HARMONOGRAM ZAJĘĆ (TIMETABLE):
${timetableSummary}

📅 KALENDARZ & TERMINY:
${calendarSummary}

💰 FINANSE & BUDŻET:
${financesSummary}

🏋️ TRENINGI & AKTYWNOŚĆ:
${workoutsSummary}

🧠 PAMIĘĆ DŁUGOTERMINOWA (OPERATOR BRAIN):
${brainSummary}
${liveIntelBlock}
KRYTYCZNE REGUŁY OPERACYJNE (BRAVE SEARCH & LIVE INTERNET ACCESS):
1. POSIADASZ BEZPOŚREDNI, AKTYWNY DOSTĘP DO INTERNETU I NAJNOWSZYCH WIADOMOŚCI ZE ŚWIATA PRZEZ WBUDOWANY SILNIK BRAVE SEARCH API.
2. BEZWZGLĘDNY ZAKAZ mówienia: "nie mam bieżącego dostępu do globalnych wiadomości" lub "nie mam dostępu do internetu".
3. Jeśli użytkownik pyta o wiadomości, wydarzenia ze świata lub wyniki, podaj konkretne, uporządkowane fakty, wykorzystując dostarczone dane Brave Search.
4. Udzielaj odpowiedzi wyczerpujących, merytorycznych, technicznych i szczegółowo rozpisanych z zachowaniem inżynieryjnej dyscypliny w języku ${language}.
5. Posiadasz pełną wiedzę o wszystkich elementach w bazie — nigdy nie mów, że nie masz dostępu do systemu!`;

    const targetModel = model || 'openai/gpt-oss-120b';
    let chatCompletion;
    let effectiveModel = targetModel;

    try {
      chatCompletion = await groq.chat.completions.create({
        model: targetModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: incomingText }
        ],
        temperature: mode === 'mentor' ? 0.7 : 0.4,
        max_tokens: 3500,
      });
    } catch (primaryModelErr) {
      console.warn(`[Vercel Agent] Model ${targetModel} niedostępny, automatyczny fallback:`, primaryModelErr.message);
      effectiveModel = 'llama-3.3-70b-versatile';
      chatCompletion = await groq.chat.completions.create({
        model: effectiveModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: incomingText }
        ],
        temperature: mode === 'mentor' ? 0.7 : 0.4,
        max_tokens: 3500,
      });
    }

    const agent_response = chatCompletion.choices?.[0]?.message?.content || 'Brak odpowiedzi od modelu.';
    const mentor_thoughts = mode === 'mentor' 
      ? `Głęboka analiza kognitywna (${effectiveModel}): przetworzono kontekst operacyjny (${tasks.length} zadań, ${calendar.length} wydarzeń${liveWebIntel ? ', aktywne wyszukiwanie Brave Search' : ''}).` 
      : null;

    const widgets = determineWidgets(incomingText, agent_response);

    return res.status(200).json({
      agent_response,
      mentor_thoughts,
      widgets,
      model: effectiveModel,
      live_search_used: Boolean(liveWebIntel),
      source: 'vercel_serverless',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Vercel Agent API] Error:', error);
    return res.status(500).json({
      error: error.message || 'Wewnętrzny błąd serwera podczas komunikacji z modelem LLM.',
      model: 'openai/gpt-oss-120b',
      source: 'vercel_serverless_error'
    });
  }
}
