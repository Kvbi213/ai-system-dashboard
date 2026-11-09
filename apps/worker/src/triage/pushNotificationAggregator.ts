import { ClassifiedEvent } from '../pushbullet/classifier.js';

export interface RecordedNotification {
  id: string;
  timestamp: number;
  title: string;
  body: string;
  classified: ClassifiedEvent;
}

export interface TransactionSummaryItem {
  title: string;
  amount: number;
  envelope: 'NEEDS' | 'WANTS' | 'SAVINGS' | 'OTHER';
  timestamp: number;
}

export interface TaskSummaryItem {
  title: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: number;
}

export interface SchoolAlertSummaryItem {
  subject: string;
  raw: string;
  timestamp: number;
}

export interface AggregatedPushSummary {
  windowMinutes: number;
  windowStartMs: number;
  windowEndMs: number;
  totalCount: number;
  transactions: {
    count: number;
    totalAmount: number;
    byEnvelope: {
      NEEDS: number;
      WANTS: number;
      SAVINGS: number;
      OTHER: number;
    };
    items: TransactionSummaryItem[];
  };
  tasks: {
    count: number;
    items: TaskSummaryItem[];
  };
  schoolAlerts: {
    count: number;
    items: SchoolAlertSummaryItem[];
  };
  genericCount: number;
  hasHighPriority: boolean;
}

/**
 * Akumulator i agregator zdarzeń Pushbullet ze smartfona operatora.
 * Zapewnia buforowanie w oknie czasowym (co 15-20 min) z podziałem na kategorie:
 * transakcje finansowe, zadania, alerty szkolne oraz inne.
 */
export class PushNotificationAggregator {
  private events: RecordedNotification[] = [];
  private maxRetainedEvents = 1000;
  private maxRetentionMs = 24 * 60 * 60 * 1000; // 24 godziny
  private lastFlushTimestamp: number = Date.now();

  constructor() {
    this.lastFlushTimestamp = Date.now();
  }

  /**
   * Rejestruje nowe zdarzenie ze strumienia Pushbullet.
   */
  public record(title: string, body: string, classified: ClassifiedEvent): RecordedNotification {
    const item: RecordedNotification = {
      id: `push_ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      title,
      body,
      classified
    };

    this.events.push(item);
    this.pruneBuffer();

    console.log(`[*] AGGREGATOR :: Zarejestrowano zdarzenie [${classified.type}]: "${classified.title || title || 'Powiadomienie'}"`);
    return item;
  }

  /**
   * Zwraca agregację zdarzeń z określonego okna czasowego (domyślnie ostatnie 15 minut).
   */
  public aggregateWindow(windowMinutes = 15): AggregatedPushSummary {
    const now = Date.now();
    const windowStartMs = now - windowMinutes * 60 * 1000;
    const windowEvents = this.events.filter((ev) => ev.timestamp >= windowStartMs && ev.timestamp <= now);

    return this.buildSummary(windowEvents, windowMinutes, windowStartMs, now);
  }

  /**
   * Pobiera raport od ostatniego wywołania flushWindow() lub z ostatnich N minut,
   * po czym aktualizuje znacznik czasu ostatniego cyklu.
   */
  public flushWindow(windowMinutes = 15): AggregatedPushSummary {
    const now = Date.now();
    const windowStartMs = Math.max(this.lastFlushTimestamp, now - windowMinutes * 60 * 1000);
    const windowEvents = this.events.filter((ev) => ev.timestamp >= windowStartMs && ev.timestamp <= now);

    const summary = this.buildSummary(windowEvents, windowMinutes, windowStartMs, now);
    this.lastFlushTimestamp = now;
    return summary;
  }

  /**
   * Pomocnicza funkcja budująca strukturę podsumowania z listy zdarzeń.
   */
  private buildSummary(
    events: RecordedNotification[],
    windowMinutes: number,
    windowStartMs: number,
    windowEndMs: number
  ): AggregatedPushSummary {
    let totalAmount = 0;
    const byEnvelope = {
      NEEDS: 0,
      WANTS: 0,
      SAVINGS: 0,
      OTHER: 0
    };

    const transactionItems: TransactionSummaryItem[] = [];
    const taskItems: TaskSummaryItem[] = [];
    const schoolItems: SchoolAlertSummaryItem[] = [];
    let genericCount = 0;
    let hasHighPriority = false;

    for (const ev of events) {
      const cl = ev.classified;
      if (cl.type === 'TRANSACTION') {
        const amt = cl.amount || 0;
        const env = (cl.envelope as 'NEEDS' | 'WANTS' | 'SAVINGS') || 'OTHER';
        totalAmount += amt;
        byEnvelope[env] = (byEnvelope[env] || 0) + amt;
        transactionItems.push({
          title: cl.title || ev.title || 'Płatność',
          amount: amt,
          envelope: env,
          timestamp: ev.timestamp
        });
      } else if (cl.type === 'TASK') {
        const prio = cl.priority || 'MEDIUM';
        if (prio === 'HIGH') hasHighPriority = true;
        taskItems.push({
          title: cl.title || ev.title || 'Zadanie',
          priority: prio,
          timestamp: ev.timestamp
        });
      } else if (cl.type === 'SCHOOL_ALERT') {
        hasHighPriority = true;
        schoolItems.push({
          subject: cl.subject || 'Librus / Szkoła',
          raw: cl.raw || ev.body || ev.title,
          timestamp: ev.timestamp
        });
      } else {
        genericCount++;
      }
    }

    // Zaokrąglenie sum kwotowych do 2 miejsc po przecinku
    const roundedTotalAmount = Math.round(totalAmount * 100) / 100;
    byEnvelope.NEEDS = Math.round(byEnvelope.NEEDS * 100) / 100;
    byEnvelope.WANTS = Math.round(byEnvelope.WANTS * 100) / 100;
    byEnvelope.SAVINGS = Math.round(byEnvelope.SAVINGS * 100) / 100;
    byEnvelope.OTHER = Math.round(byEnvelope.OTHER * 100) / 100;

    return {
      windowMinutes,
      windowStartMs,
      windowEndMs,
      totalCount: events.length,
      transactions: {
        count: transactionItems.length,
        totalAmount: roundedTotalAmount,
        byEnvelope,
        items: transactionItems
      },
      tasks: {
        count: taskItems.length,
        items: taskItems
      },
      schoolAlerts: {
        count: schoolItems.length,
        items: schoolItems
      },
      genericCount,
      hasHighPriority
    };
  }

  /**
   * Czyści bufor ze zdarzeń przeterminowanych (>24h) lub nadmiarowych (>1000).
   */
  private pruneBuffer(): void {
    const cutoff = Date.now() - this.maxRetentionMs;
    this.events = this.events.filter((ev) => ev.timestamp >= cutoff);
    if (this.events.length > this.maxRetainedEvents) {
      this.events = this.events.slice(-this.maxRetainedEvents);
    }
  }

  public getRecentEvents(limit = 50): RecordedNotification[] {
    return this.events.slice(-limit);
  }

  public getTotalBufferedCount(): number {
    return this.events.length;
  }

  public clear(): void {
    this.events = [];
    this.lastFlushTimestamp = Date.now();
  }
}
