import Groq from 'groq-sdk';
import { isStatusInquiry, isAbortCommand, extractTaskFromPhone } from '../modules/services/autonomousAgent.js';

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

      // 3. Zlecenie zadania badawczego
      const task = extractTaskFromPhone(content);
      if (task) {
        await sendServerlessPush(
          apiKey,
          '[OmniAgent Cloud 🤖] Przyjęto Zlecenie',
          `Rozpoczynam badanie: "${task}" w chmurze. Za chwilę wyślę raport.`
        );

        // Wykonaj szybkie wyszukiwanie i syntezę (w oknie 60s Vercela)
        const braveKey = process.env.BRAVE_SEARCH_API_KEY;
        const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

        if (braveKey && groqKey) {
          const searchUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(task)}&count=5`;
          const sRes = await fetch(searchUrl, {
            headers: { 'Accept': 'application/json', 'X-Subscription-Token': braveKey }
          });
          const sData = await sRes.json();
          const results = sData.web?.results || [];

          const groq = new Groq({ apiKey: groqKey });
          const completion = await groq.chat.completions.create({
            model: 'openai/gpt-oss-120b',
            messages: [
              {
                role: 'system',
                content: 'Jesteś analitykiem OmniDash. Sporządź zwięzły, konkretny raport z zebranych wyników dla operatora.'
              },
              {
                role: 'user',
                content: `Zadanie: "${task}"\nWyniki:\n${results.map((r, i) => `${i + 1}. [${r.title}] ${r.description}`).join('\n')}`
              }
            ],
            temperature: 0.3,
            max_tokens: 1000
          });

          const finalReport = completion.choices?.[0]?.message?.content || 'Brak danych.';
          await sendServerlessPush(apiKey, `[OmniAgent Cloud 🤖] Wynik: ${task.substring(0, 30)}`, finalReport);
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
