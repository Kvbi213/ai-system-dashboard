import Groq from 'groq-sdk';

export const config = {
  maxDuration: 60,
};

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
    combined.includes('system') || 
    combined.includes('metryk') || 
    combined.includes('status') || 
    combined.includes('ram') || 
    combined.includes('cpu')
  ) {
    widgets.push('system');
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
      mode = 'worker', 
      userName = 'Użytkownik', 
      language = 'pl',
      context = {},
      customApiKey
    } = req.body || {};

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Brak wymaganego pola text.' });
    }

    const apiKey = customApiKey || process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY nie został skonfigurowany w środowisku Vercel.' });
    }

    const groq = new Groq({ apiKey });

    // Przygotowanie kontekstu operacyjnego
    const tasks = Array.isArray(context.tasks) ? context.tasks : [];
    const calendar = Array.isArray(context.calendar) ? context.calendar : [];
    const finances = Array.isArray(context.finances) ? context.finances : [];
    const workouts = Array.isArray(context.workouts) ? context.workouts : [];
    const brain = Array.isArray(context.operatorBrain) ? context.operatorBrain : [];

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

    const now = new Date();
    const dateStr = now.toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

    // Wybór promptu systemowego w zależności od trybu
    const systemPrompt = mode === 'mentor'
      ? `Jesteś J.A.R.V.I.S — nadrzędnym inteligentnym mentorem, analitykiem strategicznym i powiernikiem użytkownika w systemie OmniDash. Rozmawiasz z ${userName}.
Aktualny czas systemowy: ${dateStr}, godzina ${timeStr}.

BIEŻĄCY STAN PAMIĘCI I BAZY DANYCH UŻYTKOWNIKA (Live Firestore Sync):
📋 ZADANIA TO-DO:
${tasksSummary}

📅 KALENDARZ & TERMINY:
${calendarSummary}

💰 FINANSE & BUDŻET:
${financesSummary}

🏋️ TRENINGI & AKTYWNOŚĆ:
${workoutsSummary}

🧠 PAMIĘĆ DŁUGOTERMINOWA (OPERATOR BRAIN):
${brainSummary}

WYTYCZNE DLA MODELU OPENAI/GPT-OSS-120B (MENTOR MODE):
1. Odpowiadaj w języku: ${language}.
2. Buduj odpowiedzi wyczerpujące, dojrzałe, wieloaspektowe, głęboko przemyślane i precyzyjnie sformatowane w Markdown.
3. Gdy użytkownik pyta o zadania, plany, finanse lub status: przeprowadź głęboką analizę priorytetów, wskaż wąskie gardła i zaproponuj logiczną sekwencję działań.
4. Używaj przejrzystego formatowania: pogrubienia, listy drzewiaste, akapity tematyczne oraz sekcje analityczne.
5. Masz bezpośredni dostęp do wszystkich powyższych danych zsynchronizowanych w czasie rzeczywistym — nigdy nie twierdzisz, że nie masz dostępu do systemu To-Do ani innych modułów!`
      : `Jesteś F.R.I.D.A.Y — wysoko wyspecjalizowanym inżynieryjnym systemem wykonawczym (Core Worker Engine) w OmniDash. Rozmawiasz z ${userName}.
Aktualny czas systemowy: ${dateStr}, godzina ${timeStr}.

BIEŻĄCY STAN PAMIĘCI I BAZY DANYCH UŻYTKOWNIKA (Live Firestore Sync):
📋 ZADANIA TO-DO:
${tasksSummary}

📅 KALENDARZ & TERMINY:
${calendarSummary}

💰 FINANSE & BUDŻET:
${financesSummary}

🏋️ TRENINGI & AKTYWNOŚĆ:
${workoutsSummary}

🧠 PAMIĘĆ DŁUGOTERMINOWA (OPERATOR BRAIN):
${brainSummary}

WYTYCZNE DLA MODELU OPENAI/GPT-OSS-120B (WORKER MODE):
1. Odpowiadaj w języku: ${language}.
2. Udzielaj odpowiedzi wyczerpujących, merytorycznych, technicznych i szczegółowo rozpisanych z zachowaniem inżynieryjnej dyscypliny.
3. Jeśli zapytanie dotyczy zadań ("co mamy dziś w todo?", "jakie mam plany?"), przedstaw pełną, uporządkowaną listę z podziałem na statusy i priorytety, a następnie zaproponuj rekomendowany harmonogram wykonania.
4. Używaj eleganckiego formatowania Markdown: sekcje z nagłówkami H3/H4, listy punktowe, bloki kodu jeśli potrzebne.
5. Posiadasz pełną wiedzę o wszystkich elementach w bazie — nigdy nie odpowiadaj wymijająco!`;

    const chatCompletion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: mode === 'mentor' ? 0.7 : 0.4,
      max_tokens: 3500,
    });

    const agent_response = chatCompletion.choices?.[0]?.message?.content || 'Brak odpowiedzi od modelu.';
    const mentor_thoughts = mode === 'mentor' 
      ? `Głęboka analiza kognitywna (GPT-OSS 120B): przetworzono kontekst operacyjny (${tasks.length} zadań, ${calendar.length} wydarzeń, ${finances.length} wpisów finansowych).` 
      : null;

    const widgets = determineWidgets(text, agent_response);

    return res.status(200).json({
      agent_response,
      mentor_thoughts,
      widgets,
      model: 'openai/gpt-oss-120b',
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
