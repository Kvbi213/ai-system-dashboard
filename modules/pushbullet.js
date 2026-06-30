import WebSocket from 'ws';
import { executeRun } from './database.js';

export function startPushbulletListener() {
  const API_KEY = process.env.PUSHBULLET_API_KEY;

  if (!API_KEY || API_KEY === 'twój_klucz_pushbullet_tutaj') {
    console.log('[!] PUSHBULLET: Brak klucza API w pliku .env. Integracja telefonu nieaktywna.');
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
      console.log('[DEBUG] PUSHBULLET RAW MESSAGE:', JSON.stringify(message));
      
      // "tickle" oznacza, że stan czegoś uległ zmianie (np. odczytano powiadomienie na telefonie). Nas interesuje "push"
      if (message.type === 'push' && message.push) {
        const pushObj = message.push;
        
        // Czyste powiadomienie z telefonu nosi typ 'mirror'
        if (pushObj.type === 'mirror') {
          const appName = pushObj.application_name || 'System';
          const title = pushObj.title || 'Brak tytułu';
          const body = pushObj.body || '';

          // Zapisanie do lokalnej bazy
          await executeRun(
            'INSERT INTO phone_notifications (app_name, title, content) VALUES (?, ?, ?)',
            [appName, title, body]
          );
          
          console.log(`[+] PUSHBULLET: Złapano nowe powiadomienie [${appName}] ${title}`);
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
