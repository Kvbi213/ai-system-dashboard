import { describe, it, expect } from 'vitest';
import { eveningDigestService } from '../src/domains/automation/eveningDigestService.js';
import { sqliteStore } from '../src/db/sqliteStore.js';

describe('Evening Digest AI Service', () => {
  it('generates a human-like evening digest with collected transactions, tasks, and emails', async () => {
    const customEvents = {
      emails: [
        { subject: 'Faktura za serwer VPS', from: 'kontakt@mikrus.pl', category: 'IMPORTANT' },
        { subject: 'Nowa ocena z Informatyki', from: 'powiadomienia@librus.pl', category: 'IMPORTANT' }
      ],
      transactions: [
        { title: 'Biedronka zakupy spożywcze', amount: 84.30, envelope: 'NEEDS', category: 'Jedzenie' },
        { title: 'Kawa na wynos', amount: 16.50, envelope: 'WANTS', category: 'Przyjemności' }
      ],
      tasks: [
        { title: 'Wdrożenie wieczornego digestu 22:00', completed: true, priority: 'HIGH' },
        { title: 'Przegląd logów Mikrusa', completed: false, priority: 'NORMAL' }
      ],
      schoolAlerts: [
        { subject: 'Sprawdzian z matematyki w czwartek' }
      ]
    };

    const simulatedDate = new Date('2026-11-10T22:00:00.000Z');

    const result = await eveningDigestService.generateDigest({
      customEvents,
      sendPush: false, // w teście nie wysyłamy do Pushbullet
      simulatedDate
    });

    expect(result.success).toBe(true);
    expect(result.digest).toBeDefined();
    expect(result.digest.id).toContain('digest_');
    expect(result.digest.summaryText).toContain('Wieczorny Przegląd Dnia');
    expect(result.digest.summaryText.length).toBeGreaterThan(50);

    // Sprawdzenie zapisu w bazie danych
    const latest = sqliteStore.getLatestEveningDigest();
    expect(latest).not.toBeNull();
    expect(latest?.id).toBe(result.digest.id);

    const history = sqliteStore.getEveningDigests(5);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].id).toBe(result.digest.id);
  });

  it('handles empty day gracefully without errors or empty placeholders', async () => {
    const result = await eveningDigestService.generateDigest({
      customEvents: {
        emails: [],
        transactions: [],
        tasks: [],
        schoolAlerts: []
      },
      sendPush: false,
      simulatedDate: new Date('2026-11-11T22:00:00.000Z')
    });

    expect(result.success).toBe(true);
    expect(result.digest.summaryText).toContain('Wieczorny Przegląd Dnia');
    expect(result.digest.summaryText.length).toBeGreaterThan(30);
  });
});
