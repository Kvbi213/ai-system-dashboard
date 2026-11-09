import WebSocket from 'ws';
import { classifyNotification } from './classifier.js';
import { PushNotificationAggregator } from '../triage/pushNotificationAggregator.js';

interface PushbulletPush {
  type: string;
  subtype?: string;
  title?: string;
  body?: string;
  iden?: string;
}

export class PushbulletListener {
  private apiKey: string;
  private apiGatewayUrl: string;
  private ws: WebSocket | null = null;
  private seenIds = new Set<string>();
  private reconnectAttempts = 0;
  private isRunning = false;
  private aggregator?: PushNotificationAggregator;

  constructor(apiKey: string, apiGatewayUrl = 'http://localhost:5000/api', aggregator?: PushNotificationAggregator) {
    this.apiKey = apiKey;
    this.apiGatewayUrl = apiGatewayUrl;
    this.aggregator = aggregator;
  }

  public setAggregator(aggregator: PushNotificationAggregator): void {
    this.aggregator = aggregator;
  }

  public start(): void {
    if (!this.apiKey || this.apiKey === 'twój-klucz-pushbullet') {
      console.log('[*] INFO :: Pushbullet API Key nie jest skonfigurowany. Daemon WebSocket przechodzi w tryb symulacji.');
      return;
    }

    this.isRunning = true;
    this.connect();
  }

  private connect(): void {
    if (!this.isRunning) return;

    const url = `wss://stream.pushbullet.com/websocket/${this.apiKey}`;
    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      console.log('[+] SUCCESS :: Pushbullet WebSocket połączony pomyślnie.');
      this.reconnectAttempts = 0;
    });

    this.ws.on('message', async (data: WebSocket.Data) => {
      try {
        const payload = JSON.parse(data.toString());
        if (payload.type === 'push' && payload.push) {
          await this.handlePush(payload.push);
        }
      } catch (err) {
        console.error('[!] Błąd parsowania ramki WebSocket Pushbullet:', err);
      }
    });

    this.ws.on('close', () => {
      console.warn('[!] Pushbullet WebSocket rozłączony. Ponawianie połączenia...');
      this.scheduleReconnect();
    });

    this.ws.on('error', (err) => {
      console.error('[!] Błąd Pushbullet WebSocket:', err);
    });
  }

  private async handlePush(push: PushbulletPush): Promise<void> {
    if (push.iden && this.seenIds.has(push.iden)) {
      return; // deduplication
    }
    if (push.iden) {
      this.seenIds.add(push.iden);
      setTimeout(() => this.seenIds.delete(push.iden!), 60000);
    }

    const title = push.title || '';
    const body = push.body || '';
    const classified = classifyNotification(title, body);

    console.log(`[*] PUSHBULLET :: Otrzymano zdarzenie: [${classified.type}] ${classified.title || classified.raw}`);

    // Rejestracja w lokalnym agregatorze powiadomień
    if (this.aggregator) {
      this.aggregator.record(title, body, classified);
    }

    // Forward to API Gateway
    try {
      await fetch(`${this.apiGatewayUrl}/pushbullet/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev-operator-token'
        },
        body: JSON.stringify({ title, body, classified })
      });
    } catch (err) {
      console.error('[!] Nie udało się przekazać powiadomienia do API Gateway:', err);
    }
  }

  private scheduleReconnect(): void {
    if (!this.isRunning) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    setTimeout(() => this.connect(), delay);
  }

  public stop(): void {
    this.isRunning = false;
    this.ws?.close();
  }
}
