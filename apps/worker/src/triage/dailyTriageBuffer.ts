import { ScannedEmailItem } from './mailScanner.js';
import { RecordedNotification } from './pushNotificationAggregator.js';

export interface DayBufferedEmail {
  id: string;
  subject: string;
  from: string;
  date?: string;
  category: string;
  timestamp: number;
}

/**
 * Bufor dzienny zdarzeń w workerze.
 * Gromadzi maile, powiadomienia i transakcje przez cały dzień,
 * aby o godzinie 22:00 przekazać je do syntezy przez model językowy AI.
 */
export class DailyTriageBuffer {
  private emails: Map<string, DayBufferedEmail> = new Map();
  private maxRetentionMs = 36 * 60 * 60 * 1000; // 36 godzin
  private lastDigestRunDate: string = '';

  /**
   * Dodaje unikalne maile do dziennego bufora (deduplikacja po subject + from lub id).
   */
  public recordEmails(items: ScannedEmailItem[]): void {
    const now = Date.now();
    for (const item of items) {
      const key = `${item.from}_${item.subject}`.toLowerCase();
      if (!this.emails.has(key)) {
        this.emails.set(key, {
          id: item.id,
          subject: item.subject,
          from: item.from,
          date: item.date,
          category: item.category,
          timestamp: now
        });
        console.log(`[*] DAILY_BUFFER :: Zarejestrowano maila do wieczornego digestu: "${item.subject}" (od: ${item.from})`);
      }
    }
    this.prune();
  }

  /**
   * Zwraca listę wszystkich zebranych maili z bieżącego dnia.
   */
  public getDayEmails(): DayBufferedEmail[] {
    return Array.from(this.emails.values());
  }

  /**
   * Sprawdza, czy dla danego klucza daty wygenerowano już dzisiejszy wieczorny digest.
   */
  public hasDigestRunToday(dateKey: string): boolean {
    return this.lastDigestRunDate === dateKey;
  }

  public markDigestRunToday(dateKey: string): void {
    this.lastDigestRunDate = dateKey;
  }

  /**
   * Czyści bufor po pomyślnym wygenerowaniu wieczornego podsumowania.
   */
  public clearDay(): void {
    this.emails.clear();
    console.log('[*] DAILY_BUFFER :: Wyczyszczono bufor po wieczornym podsumowaniu dnia.');
  }

  private prune(): void {
    const cutoff = Date.now() - this.maxRetentionMs;
    for (const [key, item] of this.emails.entries()) {
      if (item.timestamp < cutoff) {
        this.emails.delete(key);
      }
    }
  }
}

export const dailyTriageBuffer = new DailyTriageBuffer();
