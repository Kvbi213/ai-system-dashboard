import { describe, it, expect } from 'vitest';
import { classifyNotification } from '../src/pushbullet/classifier';

describe('Pushbullet Event Classifier', () => {
  it('identifies bank payment SMS and extracts amount and envelope', () => {
    const raw = 'Płatność kartą: 68,40 PLN w LIDL dnia 30-10-2026';
    const result = classifyNotification('Powiadomienie Bankowe', raw);

    expect(result.type).toBe('TRANSACTION');
    expect(result.amount).toBe(68.40);
    expect(result.envelope).toBe('NEEDS');
  });

  it('identifies task prefix and generates executive task', () => {
    const raw = 'Zadanie: Uruchomić pełny zestaw testów Playwright';
    const result = classifyNotification('Notatka z telefonu', raw);

    expect(result.type).toBe('TASK');
    expect(result.title).toBe('Uruchomić pełny zestaw testów Playwright');
    expect(result.priority).toBe('HIGH');
  });

  it('identifies school notification and extracts subject', () => {
    const raw = 'Librus: Nowa ocena z przedmiotu Bazy Danych SQL: 5';
    const result = classifyNotification('Wiadomość z Synergii', raw);

    expect(result.type).toBe('SCHOOL_ALERT');
    expect(result.subject).toBe('Bazy Danych SQL');
  });
});
