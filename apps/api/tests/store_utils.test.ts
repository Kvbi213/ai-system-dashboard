import { describe, it, expect } from 'vitest';
import { parseLibrusDate, parseSafeAverage } from '../src/db/store.js';

describe('store utils: parseLibrusDate', () => {
  it('parses valid ISO date string correctly', () => {
    expect(parseLibrusDate('2026-10-01')).toBe('2026-10-01');
    expect(parseLibrusDate('2026-11-04T12:00:00.000Z')).toBe('2026-11-04');
  });

  it('parses Librus polish day format correctly', () => {
    expect(parseLibrusDate('2026-10-01 (czw.)')).toBe('2026-10-01');
    expect(parseLibrusDate('2026-09-17 (czw.)')).toBe('2026-09-17');
    expect(parseLibrusDate('2026-10-28 (śr.)')).toBe('2026-10-28');
  });

  it('returns undefined for empty, null, or undefined input', () => {
    expect(parseLibrusDate(undefined)).toBeUndefined();
    expect(parseLibrusDate('')).toBeUndefined();
    expect(parseLibrusDate('   ')).toBeUndefined();
  });

  it('returns undefined for invalid date strings without masking', () => {
    expect(parseLibrusDate('niepoprawna-data')).toBeUndefined();
    expect(parseLibrusDate('brak')).toBeUndefined();
  });
});

describe('store utils: parseSafeAverage', () => {
  it('parses valid positive numbers and numeric strings', () => {
    expect(parseSafeAverage(4.13)).toBe(4.13);
    expect(parseSafeAverage('4.5')).toBe(4.5);
    expect(parseSafeAverage('5.00')).toBe(5);
    expect(parseSafeAverage(3.356)).toBe(3.36);
  });

  it('returns undefined for non-positive or invalid numbers', () => {
    expect(parseSafeAverage(0)).toBeUndefined();
    expect(parseSafeAverage(-1)).toBeUndefined();
    expect(parseSafeAverage('0')).toBeUndefined();
    expect(parseSafeAverage('-')).toBeUndefined();
    expect(parseSafeAverage(NaN)).toBeUndefined();
  });

  it('returns undefined for null or undefined', () => {
    expect(parseSafeAverage(null)).toBeUndefined();
    expect(parseSafeAverage(undefined)).toBeUndefined();
  });
});
