import { PushbulletDispatcher } from '../pushbullet/dispatcher.js';
import { LessonAlertMonitor } from '../automation/lessonAlertMonitor.js';

export class SystemScheduler {
  private timers: NodeJS.Timeout[] = [];
  private apiGatewayUrl: string;
  private dispatcher?: PushbulletDispatcher;
  private lessonAlertMonitor: LessonAlertMonitor;

  // Master Clock & Continuous Drift-Compensated Chronometer
  private lastSyncedServerTimeMs: number = Date.now();
  private lastSyncTimestampMs: number = Date.now();
  private minuteTickCount: number = 0;

  constructor(apiGatewayUrl = 'http://localhost:5000/api', dispatcher?: PushbulletDispatcher) {
    this.apiGatewayUrl = apiGatewayUrl;
    this.dispatcher = dispatcher;
    this.lessonAlertMonitor = new LessonAlertMonitor({
      apiGatewayUrl: this.apiGatewayUrl,
      dispatcher: this.dispatcher
    });
  }

  public start(): void {
    console.log('[+] SUCCESS :: Harmonogram zadań cyklicznych (Cron Scheduler) wystartował.');

    // 1. Initial immediate time synchronization with API Gateway
    this.syncAuthoritativeTime();

    // 2. High-Frequency Chronometer: every 1 minute check current authoritative time and log drift
    const minuteChronometer = setInterval(() => {
      this.tickMinuteChronometer();
    }, 60 * 1000);
    this.timers.push(minuteChronometer);

    // 3. Hourly Full Authoritative Sync: every 60 minutes re-sync authoritative time from API & check daily schedule
    const hourlySync = setInterval(() => {
      this.syncAuthoritativeTime();
    }, 60 * 60 * 1000);
    this.timers.push(hourlySync);

    // 4. Every 15 minutes: refresh road traffic status
    const trafficTimer = setInterval(() => {
      this.syncTrafficTelemetry();
    }, 15 * 60 * 1000);
    this.timers.push(trafficTimer);

    // Initial warm-up ping
    this.pingHealth();
  }

  /**
   * Synchronizuje czas autorytatywny z bramą API Gateway.
   * Odpytuje /system/time i kalibruje lokalny zegar monotoniczny.
   */
  public async syncAuthoritativeTime(): Promise<void> {
    const t0 = Date.now();
    try {
      const res = await fetch(`${this.apiGatewayUrl}/system/time`, {
        headers: { 'x-dev-bypass': 'true' }
      });
      const t1 = Date.now();
      const roundTripMs = t1 - t0;

      if (res.ok) {
        const data = await res.json() as { epochMs: number; localTime: string; localDate: string };
        // Kompensacja opóźnienia sieciowego (round-trip / 2)
        this.lastSyncedServerTimeMs = data.epochMs + Math.round(roundTripMs / 2);
        this.lastSyncTimestampMs = Date.now();
        console.log(`[*] CHRONOMETER :: Zsynchronizowano autorytatywny czas: ${data.localTime} (${data.localDate}) [RTT: ${roundTripMs}ms]`);
      } else {
        // Fallback do zegara lokalnego środowiska
        this.lastSyncedServerTimeMs = Date.now();
        this.lastSyncTimestampMs = Date.now();
      }
    } catch {
      this.lastSyncedServerTimeMs = Date.now();
      this.lastSyncTimestampMs = Date.now();
      console.warn('[!] CHRONOMETER :: Brak odpowiedzi endpointu czasu, fallback do lokalnego RTC.');
    }
  }

  /**
   * Wewnętrzny kalkulator czasu monotonicznego pomiędzy synchronizacjami godzinowymi.
   */
  public getCurrentMonotonicTime(): { epochMs: number; date: Date; formattedTime: string } {
    const elapsedSinceSync = Date.now() - this.lastSyncTimestampMs;
    const currentEpoch = this.lastSyncedServerTimeMs + elapsedSinceSync;
    const date = new Date(currentEpoch);
    const formattedTime = date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return { epochMs: currentEpoch, date, formattedTime };
  }

  /**
   * Wyzwalane co minutę: oblicza bieżący czas i sprawdza harmonogram zadań.
   */
  private tickMinuteChronometer(): void {
    this.minuteTickCount++;
    const { date, formattedTime } = this.getCurrentMonotonicTime();
    const minutes = date.getMinutes();
    const hours = date.getHours();

    // Log telemetryczny weryfikacji minuty
    console.log(`[*] TICK :: [${formattedTime}] Minuta operacyjna: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);

    // Sprawdzenie zakończenia lekcji lub bloków dnia o pełnych minutach
    this.evaluateMinuteScheduleEvents(hours, minutes);

    // Automatyczny monitor lekcji i dzwonków szkolnych (Pushbullet Alert)
    this.lessonAlertMonitor.checkAndDispatch(date).catch((err) => {
      console.warn('[!] Błąd ewaluacji monitora lekcji:', err);
    });
  }

  private evaluateMinuteScheduleEvents(hours: number, minutes: number): void {
    // Proaktywne okno dobowe (np. 3h przed planowanym snem 23:00 -> 20:00)
    if (hours === 20 && minutes === 0) {
      console.log('[*] HEALTH :: Osiągnięto godzinę 20:00 — okno ostatniego posiłku 3h przed planowanym snem (TASK-PB-02).');
      this.dispatcher?.enqueue({
        title: 'Higiena Snu: Ostatni posiłek (20:00)',
        body: '3 godziny do snu (23:00). Zakończ przyjmowanie posiłków, zadbaj o nawodnienie i wyciszenie.',
        priority: 'NORMAL'
      });
    }
  }

  private async pingHealth(): Promise<void> {
    try {
      const res = await fetch(`${this.apiGatewayUrl}/system/health`);
      if (res.ok) {
        console.log('[*] SCHEDULER :: Połączenie z API Gateway nominalne.');
      }
    } catch {
      console.warn('[!] SCHEDULER :: API Gateway nie odpowiada na ping zdrowotny.');
    }
  }

  private async syncTrafficTelemetry(): Promise<void> {
    try {
      await fetch(`${this.apiGatewayUrl}/traffic/alerts`);
      console.log('[*] SCHEDULER :: Zaktualizowano telemetrię ruchu drogowego.');
    } catch (err) {
      console.error('[!] SCHEDULER :: Błąd aktualizacji telemetrii ruchu:', err);
    }
  }

  public stop(): void {
    this.timers.forEach((t) => clearInterval(t));
    this.timers = [];
  }
}
