import { PushbulletDispatcher } from '../pushbullet/dispatcher.js';
import { LessonAlertMonitor } from '../automation/lessonAlertMonitor.js';
import { LibrusAutoScraper } from '../automation/librusAutoScraper.js';
import { getWarsawTime } from '../automation/timeUtils.js';
import { MailScanner, MailTriageResult } from '../triage/mailScanner.js';
import { PushNotificationAggregator, AggregatedPushSummary } from '../triage/pushNotificationAggregator.js';

export class SystemScheduler {
  private timers: NodeJS.Timeout[] = [];
  private apiGatewayUrl: string;
  private dispatcher?: PushbulletDispatcher;
  private lessonAlertMonitor: LessonAlertMonitor;
  private librusScraper: LibrusAutoScraper;
  private mailScanner: MailScanner;
  private pushAggregator: PushNotificationAggregator;
  private triageIntervalMinutes: number;

  // Master Clock & Continuous Drift-Compensated Chronometer
  private lastSyncedServerTimeMs: number = Date.now();
  private lastSyncTimestampMs: number = Date.now();
  private minuteTickCount: number = 0;

  constructor(
    apiGatewayUrl = 'http://localhost:5000/api',
    dispatcher?: PushbulletDispatcher,
    mailScanner?: MailScanner,
    pushAggregator?: PushNotificationAggregator
  ) {
    this.apiGatewayUrl = apiGatewayUrl;
    this.dispatcher = dispatcher;
    this.lessonAlertMonitor = new LessonAlertMonitor({
      apiGatewayUrl: this.apiGatewayUrl,
      dispatcher: this.dispatcher
    });
    this.librusScraper = new LibrusAutoScraper({
      apiGatewayUrl: this.apiGatewayUrl,
      dispatcher: this.dispatcher
    });
    this.mailScanner = mailScanner || new MailScanner();
    this.pushAggregator = pushAggregator || new PushNotificationAggregator();
    this.triageIntervalMinutes = parseInt(process.env.TRIAGE_INTERVAL_MINUTES || '15', 10);
  }

  public setMailScanner(mailScanner: MailScanner): void {
    this.mailScanner = mailScanner;
  }

  public setPushAggregator(pushAggregator: PushNotificationAggregator): void {
    this.pushAggregator = pushAggregator;
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

    // 5. Start Anti-Bot Jitter Scraper dla Librusa
    this.librusScraper.start();

    // 6. Cykliczny moduł Mail Triage & Pushbullet Aggregator (co 15-20 min)
    const triageTimer = setInterval(() => {
      this.runTriageCycle().catch((err) => {
        console.error('[!] TRIAGE :: Błąd cyklu triage:', err);
      });
    }, this.triageIntervalMinutes * 60 * 1000);
    this.timers.push(triageTimer);

    // Initial warm-up ping
    this.pingHealth();
  }

