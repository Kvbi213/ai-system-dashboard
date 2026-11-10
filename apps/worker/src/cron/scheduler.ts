import { PushbulletDispatcher } from '../pushbullet/dispatcher.js';
import { LessonAlertMonitor } from '../automation/lessonAlertMonitor.js';
import { LibrusAutoScraper } from '../automation/librusAutoScraper.js';
import { getWarsawTime } from '../automation/timeUtils.js';
import { MailScanner, MailTriageResult } from '../triage/mailScanner.js';
import { PushNotificationAggregator, AggregatedPushSummary } from '../triage/pushNotificationAggregator.js';
import { dailyTriageBuffer } from '../triage/dailyTriageBuffer.js';

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
   * Wykonuje pasywny cykl zbierania danych Triage (skanowanie poczty IMAP + buforowanie zdarzeń).
   * Zdarzenia są agregowane w buforze dziennym na potrzeby wieczornego podsumowania AI (godz. 22:00),
   * bez uciążliwego wysyłania powiadomień Pushbullet co 15 minut.
   */
  public async runTriageCycle(): Promise<void> {
    console.log(`[*] TRIAGE :: Rozpoczynanie pasywnego skanowania poczty i powiadomień (okno ${this.triageIntervalMinutes} min)...`);

    // 1. Skanowanie poczty IMAP i rejestracja w dziennym buforze
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
      if (mailTriage.items && mailTriage.items.length > 0) {
        dailyTriageBuffer.recordEmails(mailTriage.items);
      }
    } catch (err) {
      console.error('[!] TRIAGE :: Błąd skanowania poczty IMAP:', err);
    }

    // 2. Odczyt stanu agregatora powiadomień ze smartfona
    const pushSummary: AggregatedPushSummary = this.pushAggregator.flushWindow(this.triageIntervalMinutes);
    const dayEmailsCount = dailyTriageBuffer.getDayEmails().length;
    const totalBufferedPushes = this.pushAggregator.getTotalBufferedCount();

    console.log(`[*] TRIAGE :: Pasywny cykl zakończony. Bufor dzienny: ${dayEmailsCount} maili, ${totalBufferedPushes} powiadomień ze smartfona. Okresowy spam co 15m: WYŁĄCZONY (przygotowanie na wieczorny digest 22:00).`);
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

    // Wieczorny Przegląd Dnia AI (godz. 22:00 w strefie Europe/Warsaw)
    if (hours === 22 && minutes === 0) {
      const { date } = this.getCurrentMonotonicTime();
      const warsaw = getWarsawTime(date);
      if (!dailyTriageBuffer.hasDigestRunToday(warsaw.dateKey)) {
        dailyTriageBuffer.markDigestRunToday(warsaw.dateKey);
        console.log(`[*] EVENING_DIGEST :: Osiągnięto godzinę 22:00 (${warsaw.dateKey}) — wyzwalanie wieczornego podsumowania AI.`);
        this.triggerEveningDigest(date).catch((err) => {
          console.error('[!] Błąd wyzwalania wieczornego digestu 22:00:', err);
        });
      }
    }
  }

  /**
   * Wyzwala generowanie wieczornego podsumowania AI z zebranego całodziennego bufora.
   */
  public async triggerEveningDigest(customDate?: Date): Promise<void> {
    console.log('[*] EVENING_DIGEST :: Przygotowywanie całodziennych danych do syntezy przez model AI...');

    const dayEmails = dailyTriageBuffer.getDayEmails();
    const dayPush = this.pushAggregator.aggregateDay(24);
    const allBufferedPushes = this.pushAggregator.getAllBufferedEvents();

    const payload = {
      customEvents: {
        emails: dayEmails.map((e) => ({
          subject: e.subject,
          from: e.from,
          date: e.date,
          category: e.category
        })),
        transactions: dayPush.transactions.items,
        tasks: dayPush.tasks.items,
        schoolAlerts: dayPush.schoolAlerts.items,
        pushNotifications: allBufferedPushes.map((p) => ({
          title: p.title,
          body: p.body,
          type: p.classified.type,
          amount: p.classified.amount
        }))
      },
      sendPush: true,
      simulatedDate: customDate ? customDate.toISOString() : undefined
    };

    try {
      const res = await fetch(`${this.apiGatewayUrl}/automation/evening-digest/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev-operator-token'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json() as any;
        console.log(`[+] SUCCESS :: Wieczorny digest AI wygenerowany pomyślnie przez API Gateway (id: ${data.digest?.id}).`);
        dailyTriageBuffer.clearDay();
        return;
      } else {
        const errText = await res.text();
        console.warn(`[!] Ostrzeżenie: API Gateway zwrócił błąd digestu (${res.status}): ${errText}`);
      }
    } catch (err) {
      console.error('[!] Błąd połączenia z API Gateway podczas wieczornego digestu:', err);
    }

    // Fallback: jeśli API Gateway jest niedostępny, wyślij podsumowanie bezpośrednio przez lokalny dyspozytor
    if (this.dispatcher) {
      const totalSpent = dayPush.transactions.totalAmount;
      const fallbackBody = [
        `🌙 Wieczorny Przegląd Dnia (Tryb bezpośredni workera):`,
        `- Poczta: ${dayEmails.length} wiadomości z dnia`,
        `- Finanse: ${dayPush.transactions.count} transakcji (łącznie ${totalSpent.toFixed(2)} PLN)`,
        `- Zadania: ${dayPush.tasks.count} zarejestrowanych zadań`,
        `- Szkoła: ${dayPush.schoolAlerts.count} alertów`,
        `Spokojnego wieczoru i dobrej nocy!`
      ].join('\n');

      this.dispatcher.enqueue({
        title: '🌙 Wieczorny Przegląd Dnia (22:00)',
        body: fallbackBody,
        priority: 'NORMAL'
      });
      dailyTriageBuffer.clearDay();
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
