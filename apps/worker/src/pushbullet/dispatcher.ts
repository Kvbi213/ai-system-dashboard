import { z } from 'zod';

export const PushNotificationSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  body: z.string().min(1),
  priority: z.enum(['CRITICAL', 'NORMAL', 'LOW']).default('NORMAL'),
  targetEmail: z.string().email().optional(),
  targetDeviceId: z.string().optional(),
  scheduledFor: z.number().optional(),
  attempts: z.number().int().min(0).default(0),
  maxAttempts: z.number().int().min(1).default(3),
  createdAt: z.number().default(() => Date.now()),
  status: z.enum(['PENDING', 'SENT', 'FAILED', 'RATE_LIMITED']).default('PENDING')
});

export type PushNotification = z.infer<typeof PushNotificationSchema>;

export class PushbulletDispatcher {
  private apiKey: string;
  private queue: PushNotification[] = [];
  private rateLimitWindowMs = 60000;
  private maxRequestsPerWindow = 12;
  private sentTimestamps: number[] = [];
  private isProcessing = false;
  private intervalTimer: NodeJS.Timeout | null = null;
  private maxHistorySize = 100;
  private deliveredHistory: { id: string; title: string; sentAt: number; success: boolean }[] = [];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private sortQueue(): void {
    const pWeight = { CRITICAL: 3, NORMAL: 2, LOW: 1 };
    this.queue.sort((a, b) => pWeight[b.priority] - pWeight[a.priority]);
  }

  private recordHistory(entry: { id: string; title: string; sentAt: number; success: boolean }): void {
    this.deliveredHistory.push(entry);
    if (this.deliveredHistory.length > this.maxHistorySize) {
      this.deliveredHistory.shift();
    }
  }

  public start(tickMs = 3000): void {
    if (this.intervalTimer) return;
    console.log('[+] SUCCESS :: Deterministyczny Pushbullet Dispatcher uruchomiony.');
    this.intervalTimer = setInterval(() => {
      this.processQueue();
    }, tickMs);
  }

  public stop(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  public enqueue(notif: Omit<PushNotification, 'id' | 'attempts' | 'status' | 'createdAt' | 'maxAttempts'> & { id?: string; maxAttempts?: number }): PushNotification {
    const raw = {
      id: notif.id || `push_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: notif.title,
      body: notif.body,
      priority: notif.priority || 'NORMAL',
      targetEmail: notif.targetEmail,
      targetDeviceId: notif.targetDeviceId,
      scheduledFor: notif.scheduledFor,
      attempts: 0,
      maxAttempts: notif.maxAttempts ?? 3,
      createdAt: Date.now(),
      status: 'PENDING' as const
    };

    const validationResult = PushNotificationSchema.safeParse(raw);
    if (!validationResult.success) {
      const issueMsg = validationResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      console.error(`[!] DISPATCHER :: Nieprawidłowe dane powiadomienia: ${issueMsg}`);
      throw new Error(`[DISPATCHER_VALIDATION_ERROR] ${issueMsg}`);
    }

    const validated = validationResult.data;
    this.queue.push(validated);
    this.sortQueue();

    console.log(`[*] DISPATCHER :: Zakolejkowano powiadomienie [${validated.priority}] "${validated.title}" (Kolejka: ${this.queue.length})`);
    return validated;
  }

  public async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    try {
      const now = Date.now();
      this.sentTimestamps = this.sentTimestamps.filter((t) => now - t < this.rateLimitWindowMs);

      if (this.sentTimestamps.length >= this.maxRequestsPerWindow) {
        console.warn(`[!] DISPATCHER :: Osiągnięto limit okna Pushbullet (${this.sentTimestamps.length}/${this.maxRequestsPerWindow}). Wstrzymanie.`);
        return;
      }

      const nextIndex = this.queue.findIndex((n) => !n.scheduledFor || n.scheduledFor <= now);
      if (nextIndex === -1) return;

      const item = this.queue.splice(nextIndex, 1)[0];
      if (!item) return;

      item.attempts += 1;

      if (!this.apiKey) {
        console.log(`[*] DISPATCHER [DEMO] :: Wysłano push "${item.title}" -> "${item.body}"`);
        item.status = 'SENT';
        this.recordHistory({ id: item.id, title: item.title, sentAt: Date.now(), success: true });
        this.sentTimestamps.push(Date.now());
        return;
      }

      try {
        const payload: Record<string, string> = {
          type: 'note',
          title: item.title,
          body: item.body
        };
        if (item.targetEmail) payload.email = item.targetEmail;
        if (item.targetDeviceId) payload.device_iden = item.targetDeviceId;

        const res = await fetch('https://api.pushbullet.com/v2/pushes', {
          method: 'POST',
          headers: {
            'Access-Token': this.apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          item.status = 'SENT';
          this.sentTimestamps.push(Date.now());
          this.recordHistory({ id: item.id, title: item.title, sentAt: Date.now(), success: true });
          console.log(`[+] SUCCESS :: Pushbullet dostarczono [${item.id}] "${item.title}"`);
        } else if (res.status === 429) {
          item.status = 'RATE_LIMITED';
          console.warn(`[!] DISPATCHER :: 429 Rate Limited. Ponawianie z backoffem.`);
          if (item.attempts < item.maxAttempts) {
            item.scheduledFor = Date.now() + Math.pow(2, item.attempts) * 5000;
            this.queue.unshift(item);
            this.sortQueue();
          }
        } else {
          throw new Error(`Pushbullet API Error: HTTP ${res.status}`);
        }
      } catch (err) {
        console.error(`[!] DISPATCHER :: Błąd wysyłania (${item.attempts}/${item.maxAttempts}):`, err);
        if (item.attempts < item.maxAttempts) {
          item.scheduledFor = Date.now() + Math.pow(2, item.attempts) * 3000;
          this.queue.push(item);
          this.sortQueue();
        } else {
          item.status = 'FAILED';
          this.recordHistory({ id: item.id, title: item.title, sentAt: Date.now(), success: false });
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  public getQueueStatus() {
    return {
      pendingCount: this.queue.length,
      sentWindowCount: this.sentTimestamps.length,
      maxPerWindow: this.maxRequestsPerWindow,
      historyCount: this.deliveredHistory.length,
      recentHistory: this.deliveredHistory.slice(-10)
    };
  }
}
