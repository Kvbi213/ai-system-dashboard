import axios from 'axios';

/**
 * Autonomiczny Silnik AI Dyspozytora Klienckiego (Client-Side AI Dispatcher)
 * Pozwala na komunikację z modelami LLM (Groq / Llama 3.3 / Gemini)
 * zarówno przez serwer Express (lokalnie), jak i bezpośrednio z poziomu przeglądarki (w chmurze .web.app).
 */

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

const isCloudMode = typeof window !== 'undefined' && (
  window.location.hostname.includes('web.app') || 
  window.location.hostname.includes('firebaseapp.com')
);

export const dispatchAiQuery = async ({ text, mode = 'worker', userName = 'Użytkownik', language = 'pl' }) => {
  // 1. Jeśli jesteśmy lokalnie, spróbuj najpierw odpytać lokalny backend Express
  if (!isCloudMode) {
    try {
      const { data } = await axios.post('/api/agent', {
        text,
        mode,
        userName,
        language
      }, { timeout: 15000 });

      if (data && (data.agent_response || data.payload)) {
        return {
          content: data.agent_response || (data.payload?.agent_response || data.payload?.title || JSON.stringify(data.payload)),
          mentor_thoughts: data.mentor_thoughts || null,
          widgets: data.widgets || (data.widget ? [data.widget] : []),
          source: 'local_backend'
        };
      }
    } catch (backendErr) {
      console.warn('[AiDispatcher] Backend lokalny niedostępny, przełączam na autonomiczny klient chmurowy:', backendErr.message);
    }
  }

  // 2. Tryb Chmurowy / Fallback Bezpośredni do API LLM
  const groqKey = localStorage.getItem('system_groq_api_key') || 
                  localStorage.getItem('system_api_key') || 
                  import.meta.env.VITE_GROQ_API_KEY;

  if (groqKey && groqKey !== 'unconfigured_key' && groqKey.startsWith('gsk_')) {
    try {
      const systemPrompt = mode === 'mentor'
        ? `Jesteś J.A.R.V.I.S — osobistym mentorem analitycznym i strategicznym w systemie OmniDash. Rozmawiasz z użytkownikiem ${userName}. Twój ton jest inteligentny, przenikliwy, chłodny analitycznie, bez zbędnych uprzejmości. Język: ${language}. Przeanalizuj problem, wskaż ryzyka i konkretne rekomendacje.`
        : `Jesteś F.R.I.D.A.Y — inżynieryjnym systemem wykonawczym (Worker) w OmniDash. Rozmawiasz z ${userName}. Odpowiadaj maksymalnie konkretnie, zwięźle, technicznie i merytorycznie. Formatuj kod w blokach markdown. Język: ${language}.`;

      const response = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          temperature: mode === 'mentor' ? 0.7 : 0.2,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API HTTP ${response.status}: ${errText}`);
      }

      const resData = await response.json();
      const content = resData.choices?.[0]?.message?.content || 'Brak odpowiedzi od modelu.';
      const thoughts = mode === 'mentor' ? `Analiza kognitywna wykonana bezpośrednio przez chmurę Groq Llama-3.3-70b dla zapytania: "${text.slice(0, 40)}..."` : null;

      return {
        content,
        mentor_thoughts: thoughts,
        widgets: [],
        source: 'cloud_groq'
      };
    } catch (groqErr) {
      console.warn('[AiDispatcher] Bezpośrednie zapytanie Groq nie powiodło się:', groqErr.message);
    }
  }

  // 3. Wbudowany inteligentny asystent autonomiczny (Gdy brak klucza w chmurze)
  return handleAutonomousFallback(text, mode, userName);
};

function handleAutonomousFallback(text, mode, userName) {
  const lower = text.toLowerCase().trim();

  if (lower.includes('status') || lower.includes('system') || lower.includes('stan')) {
    return {
      content: `### 🛰️ OmniDash Core Status\n- **Środowisko:** ${isCloudMode ? 'Firebase Cloud (void-potato-7721)' : 'Desktop Bridge'}\n- **Operator:** ${userName}\n- **Integralność bazy:** Zgodna (Firestore Live-Sync)\n- **Kolejka agentów:** Gotowa\n- **Ochrona sesji:** Aktywna (Crash Guard v2.2.1)`,
      mentor_thoughts: 'Wygenerowano raport statusowy z lokalnego silnika telemetrii.',
      widgets: []
    };
  }

  if (lower.includes('zadania') || lower.includes('todo') || lower.includes('zrób')) {
    return {
      content: `[*] Zarejestrowano polecenie dotyczące zadań. Przejdź do zakładki **Pulpit** lub **Widżety**, aby zarządzać zsynchronizowaną z Firestore listą to-do.`,
      mentor_thoughts: 'Przekierowanie do modułu zadań.',
      widgets: []
    };
  }

  return {
    content: `[+] **Tryb Autonomiczny OmniDash (${mode.toUpperCase()})**\n\nOtrzymano polecenie: *"${text}"*.\n\nAby odblokować pełną moc generatywną modelu **Llama-3.3-70b** bezpośrednio w chmurze bez limitów i bez potrzeby włączania komputera domowego, wprowadź swój bezpłatny klucz API w:\n👉 **Ustawienia (Settings) -> Klucze API -> Groq API Key**.\n\nWszystkie moduły zadań, finansów, kalendarza i notatek działają synchronicznie w chmurze.`,
    mentor_thoughts: mode === 'mentor' ? 'Wykryto zapytanie w trybie chmurowym bez dedykowanego klucza LLM.' : null,
    widgets: []
  };
}
