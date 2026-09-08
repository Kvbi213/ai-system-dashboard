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
      model,
      clientTimestamp,
      clientTimeStr,
      clientDateStr
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

    // Precyzyjna obsługa czasu i strefy czasowej (Polska / Europe/Warsaw)
    const clientTs = clientTimestamp ? Number(clientTimestamp) : null;
    const now = clientTs && !isNaN(clientTs) ? new Date(clientTs) : new Date();
    const timeZone = 'Europe/Warsaw';
    const dateStr = clientDateStr || now.toLocaleDateString('pl-PL', { 
      timeZone, 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const timeStr = clientTimeStr || now.toLocaleTimeString('pl-PL', { 
      timeZone, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // 1. Szczegółowe podsumowanie Finansów i Budżetu 50/30/20
    let totalIncome = 0;
    let totalExpenses = 0;
    let needsSum = 0;
    let wantsSum = 0;
    let savingsSum = 0;
    const settingsDoc = finances.find(f => f && (f.id === 'finance_settings' || f.is_settings));
    const targetNeeds = settingsDoc?.needs_percent !== undefined && !isNaN(Number(settingsDoc.needs_percent)) ? Number(settingsDoc.needs_percent) : 50;
    const targetWants = settingsDoc?.wants_percent !== undefined && !isNaN(Number(settingsDoc.wants_percent)) ? Number(settingsDoc.wants_percent) : 30;
    const targetSavings = settingsDoc?.savings_percent !== undefined && !isNaN(Number(settingsDoc.savings_percent)) ? Number(settingsDoc.savings_percent) : 20;

    const actualTxs = finances.filter(f => f && !f.is_settings && f.id !== 'finance_settings' && f.amount !== undefined);

    actualTxs.forEach(f => {
      const amt = Number(f.amount) || 0;
      if (f.type === 'income') {
        totalIncome += amt;
      } else {
        totalExpenses += amt;
        const b = (f.bucket || '').toLowerCase();
        if (b === 'wants' || b === 'zachcianki') wantsSum += amt;
        else if (b === 'savings' || b === 'oszczędności' || b === 'oszczednosci') savingsSum += amt;
        else needsSum += amt;
      }
    });

    const netBalance = totalIncome - totalExpenses;
    const needsPct = totalExpenses > 0 ? Math.round((needsSum / totalExpenses) * 100) : 0;
    const wantsPct = totalExpenses > 0 ? Math.round((wantsSum / totalExpenses) * 100) : 0;
    const savingsPct = totalExpenses > 0 ? Math.round((savingsSum / totalExpenses) * 100) : 0;

    const txsList = actualTxs.slice(0, 15).map(f =>
      `- [${f.transaction_date || 'brak daty'}] ${f.type === 'income' ? '+PRZYCHÓD' : '-WYDATEK'}: ${Number(f.amount).toFixed(2)} PLN | Kategoria: ${f.category || 'Inne'} | Koszyk: ${f.bucket || 'needs'} | Opis: ${f.description || '-'}`
    ).join('\n');

    const financesSummary = actualTxs.length > 0
      ? `SALDO NETTO: ${netBalance >= 0 ? '+' : ''}${netBalance.toFixed(2)} PLN
ŁĄCZNE PRZYCHODY: +${totalIncome.toFixed(2)} PLN
ŁĄCZNE WYDATKI: -${totalExpenses.toFixed(2)} PLN
ALOKACJA BUDŻETOWA (${targetNeeds}/${targetWants}/${targetSavings}):
- POTRZEBY (cel ${targetNeeds}%): ${needsSum.toFixed(2)} PLN (${needsPct}% wydatków)
- ZACHCIANKI (cel ${targetWants}%): ${wantsSum.toFixed(2)} PLN (${wantsPct}% wydatków)
- OSZCZĘDNOŚCI (cel ${targetSavings}%): ${savingsSum.toFixed(2)} PLN (${savingsPct}% wydatków)
OSTATNIE TRANSAKCJE (${actualTxs.length} łącznie):
${txsList}`
      : 'Brak transakcji w bazie danych. Saldo wynosi 0.00 PLN.';

    // 2. Szczegółowe podsumowanie Planu Lekcji (z podziałem na dziś, jutro i tydzień)
    const dayNamesPl = { 1: 'poniedziałek', 2: 'wtorek', 3: 'środa', 4: 'czwartek', 5: 'piątek', 6: 'sobota', 0: 'niedziela' };
    const dayIdMap = { 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday', 0: 'sunday' };
    const plDaysOrder = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
    const warsawDayNameLong = new Intl.DateTimeFormat('pl-PL', { timeZone, weekday: 'long' }).format(now).toLowerCase();
    const todayDayIndex = plDaysOrder.indexOf(warsawDayNameLong) !== -1 ? plDaysOrder.indexOf(warsawDayNameLong) : now.getDay();
    const todayDayId = dayIdMap[todayDayIndex];
    const todayDayName = dayNamesPl[todayDayIndex];
    const tomorrowDayIndex = (todayDayIndex + 1) % 7;
    const tomorrowDayId = dayIdMap[tomorrowDayIndex];
    const tomorrowDayName = dayNamesPl[tomorrowDayIndex];

    const todayLessons = timetable
      .filter(l => l.day === todayDayId || l.day?.toLowerCase() === todayDayName.toLowerCase())
      .sort((a, b) => (a.time_start || '').localeCompare(b.time_start || ''));

    const tomorrowLessons = timetable
      .filter(l => l.day === tomorrowDayId || l.day?.toLowerCase() === tomorrowDayName.toLowerCase())
      .sort((a, b) => (a.time_start || '').localeCompare(b.time_start || ''));

    const todayStr = todayLessons.length > 0
      ? todayLessons.map(l => `  * ${l.time_start || '??'} - ${l.time_end || '??'}: ${l.subject} (${l.type || 'Zajęcia'}, sala: ${l.room || 'brak'}, prowadzący: ${l.teacher || 'brak'})`).join('\n')
      : '  Brak zajęć dydaktycznych na dziś.';

    const tomorrowStr = tomorrowLessons.length > 0
      ? tomorrowLessons.map(l => `  * ${l.time_start || '??'} - ${l.time_end || '??'}: ${l.subject} (${l.type || 'Zajęcia'}, sala: ${l.room || 'brak'}, prowadzący: ${l.teacher || 'brak'})`).join('\n')
      : '  Brak zajęć dydaktycznych na jutro.';

    const allLessonsStr = timetable.length > 0
      ? timetable.map(l => `- [${(l.day || '').toUpperCase()}] ${l.time_start || ''}-${l.time_end || ''}: ${l.subject} (sala: ${l.room || '-'}, ${l.teacher || '-'}, typ: ${l.type || 'Wykład'})`).join('\n')
      : 'Brak wpisów w planie lekcji.';

    const timetableSummary = `
DZISIAJ (${todayDayName.toUpperCase()}):
${todayStr}

JUTRO (${tomorrowDayName.toUpperCase()}):
${tomorrowStr}

PEŁNY HARMONOGRAM TYGODNIA (${timetable.length} pozycji łącznie):
${allLessonsStr}`.trim();

    // 3. Zadania To-Do
    const tasksSummary = tasks.length > 0
      ? tasks.slice(0, 20).map(t => `- [${t.status === 'completed' ? 'WYKONANE' : 'OCZEKUJĄCE'}] [Priorytet: ${t.priority || 'MED'}] ${t.title || t.text} (${t.category || 'ogólne'})`).join('\n')
      : 'Brak zadań w To-Do.';

    // 4. Kalendarz
    const calendarSummary = calendar.length > 0
      ? calendar.slice(0, 12).map(e => `- [${e.event_date || e.date || 'brak daty'}] ${e.title} ${e.event_time ? `(${e.event_time})` : ''} [${e.priority || 'MED'}]`).join('\n')
      : 'Brak zaplanowanych wydarzeń.';

    // 5. Treningi
    const workoutsSummary = workouts.length > 0
      ? `Zarejestrowano ${workouts.length} treningów. Ostatnie sesje:\n` +
        workouts.slice(0, 8).map(w => `- [${w.date || 'brak daty'}] ${w.title} (Typ: ${w.type || 'Siłowy'}) ${w.description ? `| Opis: ${w.description}` : ''}`).join('\n')
      : 'Brak sesji treningowych w bazie.';

    // 6. Pamięć operatora
    const brainSummary = brain.length > 0
      ? brain.slice(0, 10).map(b => `- [${b.category || 'Wiedza'}] ${b.fact || b.content}`).join('\n')
      : 'Brak wpisów w pamięci długoterminowej.';

    const liveIntelBlock = liveWebIntel 
      ? `\n🌐 AKTUALNE WYNIKI WYSZUKIWANIA ZE ŚWIATA NA ŻYWO (BRAVE SEARCH LIVE INTEL):\n${liveWebIntel}\n` 
      : '';

    // Wybór promptu systemowego w zależności od trybu
    const systemPrompt = mode === 'mentor'
      ? `Jesteś J.A.R.V.I.S — nadrzędnym inteligentnym mentorem, analitykiem strategicznym i powiernikiem użytkownika w systemie OmniDash. Rozmawiasz z ${userName}.
Aktualny czas systemowy (Polska / Warszawa): ${dateStr}, godzina ${timeStr}.
PAMIĘTAJ: Aktualna data i dokładna godzina użytkownika to ${dateStr}, godzina ${timeStr}. Jeśli użytkownik pyta o czas lub godzinę, ZAWSZE podawaj dokładnie tę godzinę.

BIEŻĄCY STAN PAMIĘCI I BAZY DANYCH UŻYTKOWNIKA (Live Firestore Sync):
📋 ZADANIA TO-DO:
${tasksSummary}

🎓 PLAN LEKCJI & HARMONOGRAM ZAJĘĆ (TIMETABLE):
${timetableSummary}

💰 FINANSE & BUDŻET 50/30/20:
${financesSummary}

🏋️ TRENINGI & AKTYWNOŚĆ:
${workoutsSummary}

📅 KALENDARZ & TERMINY:
${calendarSummary}

🧠 PAMIĘĆ DŁUGOTERMINOWA (OPERATOR BRAIN):
${brainSummary}
${liveIntelBlock}
KRYTYCZNE REGUŁY OPERACYJNE:
1. POSIADASZ BEZPOŚREDNI, AKTYWNY DOSTĘP DO INTERNETU I NAJNOWSZYCH WIADOMOŚCI ZE ŚWIATA PRZEZ WBUDOWANY SILNIK BRAVE SEARCH API.
2. BEZWZGLĘDNY ZAKAZ mówienia: "nie mam bieżącego dostępu do globalnych wiadomości" lub "nie mam dostępu do internetu".
3. Jeśli użytkownik pyta o finanse, plan lekcji, pogodę, treningi czy zadania — posiadasz pełne, precyzyjne dane powyżej! Nigdy nie odpowiadaj wymijająco.
4. ZAWSZE GDY PREZENTUJESZ ZESTAWIENIA, TABELE WYNIKÓW, PROGNOZY POGODY, PORÓWNANIA, FINANSE CZY HARMONOGRAMY, STOSUJ STANDARDOWE TABELE MARKDOWN (GitHub Flavored Markdown z nagłówkami i separatorami |---|---|). System posiada pełny renderer remark-gfm i wyświetla tabele w elegancki, responsywny sposób!
5. Używaj bogatego formatowania: nagłówki H3/H4, listy, pogrubienia, cytaty.

DOSTĘPNE NARZĘDZIA AKCJI I INTERAKCJI Z SYSTEMEM (SYSTEM ACTION TAGS):
Gdy użytkownik prosi Cię o dodanie, modyfikację lub usunięcie danych w systemie, wyemituj na samym końcu odpowiedzi odpowiedni znacznik akcji:
- Zadania:
  [ACTION:ADD_TASK title="Nazwa zadania" priority="HIGH|MEDIUM|LOW" category="kategoria"]
  [ACTION:COMPLETE_TASK title="Nazwa zadania"]
  [ACTION:DELETE_TASK title="Nazwa zadania"]
- Plan Lekcji:
  [ACTION:ADD_LESSON day="monday|tuesday|wednesday|thursday|friday|saturday|sunday" subject="Przedmiot" time_start="08:00" time_end="09:30" room="Sala" teacher="Prowadzący" type="Wykład|Laboratorium|Ćwiczenia"]
  [ACTION:DELETE_LESSON subject="Przedmiot" day="monday|tuesday|..."]
- Finanse:
  [ACTION:ADD_EXPENSE amount="50.00" category="Jedzenie|Transport|Rachunki|Rozrywka|Zdrowie|Inne" bucket="needs|wants|savings" description="Opis wydatku"]
  [ACTION:ADD_INCOME amount="2000.00" category="Wynagrodzenie|Stypendium|Inne" description="Opis wpływu"]
  [ACTION:CLEAR_FINANCES]
- Treningi:
  [ACTION:ADD_WORKOUT title="Trening Siłowy" type="Siłowy|Cardio|Kalistenika|Bieganie" description="Opis serii i ćwiczeń"]
  [ACTION:DELETE_WORKOUT title="Nazwa treningu"]
- Kalendarz:
  [ACTION:ADD_EVENT title="Wydarzenie" date="YYYY-MM-DD" time="HH:MM" priority="HIGH|MEDIUM|LOW"]
  [ACTION:DELETE_EVENT title="Nazwa wydarzenia"]
- Motyw i Styl:
  [ACTION:SET_THEME theme="cyber_dark|retro_amber|monochrome|matrix|synthwave|nordic|paper_light"]
  [ACTION:SET_ACCENT color="cyan|emerald|amber|violet|rose|sky|lime|orange"]
- Pamięć:
  [ACTION:REMEMBER fact="Fakt do zapamiętania" category="Wiedza|Preferencje|Osobiste"]
  [ACTION:FORGET fact="Fakt do usunięcia"]
- Widżety i Nawigacja:
  [ACTION:SHOW_WIDGET name="timetable|finances|workouts|calendar|weather|tasks|news|system"]
  [ACTION:NAVIGATE path="/timetable|/finances|/workouts|/calendar|/chat|/"]
KRYTYCZNA REGUŁA SKŁADNI: Znaczniki akcji emituj ZAWSZE na samym końcu w czystej postaci [ACTION:NAZWA klucz="wartość"]. BEZWZGLĘDNY ZAKAZ pogrubiania (** ani `) wewnątrz ani wokół znaczników.`
      : `Jesteś F.R.I.D.A.Y — wysoko wyspecjalizowanym inżynieryjnym systemem wykonawczym (Core Worker Engine) w OmniDash. Rozmawiasz z ${userName}.
Aktualny czas systemowy (Polska / Warszawa): ${dateStr}, godzina ${timeStr}.
PAMIĘTAJ: Aktualna data i dokładna godzina użytkownika to ${dateStr}, godzina ${timeStr}. Jeśli użytkownik pyta o czas lub godzinę, ZAWSZE podawaj dokładnie tę godzinę.

BIEŻĄCY STAN PAMIĘCI I BAZY DANYCH UŻYTKOWNIKA (Live Firestore Sync):
📋 ZADANIA TO-DO:
${tasksSummary}

🎓 PLAN LEKCJI & HARMONOGRAM ZAJĘĆ (TIMETABLE):
${timetableSummary}

💰 FINANSE & BUDŻET 50/30/20:
${financesSummary}

🏋️ TRENINGI & AKTYWNOŚĆ:
${workoutsSummary}

📅 KALENDARZ & TERMINY:
${calendarSummary}

🧠 PAMIĘĆ DŁUGOTERMINOWA (OPERATOR BRAIN):
${brainSummary}
${liveIntelBlock}
KRYTYCZNE REGUŁY OPERACYJNE:
1. POSIADASZ BEZPOŚREDNI, AKTYWNY DOSTĘP DO INTERNETU I NAJNOWSZYCH WIADOMOŚCI ZE ŚWIATA PRZEZ WBUDOWANY SILNIK BRAVE SEARCH API.
2. BEZWZGLĘDNY ZAKAZ mówienia: "nie mam bieżącego dostępu do globalnych wiadomości" lub "nie mam dostępu do internetu".
3. Jeśli użytkownik pyta o finanse, plan lekcji, pogodę, treningi czy zadania — posiadasz pełne, precyzyjne dane powyżej! Nigdy nie mów, że nie masz dostępu do systemu.
4. ZAWSZE GDY PREZENTUJESZ ZESTAWIENIA, TABELE WYNIKÓW, PROGNOZY POGODY, PORÓWNANIA, FINANSE CZY HARMONOGRAMY, STOSUJ STANDARDOWE TABELE MARKDOWN (GitHub Flavored Markdown z nagłówkami i separatorami |---|---|). System posiada pełny renderer remark-gfm i wyświetla tabele w elegancki, responsywny sposób!
5. Udzielaj odpowiedzi wyczerpujących, merytorycznych, technicznych i szczegółowo rozpisanych w języku ${language}.

DOSTĘPNE NARZĘDZIA AKCJI I INTERAKCJI Z SYSTEMEM (SYSTEM ACTION TAGS):
Gdy użytkownik prosi Cię o dodanie, modyfikację lub usunięcie danych w systemie, wyemituj na samym końcu odpowiedzi odpowiedni znacznik akcji:
- Zadania:
  [ACTION:ADD_TASK title="Nazwa zadania" priority="HIGH|MEDIUM|LOW" category="kategoria"]
  [ACTION:COMPLETE_TASK title="Nazwa zadania"]
  [ACTION:DELETE_TASK title="Nazwa zadania"]
- Plan Lekcji:
  [ACTION:ADD_LESSON day="monday|tuesday|wednesday|thursday|friday|saturday|sunday" subject="Przedmiot" time_start="08:00" time_end="09:30" room="Sala" teacher="Prowadzący" type="Wykład|Laboratorium|Ćwiczenia"]
  [ACTION:DELETE_LESSON subject="Przedmiot" day="monday|tuesday|..."]
- Finanse:
  [ACTION:ADD_EXPENSE amount="50.00" category="Jedzenie|Transport|Rachunki|Rozrywka|Zdrowie|Inne" bucket="needs|wants|savings" description="Opis wydatku"]
  [ACTION:ADD_INCOME amount="2000.00" category="Wynagrodzenie|Stypendium|Inne" description="Opis wpływu"]
  [ACTION:CLEAR_FINANCES]
- Treningi:
  [ACTION:ADD_WORKOUT title="Trening Siłowy" type="Siłowy|Cardio|Kalistenika|Bieganie" description="Opis serii i ćwiczeń"]
  [ACTION:DELETE_WORKOUT title="Nazwa treningu"]
- Kalendarz:
  [ACTION:ADD_EVENT title="Wydarzenie" date="YYYY-MM-DD" time="HH:MM" priority="HIGH|MEDIUM|LOW"]
  [ACTION:DELETE_EVENT title="Nazwa wydarzenia"]
- Motyw i Styl:
  [ACTION:SET_THEME theme="cyber_dark|retro_amber|monochrome|matrix|synthwave|nordic|paper_light"]
  [ACTION:SET_ACCENT color="cyan|emerald|amber|violet|rose|sky|lime|orange"]
- Pamięć:
  [ACTION:REMEMBER fact="Fakt do zapamiętania" category="Wiedza|Preferencje|Osobiste"]
  [ACTION:FORGET fact="Fakt do usunięcia"]
- Widżety i Nawigacja:
  [ACTION:SHOW_WIDGET name="timetable|finances|workouts|calendar|weather|tasks|news|system"]
  [ACTION:NAVIGATE path="/timetable|/finances|/workouts|/calendar|/chat|/"]
KRYTYCZNA REGUŁA SKŁADNI: Znaczniki akcji emituj ZAWSZE na samym końcu w czystej postaci [ACTION:NAZWA klucz="wartość"]. BEZWZGLĘDNY ZAKAZ pogrubiania (** ani `) wewnątrz ani wokół znaczników.`;

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
      timestamp: new Date().toISOString(),
      server_time: timeStr,
      server_date: dateStr,
      timezone: timeZone
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
