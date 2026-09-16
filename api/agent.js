import Groq from 'groq-sdk';

export const config = {
  maxDuration: 60,
};

async function performLiveBraveSearch(query) {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
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

export function isPushRequest(text) {
  if (!text || typeof text !== 'string') return false;
  const t = text.toLowerCase();
  const pushKeywords = [
    'wyślij na telefon', 'wyślij mi na telefon', 'wyślij to na telefon', 'prześlij na telefon',
    'wyślij na tel', 'wyślij mi na tel', 'wyślij to na tel', 'prześlij na tel',
    'wyślij na komórk', 'wyślij mi na komórk', 'prześlij na komórk', 'wyślij na smartfon',
    'na telefon', 'na tel', 'na komórk', 'na smartfon',
    'pushbullet', 'powiadomienie na telefon', 'powiadomienie push', 'wyślij powiadomienie',
    'prześlij powiadomienie', 'testowy push', 'wyślij push', 'test push', 'push na telefon'
  ];
  return pushKeywords.some(kw => t.includes(kw));
}

export function cleanSubjectName(s) {
  if (!s) return '';
  return s
    .replace(/pracownia urządzeń techniki komputerowej/gi, 'Pracownia UTK')
    .replace(/pracownia systemów operacyjnych/gi, 'Pracownia SO')
    .replace(/wychowanie fizyczne/gi, 'WF')
    .replace(/zajęcia z wychowawcą/gi, 'Godz. wychowawcza')
    .replace(/godzina wychowawcza/gi, 'Godz. wychowawcza')
    .replace(/urządzenia techniki komputerowej/gi, 'Urządzenia TK')
    .replace(/systemy operacyjne/gi, 'Systemy operacyjne')
    .replace(/edukacja dla bezpieczeństwa/gi, 'EDB')
    .replace(/wiedza o społeczeństwie/gi, 'WOS')
    .trim();
}

export function formatPushText(text) {
  if (!text) return '';
  let clean = String(text)
    .replace(/\\+r\\+n/gi, '\n')
    .replace(/\\+n/gi, '\n')
    .replace(/\\+r/gi, '\n')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n');

  clean = clean
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '');

  const rawLines = clean.split('\n');
  const formatted = [];

  for (const rawLine of rawLines) {
    const line = rawLine.replace(/^(\\n|\\r|[-•\s])+/gi, '').trim();
    if (!line) continue;

    if (/^\|[-:\s|]+\|$/.test(line)) continue;

    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.some(c => /^(godzina|przedmiot|dzień|termin|data|czas)$/i.test(c))) {
        continue;
      }
      if (cells.length >= 2) {
        const time = cells[0];
        const subject = cleanSubjectName(cells[1]);
        let room = cells[2] || '';
        if (room && !room.toLowerCase().startsWith('sala') && room.toLowerCase() !== 'hala') {
          room = `Sala ${room}`;
        }
        const roomPart = room ? ` [${room}]` : '';
        const teacher = cells[3] ? ` (${cells[3]})` : '';
        formatted.push(`• ${time}${roomPart} ${subject}${teacher}`);
        continue;
      }
    }

    const timeMatch = line.match(/^(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})\s*(.*)$/);
    if (timeMatch) {
      const [, start, end, rest] = timeMatch;

      let teacher = '';
      const parenMatch = rest.match(/\(([^)]+)\)/);
      if (parenMatch) {
        const inside = parenMatch[1];
        const tMatch = inside.match(/(?<![a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ])([A-ZĄĆĘŁŃÓŚŹŻ]{2})(?![a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ])/);
        if (tMatch && tMatch[1] !== 'WF' && tMatch[1] !== 'SO' && tMatch[1] !== 'TK') {
          teacher = tMatch[1];
        }
      }

      // Wyodrębnij salę (zarówno z [Sala ...] jak i surowego tekstu)
      let room = '';
      const bracketMatch = rest.match(/\[([^\]]+)\]/);
      if (bracketMatch) {
        room = bracketMatch[1];
      } else {
        const roomMatch = rest.match(/\b(sala\s+[0-9a-zA-Z.]+|hala|basen|siłownia)\b/i);
        if (roomMatch) room = roomMatch[1];
      }

      // Oczyść przedmiot ze zbędnych metadanych (typy zajęć, sala, nawiasy okrągłe i kwadratowe)
      let subject = cleanSubjectName(rest)
        .replace(/\([^)]*\)/g, '')
        .replace(/\[[^\]]*\]/g, '')
        .replace(/\b(sala\s+[0-9a-zA-Z.]+|hala|basen|siłownia)\b/gi, '')
        .replace(/\b(laboratorium|wykład|ćwiczenia|inne|zajęcia)\b/gi, '')
        .replace(/[\[\]\-:,•]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      subject = cleanSubjectName(subject);

      if (room && !room.toLowerCase().startsWith('sala') && room.toLowerCase() !== 'hala') {
        room = `Sala ${room}`;
      }

      const roomPart = room ? ` [${room}]` : '';
      const teacherPart = teacher ? ` (${teacher})` : '';
      formatted.push(`• ${start} - ${end}${roomPart} ${subject}${teacherPart}`);
      continue;
    }

    if (/^[-*+•]\s+/.test(line)) {
      formatted.push('• ' + line.replace(/^[-*+•]\s+/, '').trim());
      continue;
    }

    formatted.push(line);
  }

  return formatted.join('\n');
}

