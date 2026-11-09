import { describe, it, expect } from 'vitest';
import {
  decodeMimeHeader,
  classifyEmailHeaders,
  MailScanner
} from '../src/triage/mailScanner.js';
import { PushNotificationAggregator } from '../src/triage/pushNotificationAggregator.js';
import { classifyNotification } from '../src/pushbullet/classifier.js';

describe('Mail Triage & Classifier Engine', () => {
  it('correctly decodes RFC 2047 MIME headers', () => {
    // Base64 UTF-8: "Opłata za serwer"
    const b64 = '=?UTF-8?B?T3DFgmF0YSB6YSBzZXJ3ZXI=?=';
    expect(decodeMimeHeader(b64)).toBe('Opłata za serwer');

    // Quoted-Printable UTF-8
    const qp = '=?UTF-8?Q?Nowa_wiadomo=C5=9B=C4=87?=';
    expect(decodeMimeHeader(qp)).toBe('Nowa wiadomość');

    // Plain text passthrough
    const plain = 'Standardowy temat maila';
    expect(decodeMimeHeader(plain)).toBe(plain);
  });

  it('classifies messages with List-Unsubscribe as SPAM_NEWSLETTER', () => {
    const res = classifyEmailHeaders({
      subject: 'Najlepsze oferty tygodnia',
      from: 'sklep@promocje.pl',
      listUnsubscribe: '<mailto:unsub@promocje.pl>'
    });

    expect(res.category).toBe('SPAM_NEWSLETTER');
    expect(res.reason).toContain('List-Unsubscribe');
  });

  it('classifies Precedence: bulk as SPAM_NEWSLETTER', () => {
    const res = classifyEmailHeaders({
      subject: 'Informator kwartalny',
      from: 'info@portal.pl',
      precedence: 'bulk'
    });

    expect(res.category).toBe('SPAM_NEWSLETTER');
  });

  it('classifies marketing promotional keywords as SPAM_NEWSLETTER', () => {
    const res = classifyEmailHeaders({
      subject: 'Wielka wyprzedaż i kod rabatowy -50%',
      from: 'newsletter@sklep.com'
    });

    expect(res.category).toBe('SPAM_NEWSLETTER');
  });

  it('classifies school / Librus messages as IMPORTANT', () => {
    const res = classifyEmailHeaders({
      subject: 'Nowa wiadomość od wychowawcy',
      from: 'powiadomienia@librus.pl'
    });

    expect(res.category).toBe('IMPORTANT');
    expect(res.reason).toContain('librus');
  });

  it('classifies server and hosting messages as IMPORTANT', () => {
    const res = classifyEmailHeaders({
      subject: 'Koniec ważności serwera Mikrus',
      from: 'kontakt@mikrus.pl'
    });

    expect(res.category).toBe('IMPORTANT');
    expect(res.reason).toContain('mikrus');
  });

  it('classifies invoices and bills as IMPORTANT', () => {
    const res = classifyEmailHeaders({
      subject: 'Faktura VAT nr FV/2026/11/09',
      from: 'ksiegowosc@firma.pl'
    });

    expect(res.category).toBe('IMPORTANT');
  });

  it('classifies standard correspondence as NORMAL', () => {
    const res = classifyEmailHeaders({
      subject: 'Hej, czy możemy omówić projekt jutro?',
      from: 'jan.kowalski@domena.pl'
    });

    expect(res.category).toBe('NORMAL');
  });

  it('MailScanner gracefully degrades when credentials are missing', async () => {
    const scanner = new MailScanner({ user: '', password: '' });
    expect(scanner.isConfigured()).toBe(false);

    const result = await scanner.scanInbox();
    expect(result.isConfigured).toBe(false);
    expect(result.totalUnread).toBe(0);
    expect(result.importantCount).toBe(0);
    expect(result.normalCount).toBe(0);
    expect(result.spamNewsletterCount).toBe(0);
    expect(result.importantMessages).toHaveLength(0);
  });
});

describe('Pushbullet Notification Aggregator', () => {
  it('accumulates and groups notifications within time window', () => {
    const aggregator = new PushNotificationAggregator();

    // 1. Transaction
    const tx = classifyNotification('Bank', 'Płatność kartą: 125,50 PLN w Biedronka');
    aggregator.record('Bank', 'Płatność kartą: 125,50 PLN w Biedronka', tx);

    // 2. Another transaction (WANTS)
    const tx2 = classifyNotification('Bank', 'Płatność kartą: 45,00 PLN w Cinema City');
    aggregator.record('Bank', 'Płatność kartą: 45,00 PLN w Cinema City', tx2);

    // 3. School alert
    const sch = classifyNotification('Synergia', 'Librus: Nowa ocena z przedmiotu Fizyka: 5');
    aggregator.record('Synergia', 'Librus: Nowa ocena z przedmiotu Fizyka: 5', sch);

    // 4. Task
    const tsk = classifyNotification('Note', 'Zadanie: Opłacić serwer Mikrus do piątku');
    aggregator.record('Note', 'Zadanie: Opłacić serwer Mikrus do piątku', tsk);

    // 5. Generic
    const gen = classifyNotification('Info', 'Pogoda na jutro: słonecznie');
    aggregator.record('Info', 'Pogoda na jutro: słonecznie', gen);

    const summary = aggregator.aggregateWindow(15);

    expect(summary.totalCount).toBe(5);
    expect(summary.transactions.count).toBe(2);
    expect(summary.transactions.totalAmount).toBe(170.50);
    expect(summary.transactions.byEnvelope.NEEDS).toBe(125.50);
    expect(summary.transactions.byEnvelope.WANTS).toBe(45.00);

    expect(summary.schoolAlerts.count).toBe(1);
    expect(summary.schoolAlerts.items[0].subject).toBe('Fizyka');

    expect(summary.tasks.count).toBe(1);
    expect(summary.tasks.items[0].title).toBe('Opłacić serwer Mikrus do piątku');

    expect(summary.genericCount).toBe(1);
    expect(summary.hasHighPriority).toBe(true);
  });

  it('flushWindow calculates period summary and updates internal flush baseline', () => {
    const aggregator = new PushNotificationAggregator();

    const tsk = classifyNotification('Note', 'Zadanie: Przygotować prezentację');
    aggregator.record('Note', 'Zadanie: Przygotować prezentację', tsk);

    const flushed = aggregator.flushWindow(15);
    expect(flushed.totalCount).toBe(1);
    expect(flushed.tasks.count).toBe(1);

    // Drugi flush od razu bez nowych zdarzeń powinien mieć 0 elementów
    const secondFlush = aggregator.flushWindow(15);
    expect(secondFlush.totalCount).toBe(0);
  });
});
