import Groq from 'groq-sdk';
import { isStatusInquiry, isAbortCommand, extractTaskFromPhone, generateFallbackPlan } from '../modules/services/autonomousClassifier.js';

export const config = {
  maxDuration: 60,
};

async function sendServerlessPush(apiKey, title, body) {
  if (!apiKey) return false;
  try {
    const res = await fetch('https://api.pushbullet.com/v2/pushes', {
      method: 'POST',
      headers: {
        'Access-Token': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'note',
        title: title || 'OmniDash Cloud Agent',
        body: body || ''
      })
    });
    return res.ok;
  } catch (err) {
    console.warn('[Vercel Webhook Push Error]:', err.message);
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Access-Token, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.PUSHBULLET_API_KEY;

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      service: 'Pushbullet Cloud Webhook Relay',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method === 'POST') {
    try {
      const payload = req.body || {};
      let content = '';

      // Przypadek 1: Bezpośredni obiekt push
      if (payload.push) {
        content = `${payload.push.title || ''} ${payload.push.body || ''}`.trim();
      } else if (payload.body || payload.title) {
        content = `${payload.title || ''} ${payload.body || ''}`.trim();
      } else if (payload.type === 'tickle' && apiKey) {
        // Pobierz najnowszy push z Pushbullet
        const pushesRes = await fetch('https://api.pushbullet.com/v2/pushes?limit=1', {
          headers: { 'Access-Token': apiKey }
        });
        if (pushesRes.ok) {
          const pushData = await pushesRes.json();
          const latest = pushData.pushes?.[0];
          if (latest && latest.type === 'note') {
            content = `${latest.title || ''} ${latest.body || ''}`.trim();
          }
        }
      }

      console.log('[Vercel Webhook] Odebrano treść ze smartfona:', content);

      if (!content) {
        return res.status(200).json({ received: true, action: 'none' });
      }

      // Ignorowanie notyfikacji własnych generowanych przez system (ochrona przed pętlą)
      const rawTitle = payload.push?.title || payload.title || '';
      const rawBody = payload.push?.body || payload.body || '';
      const isOwnNotification = (rawTitle + ' ' + rawBody).toLowerCase().includes('omnidash') ||
        (rawTitle + ' ' + rawBody).toLowerCase().includes('omniagent') ||
        (rawTitle + ' ' + rawBody).toLowerCase().includes('omnidaemon');

      if (isOwnNotification) {
        return res.status(200).json({ received: true, action: 'ignored_own_notification' });
      }

      // 1. Sprawdzenie zapytania o stan
      if (isStatusInquiry(content)) {
        const msg = `• Stan: Aktywny w chmurze Vercel ☁️\n• Połączenie: Pushbullet Webhook Active\n• Brak zablokowanych procesów.\n• Wyślij "zbadaj [temat]" aby zlecić zadanie.`;
        await sendServerlessPush(apiKey, '[OmniAgent Cloud 🤖] Stan na Żywo', msg);
        return res.status(200).json({ received: true, action: 'status_inquiry_replied' });
      }

      // 2. Polecenie zatrzymania
      if (isAbortCommand(content)) {
        await sendServerlessPush(apiKey, '[OmniAgent Cloud 🤖] Zatrzymano ⏹️', 'Zatrzymano procesy agenta w chmurze.');
        return res.status(200).json({ received: true, action: 'aborted' });
      }

      // 3. Zlecenie zadania badawczego (Deep Research)
      const task = extractTaskFromPhone(content);
      if (task) {
        await sendServerlessPush(
          apiKey,
          '[OmniAgent Cloud 🤖] Przyjęto Cel Badawczy',
          `Rozpoczynam wieloetapowe badanie w sieci (Brave Search) dla:\n"${task}"\nBędę raportował postępy.`
        );

        const braveKey = process.env.BRAVE_SEARCH_API_KEY || 'BSAFmBe5BK_uBCgM4Qhrj1HHvsGijhh';
        const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

        if (groqKey) {
          const plan = generateFallbackPlan(task);
          const steps = plan.steps || [
            { query: `${task} benchmarks comparison 2026`, focus: 'Porównanie i benchmarki' },
            { query: `${task} roadmap future architecture specs`, focus: 'Roadmapa i specyfikacja' }
          ];

          const allResults = [];
          const seenUrls = new Set();

          // Wykonanie wyszukiwań dla kolejnych etapów
          for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            try {
              const searchUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(step.query)}&count=5`;
              const sRes = await fetch(searchUrl, {
                headers: { 'Accept': 'application/json', 'X-Subscription-Token': braveKey }
              });
              if (sRes.ok) {
                const sData = await sRes.json();
                const list = sData.web?.results || [];
                list.forEach(r => {
                  if (r.url && !seenUrls.has(r.url)) {
                    seenUrls.add(r.url);
                    allResults.push({ ...r, stepFocus: step.focus });
                  }
                });
              }
            } catch (searchErr) {
              console.warn('[Vercel Search Err]:', searchErr.message);
            }

            // Milestone Push po etapie 1 (jeśli są kolejne)
            if (i === 0 && steps.length > 1 && allResults.length > 0) {
              await sendServerlessPush(
                apiKey,
                `[OmniAgent 🤖] Etap 1/${steps.length}`,
                `• Zbadano: ${step.focus}\n• Pozyskano ${allResults.length} źródeł.\n• Przechodzę do analizy roadmap i szczegółów.`
              );
            }
          }

          const groq = new Groq({ apiKey: groqKey });
          const completion = await groq.chat.completions.create({
            model: 'openai/gpt-oss-120b',
            messages: [
              {
                role: 'system',
                content: `Jesteś OMNIDAEMON — Głównym Analitykiem AI i Agentem Badawczym 24/7.
Operator zadał pytanie: "${task}".
Przeszukano internet przez Brave Search. Sporządź wyczerpujący, ekspercki, techniczny raport.
Jeśli badane są modele AI:
1. Dla KAŻDEGO z modeli (np. OpenAI GPT-5/o-series, Claude 3.7/Sonnet, Gemini 2.5/Pro, DeepSeek R1/V3):
   - Architektura i kluczowe parametry
   - Rozmiar okna kontekstowego (Context Window)
   - Benchmarki (MMLU-Pro, MATH, HumanEval)
   - Plany, roadmapa i przewidywana przyszłość
2. Tabela porównawcza parametrów Markdown.
3. Kto ma największą szansę zdominować rynek i dlaczego.
Pisz profesjonalnie, technicznie, po polsku.`
              },
              {
                role: 'user',
                content: `Cel: "${task}"\n\nZebrane źródła (${allResults.length}):\n${allResults.map((r, i) => `${i + 1}. [${r.title}] (${r.url})\n   ${r.description}`).join('\n\n')}`
              }
            ],
            temperature: 0.3,
            max_tokens: 1800
          });

          const finalReport = completion.choices?.[0]?.message?.content || 'Brak danych z syntezy.';
          await sendServerlessPush(apiKey, `[OmniAgent 🤖] Raport: ${task.substring(0, 30)}`, finalReport);
        }

        return res.status(200).json({ received: true, action: 'task_executed' });
      }

      // 4. Ogólne zapytanie ze smartfona na czat (OmniDaemon) - BEZWZGLĘDNY PUSH Z ODPOWIEDZIĄ
      const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
      let aiResponseText = 'Odebrano wiadomość w chmurze Vercel. OmniDaemon jest aktywny 24/7.';

      if (groqKey) {
        try {
          const groq = new Groq({ apiKey: groqKey });
          const completion = await groq.chat.completions.create({
            model: 'openai/gpt-oss-120b',
            messages: [
              {
                role: 'system',
                content: 'Jesteś OMNIDAEMON — autonomicznym asystentem 24/7 w systemie OmniDash. Operator pisze do Ciebie ze smartfona przez Pushbullet. Odpowiadaj konkretnie, profesjonalnie, zwięźle i wyczerpująco w języku polskim. Posiadasz pełną autonomię w chmurze.'
              },
              {
                role: 'user',
                content: content
              }
            ],
            temperature: 0.4,
            max_tokens: 1000
          });
          aiResponseText = completion.choices?.[0]?.message?.content || aiResponseText;
        } catch (groqErr) {
          console.warn('[Vercel Webhook Groq Error]:', groqErr.message);
          aiResponseText = `[OmniDaemon] Błąd generowania odpowiedzi: ${groqErr.message}`;
        }
      }

      // BEZWZGLĘDNE ODESŁANIE ODPOWIEDZI PRZEZ PUSHBULLET
      await sendServerlessPush(apiKey, 'OmniDash AI 🤖', aiResponseText);

      return res.status(200).json({ received: true, action: 'mobile_chat_replied', response: aiResponseText });
    } catch (err) {
      console.error('[Vercel Webhook Error]:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