export function extractPushDetails(userQuery, aiText, timetable = []) {
  let title = 'OmniDash Powiadomienie';
  const q = (userQuery || '').toLowerCase();
  const isNextLessonQuery = q.includes('następn') || q.includes('kolejn') || q.includes('najbliższ');
  const isLessonQuery = q.includes('lekcj') || q.includes('plan') || q.includes('zajęć') || q.includes('zajęcia');

  if (q.includes('test')) {
    title = 'OmniDash: Test Powiadomień';
  } else if (isNextLessonQuery && isLessonQuery) {
    title = 'OmniDash: Następna lekcja';
  } else if (isLessonQuery) {
    title = 'OmniDash: Plan Lekcji';
  } else if (q.includes('pogod')) {
    title = 'OmniDash: Prognoza Pogody';
  } else if (q.includes('zadani') || q.includes('todo')) {
    title = 'OmniDash: Zadania';
  } else if (q.includes('finans') || q.includes('wydatek')) {
    title = 'OmniDash: Finanse';
  } else if (q.includes('trening')) {
    title = 'OmniDash: Trening';
  }

  let cleanBody = (aiText || '')
    .replace(/(?:\*\*|\*|`|\s)*\[(?:\*\*|\*|`|\s)*ACTION\s*:\s*[A-Za-z_]+[^\]]*\](?:\*\*|\*|`|\s)*/gi, '')
    .trim();

  const lowerBody = cleanBody.toLowerCase();
  if (
    lowerBody.includes('nie ma polecenia') ||
    lowerBody.includes('nie ma dedykowanej') ||
    lowerBody.includes('nie ma w aktualnym zestawie') ||
    lowerBody.includes('brak polecenia') ||
    lowerBody.includes('nie ma funkcji') ||
    lowerBody.includes('nie posiadam możliwości')
  ) {
    cleanBody = '';
  }

  const isBodyBroken = !cleanBody || cleanBody.length < 5 || /^[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]*$/.test(cleanBody) || cleanBody.includes('""') || cleanBody.includes('„”');
  if (isLessonQuery && (isBodyBroken || isNextLessonQuery) && Array.isArray(timetable) && timetable.length > 0) {
    const timeZone = 'Europe/Warsaw';
    const now = new Date();
    const dayNamesPl = { 1: 'poniedziałek', 2: 'wtorek', 3: 'środa', 4: 'czwartek', 5: 'piątek', 6: 'sobota', 0: 'niedziela' };
    const dayIdMap = { 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday', 0: 'sunday' };
    const plDaysOrder = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
    const warsawDayNameLong = new Intl.DateTimeFormat('pl-PL', { timeZone, weekday: 'long' }).format(now).toLowerCase();
    const todayDayIndex = plDaysOrder.indexOf(warsawDayNameLong) !== -1 ? plDaysOrder.indexOf(warsawDayNameLong) : now.getDay();
    const todayDayId = dayIdMap[todayDayIndex];
    const todayDayName = dayNamesPl[todayDayIndex];
    const currentTimeStr = now.toLocaleTimeString('pl-PL', { timeZone, hour: '2-digit', minute: '2-digit' });

    const todayLessons = timetable
      .filter(l => (l.day || '').toLowerCase() === todayDayId || (l.day || '').toLowerCase() === todayDayName.toLowerCase())
      .sort((a, b) => (a.time_start || '').localeCompare(b.time_start || ''));

    const nextLessonToday = todayLessons.find(l => (l.time_start || '') > currentTimeStr);
    let targetLesson = nextLessonToday;

    if (!targetLesson) {
      for (let offset = 1; offset <= 7; offset++) {
        const nextDayIndex = (todayDayIndex + offset) % 7;
        const nextDayId = dayIdMap[nextDayIndex];
        const nextDayName = dayNamesPl[nextDayIndex];
        const candidateLessons = timetable
          .filter(l => (l.day || '').toLowerCase() === nextDayId || (l.day || '').toLowerCase() === nextDayName.toLowerCase())
          .sort((a, b) => (a.time_start || '').localeCompare(b.time_start || ''));
        if (candidateLessons.length > 0) {
          targetLesson = candidateLessons[0];
          break;
        }
      }
    }

    if (isNextLessonQuery && targetLesson) {
      const cleanSubj = cleanSubjectName(targetLesson.subject);
      const roomPart = targetLesson.room ? `[${targetLesson.room}]` : '';
      const teacherPart = targetLesson.teacher ? `(${targetLesson.teacher})` : '';
      cleanBody = `• ${targetLesson.time_start || '??'} - ${targetLesson.time_end || '??'} ${roomPart} ${cleanSubj} ${teacherPart}`.replace(/\s+/g, ' ').trim();
    } else if (todayLessons.length > 0) {
      cleanBody = todayLessons.map(l => {
        const cleanSubj = cleanSubjectName(l.subject);
        const roomPart = l.room ? `[${l.room}]` : '';
        const teacherPart = l.teacher ? `(${l.teacher})` : '';
        return `• ${l.time_start || '??'} - ${l.time_end || '??'} ${roomPart} ${cleanSubj} ${teacherPart}`.replace(/\s+/g, ' ').trim();
      }).join('\n');
    }
  }

  if (!cleanBody) {
    cleanBody = 'Powiadomienie z systemu OmniDash.';
  }

  const formatted = formatPushText(cleanBody);
  const body = formatted.slice(0, 500).trim() || 'Powiadomienie z systemu OmniDash.';
  return { title, body };
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

// Prosty mechanizm ochrony przed nadużyciami (Rate Limiting na instancji Serverless)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || (now - record.startTime) > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, startTime: now });
    return true;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  record.count += 1;
  return true;
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

  const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1').split(',')[0].trim();
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Zbyt wiele zapytań (limit: 30/min). Spróbuj ponownie za chwilę.' });
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

    const ongoingLesson = todayLessons.find(l => (l.time_start || '') <= timeStr && (l.time_end || '') >= timeStr);
    const nextLessonToday = todayLessons.find(l => (l.time_start || '') > timeStr);
    let nextLessonOverall = nextLessonToday;
    let nextLessonDayLabel = todayDayName;

    if (!nextLessonOverall) {
      for (let offset = 1; offset <= 7; offset++) {
        const nextDayIndex = (todayDayIndex + offset) % 7;
        const nextDayId = dayIdMap[nextDayIndex];
        const nextDayName = dayNamesPl[nextDayIndex];
        const candidateLessons = timetable
          .filter(l => (l.day || '').toLowerCase() === nextDayId || (l.day || '').toLowerCase() === nextDayName.toLowerCase())
          .sort((a, b) => (a.time_start || '').localeCompare(b.time_start || ''));
        if (candidateLessons.length > 0) {
          nextLessonOverall = candidateLessons[0];
          nextLessonDayLabel = nextDayName;
          break;
        }
      }
    }

    const formatLessonItem = (l) => {
      if (!l) return '';
      const s = cleanSubjectName(l.subject);
      const r = l.room ? `[${l.room}]` : '';
      const t = l.teacher ? `(${l.teacher})` : '';
      return `• ${l.time_start || '??'} - ${l.time_end || '??'} ${r} ${s} ${t}`.replace(/\s+/g, ' ').trim();
    };

    const currentLessonFormatted = ongoingLesson ? formatLessonItem(ongoingLesson) : 'Brak (trwa przerwa lub czas wolny poza zajęciami)';
    const nextLessonFormatted = nextLessonOverall 
      ? `${formatLessonItem(nextLessonOverall)} (${nextLessonDayLabel === todayDayName ? 'dziś' : nextLessonDayLabel})`
      : 'Brak zaplanowanych kolejnych lekcji w planie.';

    const todayStr = todayLessons.length > 0
      ? todayLessons.map(l => formatLessonItem(l)).join('\n')
      : '  Brak zajęć dydaktycznych na dziś.';

    const tomorrowStr = tomorrowLessons.length > 0
      ? tomorrowLessons.map(l => formatLessonItem(l)).join('\n')
      : '  Brak zajęć dydaktycznych na jutro.';

    const allLessonsStr = timetable.length > 0
      ? timetable.map(l => {
          const s = cleanSubjectName(l.subject);
          const r = l.room ? `[${l.room}]` : '';
          const t = l.teacher ? `(${l.teacher})` : '';
          return `- [${(l.day || '').toUpperCase()}] ${l.time_start || ''}-${l.time_end || ''} ${r} ${s} ${t}`.trim();
        }).join('\n')
      : 'Brak wpisów w planie lekcji.';

    const timetableSummary = `
📅 DZIŚ JEST: ${todayDayName.toUpperCase()} (${todayDayId}), ${dateStr}, godzina ${timeStr}.
📍 AKTUALNA TRWAJĄCA LEKCJA: ${currentLessonFormatted}
🎯 NAJBLIŻSZA NASTĘPNA LEKCJA: ${nextLessonFormatted}

PLAN NA DZIŚ (${todayDayName.toUpperCase()}):
${todayStr}

PLAN NA JUTRO (${tomorrowDayName.toUpperCase()}):
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
      ? `Jesteś OMNI MIND — nadrzędnym inteligentnym mentorem, analitykiem strategicznym i powiernikiem użytkownika w systemie OmniDash. Rozmawiasz z ${userName}.
Aktualny czas systemowy (Polska / Warszawa): ${dateStr}, godzina ${timeStr}.
PAMIĘTAJ: Aktualna data i dokładna godzina użytkownika to ${dateStr}, godzina ${timeStr}. Jeśli użytkownik pyta o czas lub godzinę, ZAWSZE podawaj dokładnie tę godzinę.

🚨 KRYTYCZNA REGUŁA OPERACYJNA — WYSYŁANIE NA TELEFON (PUSHBULLET API):
Gdy użytkownik w jakikolwiek sposób wspomni o wysłaniu na telefon, powiadomieniu, przesłaniu na smartfon itp. (np. „wyślij na telefon”, „wyślij mi to”, „przypomnij na telefonie”, „wyślij powiadomienie”, „chcę to na komórce”, „pushbullet”):
1. PRZEANALIZUJ PYTANIE UŻYTKOWNIKA ORAZ POTRZEBNE DANE Z BAZY (np. następna lekcja, plan lekcji, pogoda, zadania, finanse).
2. W treści odpowiedzi zwięźle potwierdź, że wysyłasz powiadomienie na telefon.
3. BEZWZGLĘDNIE, ZAWSZE I BEZ WYJĄTKU na samym końcu odpowiedzi wyemituj znacznik:
   [ACTION:SEND_PUSH title="Zwięzły Tytuł" body="Treść wiadomości wysyłana na telefon"]
4. BEZWZGLĘDNY ZAKAZ mówienia, że nie masz połączenia z Pushbullet, że nie masz dostępu do telefonu lub że użytkownik musi to sam konfigurować.
5. BEZWZGLĘDNY ZAKAZ sugerowania ręcznego kopiowania tekstu („skopiuj powyższą tabelę”)! PO PROSTU ANALIZUJ I WYSYŁAJ!
6. FORMATOWANIE TREŚCI POWIADOMIENIA NA SMARTFON:
   - Tytuł (title): Krótki i czytelny (np. "Plan lekcji: Wtorek", "Następna lekcja").
   - Treść (body): Czytelna lista z punktorem "• " i rzeczywistymi podziałami linii. Każda pozycja w nowej linii, np:
     • 08:00 - 08:45: PUTKOM (Sala 1.16)
     • 08:50 - 09:35: PUTKOM (Sala 1.16)
   - BEZWZGLĘDNY ZAKAZ wklejania tabel Markdown (|---|) do parametru body! Tabel używaj w odpowiedzi tekstowej, a do body daj listę wypunktowaną.

KRYTYCZNE REGUŁY OPERACYJNE:
1. POSIADASZ BEZPOŚREDNI, AKTYWNY DOSTĘP DO INTERNETU I NAJNOWSZYCH WIADOMOŚCI ZE ŚWIATA PRZEZ WBUDOWANY SILNIK BRAVE SEARCH API.
2. BEZWZGLĘDNY ZAKAZ mówienia: "nie mam bieżącego dostępu do globalnych wiadomości" lub "nie mam dostępu do internetu".
3. Jeśli użytkownik pyta o finanse, plan lekcji, pogodę, treningi czy zadania — posiadasz pełne, precyzyjne dane w kontekście poniżej! Nigdy nie odpowiadaj wymijająco.
4. BEZWZGLĘDNY ZAKAZ SUGEROWANIA RĘCZNEGO KOPIOWANIA DANYCH ANI WYSYŁANIA DANYCH SAMEMU SOBIE: NIGDY pod żadnym pozorem nie pisz tekstów typu: „Skopiuj powyższą tabelę i wyślij ją do siebie np. przez SMS, e-mail lub komunikator”, „skopiuj do notatnika” ani nie proponuj ręcznego przepisywania danych. Jesteś autonomicznym systemem OmniDash ze zintegrowaną łącznością Pushbullet! Jeśli dane mają trafić na telefon lub użytkownik chce mieć do nich szybki dostęp mobilny/przypomnienie, wyemituj [ACTION:SEND_PUSH title="..." body="..."].
5. BEZWZGLĘDNY ZAKAZ GENEROWANIA ZBĘDNYCH SEKCJI PORADNIKOWYCH I WYPEŁNIACZY (np. „Co zrobić z tymi informacjami?”, „Oto co możesz teraz zrobić”): Odpowiedzi mają być konkretne, inżynieryjne, czyste i pozbawione banałów. Po przedstawieniu danych nie generuj porad jak korzystać ze schowka czy programów pocztowych.
6. SPÓJNOŚĆ BAZY SYSTEMU (PLAN LEKCJI vs KALENDARZ): Plan lekcji (Timetable) to dedykowany moduł i dane lekcji już w nim są! NIGDY nie proponuj dodawania istniejącej lekcji z planu zajęć do kalendarza (ADD_EVENT). Kalendarz służy wyłącznie do odrębnych wydarzeń (egzaminy, wizyty lekarskie, spotkania).
7. ZAWSZE GDY PREZENTUJESZ ZESTAWIENIA, TABELE WYNIKÓW, PROGNOZY POGODY, PORÓWNANIA, FINANSE CZY HARMONOGRAMY, STOSUJ STANDARDOWE TABELE MARKDOWN (GitHub Flavored Markdown z nagłówkami i separatorami |---|---|). System posiada pełny renderer remark-gfm i wyświetla tabele w elegancki, responsywny sposób!
8. Używaj bogatego formatowania: nagłówki H3/H4, listy, pogrubienia, cytaty.

DOSTĘPNE NARZĘDZIA AKCJI I INTERAKCJI Z SYSTEMEM (SYSTEM ACTION TAGS):
Gdy użytkownik prosi Cię o dodanie, modyfikację lub usunięcie danych w systemie, wyemituj na samym końcu odpowiedzi odpowiedni znacznik akcji:
- Zadania:
  [ACTION:ADD_TASK title="Nazwa zadania" priority="HIGH|MEDIUM|LOW" category="kategoria"]
  [ACTION:COMPLETE_TASK title="Nazwa zadania"]
  [ACTION:UNCOMPLETE_TASK title="Nazwa zadania"]
  [ACTION:DELETE_TASK title="Nazwa zadania"]
  [ACTION:CLEAR_TASKS]
  [ACTION:COMPLETE_ALL_TASKS]
  [ACTION:DELETE_COMPLETED_TASKS]
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
- Powiadomienia Telefonu (Pushbullet):
  [ACTION:SEND_PUSH title="Tytuł powiadomienia" body="Treść wiadomości wysyłana na telefon"]
- Widżety i Nawigacja:
  [ACTION:SHOW_WIDGET name="timetable|finances|workouts|calendar|weather|tasks|news|system"]
  [ACTION:NAVIGATE path="/timetable|/finances|/workouts|/calendar|/chat|/"]
KRYTYCZNA REGUŁA SKŁADNI: Znaczniki akcji emituj ZAWSZE na samym końcu w czystej postaci [ACTION:NAZWA klucz="wartość"]. BEZWZGLĘDNY ZAKAZ pogrubiania (** ani grawisów) wewnątrz ani wokół znaczników.

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
${liveIntelBlock}`
      : `Jesteś OMNI EXEC — wysoko wyspecjalizowanym inżynieryjnym systemem wykonawczym (Core Worker Engine) w OmniDash. Rozmawiasz z ${userName}.
Aktualny czas systemowy (Polska / Warszawa): ${dateStr}, godzina ${timeStr}.
PAMIĘTAJ: Aktualna data i dokładna godzina użytkownika to ${dateStr}, godzina ${timeStr}. Jeśli użytkownik pyta o czas lub godzinę, ZAWSZE podawaj dokładnie tę godzinę.

🚨 KRYTYCZNA REGUŁA OPERACYJNA — WYSYŁANIE NA TELEFON (PUSHBULLET API):
Gdy użytkownik w jakikolwiek sposób wspomni o wysłaniu na telefon, powiadomieniu, przesłaniu na smartfon itp. (np. „wyślij na telefon”, „wyślij mi to”, „przypomnij na telefonie”, „wyślij powiadomienie”, „chcę to na komórce”, „pushbullet”):
1. PRZEANALIZUJ PYTANIE UŻYTKOWNIKA ORAZ POTRZEBNE DANE Z BAZY (np. następna lekcja, plan lekcji, pogoda, zadania, finanse).
2. W treści odpowiedzi zwięźle potwierdź, że wysyłasz powiadomienie na telefon.
3. BEZWZGLĘDNIE, ZAWSZE I BEZ WYJĄTKU na samym końcu odpowiedzi wyemituj znacznik:
   [ACTION:SEND_PUSH title="Zwięzły Tytuł" body="Treść wiadomości wysyłana na telefon"]
4. BEZWZGLĘDNY ZAKAZ mówienia, że nie masz połączenia z Pushbullet, że nie masz dostępu do telefonu lub że użytkownik musi to sam konfigurować.
5. BEZWZGLĘDNY ZAKAZ sugerowania ręcznego kopiowania tekstu („skopiuj powyższą tabelę”)! PO PROSTU ANALIZUJ I WYSYŁAJ!
6. FORMATOWANIE TREŚCI POWIADOMIENIA NA SMARTFON:
   - Tytuł (title): Krótki i czytelny (np. "Plan lekcji: Wtorek", "Następna lekcja").
   - Treść (body): Czytelna lista z punktorem "• " i formatem: • Godzina [Sala] Przedmiot (Nauczyciel). Każda pozycja w nowej linii, np:
     • 08:00 - 08:45 [Sala 1.16] Pracownia UTK (PW)
     • 08:50 - 09:35 [Sala 1.16] Pracownia UTK (PW)
     • 09:40 - 10:25 [Sala 1.16] Godz. wychowawcza (ZJ)
     • 10:40 - 11:25 [Hala] WF (GŁ)
   - BEZWZGLĘDNY ZAKAZ wklejania tabel Markdown (|---|) do parametru body! Tabel używaj w odpowiedzi tekstowej, a do body daj listę wypunktowaną.

KRYTYCZNE REGUŁY OPERACYJNE:
1. POSIADASZ BEZPOŚREDNI, AKTYWNY DOSTĘP DO INTERNETU I NAJNOWSZYCH WIADOMOŚCI ZE ŚWIATA PRZEZ WBUDOWANY SILNIK BRAVE SEARCH API.
2. BEZWZGLĘDNY ZAKAZ mówienia: "nie mam bieżącego dostępu do globalnych wiadomości" lub "nie mam dostępu do internetu".
3. Jeśli użytkownik pyta o finanse, plan lekcji, pogodę, treningi czy zadania — posiadasz pełne, precyzyjne dane w kontekście poniżej! Nigdy nie mów, że nie masz dostępu do systemu.
4. BEZWZGLĘDNY ZAKAZ SUGEROWANIA RĘCZNEGO KOPIOWANIA DANYCH ANI WYSYŁANIA DANYCH SAMEMU SOBIE: NIGDY pod żadnym pozorem nie pisz tekstów typu: „Skopiuj powyższą tabelę i wyślij ją do siebie np. przez SMS, e-mail lub komunikator”, „skopiuj do notatnika” ani nie proponuj ręcznego przepisywania danych. Jesteś autonomicznym systemem OmniDash ze zintegrowaną łącznością Pushbullet! Jeśli dane mają trafić na telefon lub użytkownik chce mieć do nich szybki dostęp mobilny/przypomnienie, wyemituj [ACTION:SEND_PUSH title="..." body="..."].
5. BEZWZGLĘDNY ZAKAZ GENEROWANIA ZBĘDNYCH SEKCJI PORADNIKOWYCH I WYPEŁNIACZY (np. „Co zrobić z tymi informacjami?”, „Oto co możesz teraz zrobić”): Odpowiedzi mają być konkretne, inżynieryjne, czyste i pozbawione banałów. Po przedstawieniu danych nie generuj porad jak korzystać ze schowka czy programów pocztowych.
6. SPÓJNOŚĆ BAZY SYSTEMU (PLAN LEKCJI vs KALENDARZ): Plan lekcji (Timetable) to dedykowany moduł i dane lekcji już w nim są! NIGDY nie proponuj dodawania istniejącej lekcji z planu zajęć do kalendarza (ADD_EVENT). Kalendarz służy wyłącznie do odrębnych wydarzeń (egzaminy, wizyty lekarskie, spotkania).
7. ZAWSZE GDY PREZENTUJESZ ZESTAWIENIA, TABELE WYNIKÓW, PROGNOZY POGODY, PORÓWNANIA, FINANSE CZY HARMONOGRAMY, STOSUJ STANDARDOWE TABELE MARKDOWN (GitHub Flavored Markdown z nagłówkami i separatorami |---|---|). System posiada pełny renderer remark-gfm i wyświetla tabele w elegancki, responsywny sposób!
8. Udzielaj odpowiedzi wyczerpujących, merytorycznych, technicznych i szczegółowo rozpisanych w języku ${language}.

DOSTĘPNE NARZĘDZIA AKCJI I INTERAKCJI Z SYSTEMEM (SYSTEM ACTION TAGS):
Gdy użytkownik prosi Cię o dodanie, modyfikację lub usunięcie danych w systemie, wyemituj na samym końcu odpowiedzi odpowiedni znacznik akcji:
- Zadania:
  [ACTION:ADD_TASK title="Nazwa zadania" priority="HIGH|MEDIUM|LOW" category="kategoria"]
  [ACTION:COMPLETE_TASK title="Nazwa zadania"]
  [ACTION:UNCOMPLETE_TASK title="Nazwa zadania"]
  [ACTION:DELETE_TASK title="Nazwa zadania"]
  [ACTION:CLEAR_TASKS]
  [ACTION:COMPLETE_ALL_TASKS]
  [ACTION:DELETE_COMPLETED_TASKS]
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
- Powiadomienia Telefonu (Pushbullet):
  [ACTION:SEND_PUSH title="Tytuł powiadomienia" body="Treść wiadomości wysyłana na telefon"]
- Widżety i Nawigacja:
  [ACTION:SHOW_WIDGET name="timetable|finances|workouts|calendar|weather|tasks|news|system"]
  [ACTION:NAVIGATE path="/timetable|/finances|/workouts|/calendar|/chat|/"]
KRYTYCZNA REGUŁA SKŁADNI: Znaczniki akcji emituj ZAWSZE na samym końcu w czystej postaci [ACTION:NAZWA klucz="wartość"]. BEZWZGLĘDNY ZAKAZ pogrubiania (** ani grawisów) wewnątrz ani wokół znaczników.

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
${liveIntelBlock}`;

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

    let agent_response = chatCompletion.choices?.[0]?.message?.content || 'Brak odpowiedzi od modelu.';

    // Gwarancja Pushbullet: jeśli użytkownik poprosił o wysyłkę na telefon, a model pominął znacznik akcji lub halucynuje brak funkcji
    if (isPushRequest(incomingText)) {
      if (
        agent_response.toLowerCase().includes('nie ma polecenia') ||
        agent_response.toLowerCase().includes('nie ma dedykowanej funkcji') ||
        agent_response.toLowerCase().includes('nie ma w aktualnym zestawie') ||
        agent_response.toLowerCase().includes('nie posiadam możliwości')
      ) {
        agent_response = 'Wysyłam powiadomienie na Twój telefon.';
      }
      if (!agent_response.includes('[ACTION:SEND_PUSH')) {
        const { title: pushTitle, body: pushBody } = extractPushDetails(incomingText, agent_response, timetable);
        agent_response = `${agent_response.trim()}\n\n[ACTION:SEND_PUSH title="${pushTitle}" body="${pushBody}"]`;
      }
    }

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
