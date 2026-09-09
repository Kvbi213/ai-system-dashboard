import { describe, it, expect } from 'vitest';
import {
  WARSAW_TIMEZONE,
  getWarsawTimeString,
  getWarsawDateString,
  getWarsawDayOfWeek,
  generateTemporalContext
} from '../modules/services/timeUtils.js';

describe('Warsaw Timezone & Temporal Cognition Utilities', () => {
  it('should guarantee WARSAW_TIMEZONE constant is Europe/Warsaw', () => {
    expect(WARSAW_TIMEZONE).toBe('Europe/Warsaw');
  });

  it('should format ISO dates into Warsaw YYYY-MM-DD date string', () => {
    // 2026-09-09T10:00:00Z -> Warsaw time is UTC+2 (CEST) -> 2026-09-09
    const testDate = new Date('2026-09-09T10:00:00Z');
    const warsawDate = getWarsawDateString(testDate);
    expect(warsawDate).toBe('2026-09-09');
  });

  it('should format time with 2-hour offset during CEST daylight saving', () => {
    // 2026-06-15T12:00:00Z -> in CEST (UTC+2) is 14:00
    const testDate = new Date('2026-06-15T12:00:00Z');
    const warsawTime = getWarsawTimeString(testDate, false);
    expect(warsawTime).toBe('14:00');
  });

  it('should resolve weekday in Polish and English', () => {
    // 2026-09-09 is a Wednesday (środa)
    const testDate = new Date('2026-09-09T12:00:00Z');
    const dayInfo = getWarsawDayOfWeek(testDate);
    expect(dayInfo.polish).toBe('środa');
    expect(dayInfo.english).toBe('wednesday');
    expect(dayInfo.isWeekend).toBe(false);
  });

  it('should identify weekends properly', () => {
    // 2026-09-12 is a Saturday (sobota)
    const testDate = new Date('2026-09-12T12:00:00Z');
    const dayInfo = getWarsawDayOfWeek(testDate);
    expect(dayInfo.english).toBe('saturday');
    expect(dayInfo.isWeekend).toBe(true);
  });

  it('should generate complete temporal context for AI reasoning', () => {
    const timestamp = new Date('2026-09-09T14:30:00Z').getTime();
    const ctx = generateTemporalContext(timestamp);
    expect(ctx.timeZone).toBe('Europe/Warsaw');
    expect(ctx.date).toBe('2026-09-09');
    expect(ctx.weekdayEnglish).toBe('wednesday');
    expect(ctx.promptSummary).toContain('Europe/Warsaw');
  });
});