  /**
   * Wykonuje deterministyczny cykl Triage (analiza poczty IMAP + agregacja powiadomień ze smartfona).
   */
  public async runTriageCycle(): Promise<void> {
    console.log(`[*] TRIAGE :: Rozpoczynanie cyklicznej analizy poczty i powiadomień (okno ${this.triageIntervalMinutes} min)...`);

    // 1. Skanowanie poczty IMAP
    let mailTriage: MailTriageResult = {
      totalUnread: 0,
      importantCount: 0,
      normalCount: 0,
      spamNewsletterCount: 0,
      importantMessages: [],
      isConfigured: false,
      scannedAt: Date.now(),
      items: []
    };

    try {
      mailTriage = await this.mailScanner.scanInbox();
    } catch (err) {
      console.error('[!] TRIAGE :: Błąd skanowania poczty IMAP:', err);
    }

    // 2. Agregacja zdarzeń Pushbullet ze smartfona
    const pushSummary: AggregatedPushSummary = this.pushAggregator.flushWindow(this.triageIntervalMinutes);

    const hasNewMail = mailTriage.totalUnread > 0;
    const hasPushEvents = pushSummary.totalCount > 0;
    const hasCriticalItems = mailTriage.importantCount > 0 || pushSummary.hasHighPriority;

    if (!hasNewMail && !hasPushEvents) {
      console.log(`[*] TRIAGE :: Cykl zakończony. Brak nowych maili oraz powiadomień w oknie ${this.triageIntervalMinutes}m.`);
      return;
    }

    // 3. Generowanie zwięzłego raportu
    const reportLines: string[] = [];

    // Podsumowanie Poczty
    if (mailTriage.isConfigured && mailTriage.totalUnread > 0) {
      reportLines.push(`POCZTA: ${mailTriage.totalUnread} nieprzeczytanych (Ważne: ${mailTriage.importantCount}, Zwykłe: ${mailTriage.normalCount}, Spam: ${mailTriage.spamNewsletterCount})`);
      if (mailTriage.importantMessages.length > 0) {
        for (const msg of mailTriage.importantMessages.slice(0, 3)) {
          reportLines.push(`- [WAŻNE] ${msg.subject} (od: ${msg.from})`);
        }
      }
    }

    // Podsumowanie Powiadomień ze smartfona
    if (pushSummary.totalCount > 0) {
      reportLines.push(`POWIADOMIENIA (${this.triageIntervalMinutes}m): ${pushSummary.totalCount} zdarzeń`);

      if (pushSummary.transactions.count > 0) {
        reportLines.push(`- Wydatki: ${pushSummary.transactions.totalAmount.toFixed(2)} PLN (${pushSummary.transactions.count} transakcji)`);
        for (const tx of pushSummary.transactions.items.slice(0, 2)) {
          reportLines.push(`  * ${tx.title}: ${tx.amount.toFixed(2)} PLN [${tx.envelope}]`);
        }
      }

      if (pushSummary.schoolAlerts.count > 0) {
        for (const sch of pushSummary.schoolAlerts.items.slice(0, 2)) {
          reportLines.push(`- [SZKOŁA] ${sch.subject}`);
        }
      }

      if (pushSummary.tasks.count > 0) {
        for (const tsk of pushSummary.tasks.items.slice(0, 2)) {
          reportLines.push(`- [ZADANIE] ${tsk.title}`);
        }
      }
    }

    const reportBody = reportLines.join('\n');
    console.log(`[*] TRIAGE RAPORT:\n${reportBody}`);

    // 4. Wypchnięcie przez PushbulletDispatcher
    if (this.dispatcher && reportLines.length > 0) {
      const title = hasCriticalItems
        ? `[ALERT] OmniDash Triage (${this.triageIntervalMinutes}m)`
        : `[INFO] OmniDash Triage (${this.triageIntervalMinutes}m)`;

      this.dispatcher.enqueue({
        title,
        body: reportBody,
        priority: hasCriticalItems ? 'HIGH' : 'NORMAL'
      });
    }
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
    const warsaw = getWarsawTime(date);
    const formattedTime = date.toLocaleTimeString('pl-PL', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return { epochMs: currentEpoch, date, formattedTime };
  }

  /**
   * Wyzwalane co minutę: oblicza bieżący czas i sprawdza harmonogram zadań.
   */
  private tickMinuteChronometer(): void {
    this.minuteTickCount++;
    const { date } = this.getCurrentMonotonicTime();
    const warsaw = getWarsawTime(date);
    const minutes = warsaw.minutes;
    const hours = warsaw.hours;

    // Log telemetryczny weryfikacji minuty (w strefie Europe/Warsaw)
    console.log(`[*] TICK :: [${warsaw.formattedTime}] Minuta operacyjna: ${warsaw.formattedTime}`);

    // Sprawdzenie zakończenia lekcji lub bloków dnia o pełnych minutach
    this.evaluateMinuteScheduleEvents(hours, minutes);

    // Automatyczny monitor lekcji i dzwonków szkolnych (Pushbullet Alert)
    this.lessonAlertMonitor.checkAndDispatch(date).then((res) => {
      // Data-driven trigger: po dzwonku na przerwę nauczyciele wprowadzają oceny
      if (res.dispatched && res.alertType === 'LESSON_END_5MIN') {
        setTimeout(() => {
          this.librusScraper.triggerBreakScrape('LESSON_ENDED_BREAK_WINDOW');
        }, 5 * 60 * 1000 + 30 * 1000);
      }
    }).catch((err) => {
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
    this.librusScraper.stop();
  }
}
