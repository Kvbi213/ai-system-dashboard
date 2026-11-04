import { describe, it, expect } from 'vitest';
import { parseLibrusDate, parseSafeAverage, sanitizeEventInfo, parseEventId } from '../src/db/store.js';
import { TEMP_EVENT_ID } from '../src/db/types.js';

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

describe('store utils: sanitizeEventInfo', () => {
  it('strips html tags and decodes common html entities', () => {
    expect(sanitizeEventInfo('<script>alert(1)</script>Kartkówka')).toBe('alert(1)Kartkówka');
    expect(sanitizeEventInfo('<b>Sprawdzian</b> &amp; kartkówka')).toBe('Sprawdzian & kartkówka');
    expect(sanitizeEventInfo('Matematyka &lt;rozszerzona&gt;')).toBe('Matematyka <rozszerzona>');
    expect(sanitizeEventInfo('Dział: &quot;Wielomiany&quot;')).toBe('Dział: "Wielomiany"');
  });

  it('returns undefined for empty, null, or undefined', () => {
    expect(sanitizeEventInfo(null)).toBeUndefined();
    expect(sanitizeEventInfo(undefined)).toBeUndefined();
    expect(sanitizeEventInfo('   ')).toBeUndefined();
    expect(sanitizeEventInfo('<b></b>')).toBeUndefined();
  });
});

describe('store utils: parseEventId', () => {
  it('converts positive numeric string to number', () => {
    expect(parseEventId('3463302')).toBe(3463302);
    expect(parseEventId(12345)).toBe(12345);
  });

  it('preserves special temporary event ID as string', () => {
    expect(parseEventId('-1')).toBe(TEMP_EVENT_ID);
    expect(parseEventId(TEMP_EVENT_ID)).toBe(TEMP_EVENT_ID);
  });

  it('preserves non-numeric strings or returns TEMP_EVENT_ID for invalid', () => {
    expect(parseEventId('custom_event_99')).toBe('custom_event_99');
    expect(parseEventId(null)).toBe(TEMP_EVENT_ID);
    expect(parseEventId(undefined)).toBe(TEMP_EVENT_ID);
    expect(parseEventId('')).toBe(TEMP_EVENT_ID);
  });
});
