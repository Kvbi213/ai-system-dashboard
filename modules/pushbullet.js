import WebSocket from 'ws';
import { executeRun } from './database.js';
import { broadcastEvent } from './emitter.js';
import { getFirestoreDb } from './firebase.js';
import {
  isDuplicateNotification,
  classifyExpenseWithAi,
  formatExpenseConfirmation
} from './services/pushbulletClassifier.js';

export function startPushbulletListener() {
  const API_KEY = process.env.PUSHBULLET_API_KEY;

  if (!API_KEY || API_KEY === 'twój_klucz_pushbullet_tutaj' || API_KEY === 'your_pushbullet_api_key') {
    console.log('[!] PUSHBULLET: Brak klucza API w konfiguracji środowiskowej. Integracja telefonu nieaktywna.');
    return;
  }

  console.log('[*] PUSHBULLET: Inicjowanie połączenia WebSocket z telefonem...');
  const ws = new WebSocket(`wss://stream.pushbullet.com/websocket/${API_KEY}`);

  ws.on('open', () => {
    console.log('[+] SUCCESS: Połączono z Pushbullet Stream. Nasłuch powiadomień aktywny.');
  });

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      
      // "tickle" oznacza zmianę stanu na telefonie. "push" niesie treść powiadomienia
      if (message.type === 'push' && message.push) {
        const pushObj = message.push;
        
        // Czyste powiadomienie z telefonu nosi typ 'mirror'
        if (pushObj.type === 'mirror') {
          const appName = pushObj.application_name || 'System';
          const title = pushObj.title || 'Brak tytułu';
          const body = pushObj.body || '';

          // 1. Zapisanie surowego powiadomienia do lokalnej bazy
          await executeRun(
            'INSERT INTO phone_notifications (app_name, title, content) VALUES (?, ?, ?)',
            [appName, title, body]
          );
          
          console.log(`[+] PUSHBULLET: Złapano nowe powiadomienie [${appName}] ${title}`);

          // 2. Weryfikacja duplikatów
          if (isDuplicateNotification(appName, title, body)) {
            console.log(`[*] PUSHBULLET: Zignorowano zduplikowane powiadomienie [${appName}]`);
            return;
          }

          // 3. Kognitywna klasyfikacja wydatku (50/30/20)
          const classified = await classifyExpenseWithAi(appName, title, body);
          
          if (classified && classified.is_expense && classified.amount > 0) {
            const dateStr = new Date().toISOString().split('T')[0];
            const timestamp = new Date().toISOString();

            // A. Zapis do lokalnej bazy SQLite
            const sqlResult = await executeRun(
              'INSERT INTO finances (type, amount, currency, category, bucket, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [
                'expense',
                classified.amount,
                classified.currency || 'PLN',
                classified.category || 'Inne',
                classified.bucket || 'needs',
                classified.description || 'Płatność mobilna',
                dateStr
              ]
            );
            console.log(`[+] PUSHBULLET AUTO-FINANSE: Zapisano wydatek #${sqlResult.id} (${classified.amount} ${classified.currency}) -> ${classified.bucket}`);

            // B. Zapis do Cloud Firestore (jeśli aktywne)
            try {
              const firestoreDb = getFirestoreDb();
              if (firestoreDb) {
                const finDocId = `fin_pb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                await firestoreDb.collection('finances').doc(finDocId).set({
                  id: finDocId,
                  type: 'expense',
                  amount: classified.amount,
                  currency: classified.currency || 'PLN',
                  category: classified.category || 'Inne',
                  bucket: classified.bucket || 'needs',
                  description: classified.description || 'Płatność mobilna',
                  transaction_date: dateStr,
                  origin: 'pushbullet',
                  created_at: timestamp
                });
                console.log(`[+] PUSHBULLET: Zsynchronizowano wydatek z Cloud Firestore (${finDocId})`);
              }
            } catch (fsErr) {
              console.warn('[!] PUSHBULLET: Błąd synchronizacji Firestore:', fsErr.message);
            }

            // C. Rozgłoszenie zdarzenia SSE do frontendu
            broadcastEvent('finance_updated', {
              id: sqlResult.id,
              type: 'expense',
              amount: classified.amount,
              currency: classified.currency,
              category: classified.category,
              bucket: classified.bucket,
              description: classified.description,
              date: dateStr
            });

            // D. Potwierdzenie zwrotne na telefon operatora
            const confirmText = formatExpenseConfirmation(classified);
            sendPushNotification('OmniDash Auto-Finanse 💳', confirmText).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.error('[!] PUSHBULLET: Błąd przetwarzania wiadomości WebSocket:', err.message);
    }
  });

  ws.on('close', () => {
    console.log('[!] PUSHBULLET: Rozłączono z WebSocket. Próba ponownego połączenia za 30s...');
    setTimeout(startPushbulletListener, 30000);
  });

  ws.on('error', (err) => {
    console.error('[!] PUSHBULLET: Błąd połączenia WebSocket:', err.message);
    ws.close();
  });
}

export async function sendPushNotification(title, body) {
  const API_KEY = process.env.PUSHBULLET_API_KEY;
  if (!API_KEY || API_KEY === 'twój_klucz_pushbullet_tutaj' || API_KEY === 'your_pushbullet_api_key') {
    return { success: false, error: 'Brak klucza PUSHBULLET_API_KEY w konfiguracji środowiskowej.' };
  }

  try {
    const response = await fetch('https://api.pushbullet.com/v2/pushes', {
      method: 'POST',
      headers: {
        'Access-Token': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'note',
        title: title || 'OmniDash System',
        body: body || ''
      })
    });
    const data = await response.json();
    return { success: response.ok, iden: data.iden, data };
  } catch (err) {
    console.error('[!] PUSHBULLET: Błąd wysyłania powiadomienia:', err.message);
    return { success: false, error: err.message };
  }
}

