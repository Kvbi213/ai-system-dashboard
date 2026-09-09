/**
 * Utility functions for precise Warsaw (Poland) timezone calculations and formatting.
 * Ensures consistent temporal anchoring across client, serverless functions, and AI prompts.
 */

export const WARSAW_TIMEZONE = 'Europe/Warsaw';

const PL_DAY_TO_ENG = {
  'niedziela': 'sunday',
  'poniedziałek': 'monday',
  'wtorek': 'tuesday',
  'środa': 'wednesday',
  'czwartek': 'thursday',
  'piątek': 'friday',
  'sobota': 'saturday'
};

/**
 * Returns formatted time in Warsaw timezone.
 * @param {Date|number|string} date 
 * @param {boolean} includeSeconds 
 * @returns {string} e.g. "14:30:15" or "14:30"
 */
export function getWarsawTimeString(date = new Date(), includeSeconds = false) {
  const d = date instanceof Date ? date : new Date(date);
  const options = {
    timeZone: WARSAW_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  if (includeSeconds) {
    options.second = '2-digit';
  }
  return d.toLocaleTimeString('pl-PL', options);
}

/**
 * Returns ISO-like date string (YYYY-MM-DD) in Warsaw timezone.
 * @param {Date|number|string} date 
 * @returns {string} e.g. "2026-09-09"
 */
export function getWarsawDateString(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: WARSAW_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(d);
}

/**
 * Resolves day of week in Polish and English for a given date in Warsaw timezone.
 * @param {Date|number|string} date 
 * @returns {{ polish: string, english: string, isWeekend: boolean }}
 */
export function getWarsawDayOfWeek(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const plDay = d.toLocaleDateString('pl-PL', { weekday: 'long', timeZone: WARSAW_TIMEZONE }).toLowerCase();
  const engDay = PL_DAY_TO_ENG[plDay] || 'monday';
  const isWeekend = engDay === 'saturday' || engDay === 'sunday';
  return {
    polish: plDay,
    english: engDay,
    isWeekend
  };
}

/**
 * Generates an enriched temporal context block for AI reasoning prompts.
 * @param {number|Date} timestamp 
 * @returns {Object} Structured temporal context
 */
export function generateTemporalContext(timestamp = Date.now()) {
  const d = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const timeStr = getWarsawTimeString(d, true);
  const dateStr = getWarsawDateString(d);
  const dayInfo = getWarsawDayOfWeek(d);

  return {
    timeZone: WARSAW_TIMEZONE,
    date: dateStr,
    time: timeStr,
    weekdayPolish: dayInfo.polish,
    weekdayEnglish: dayInfo.english,
    isWeekend: dayInfo.isWeekend,
    promptSummary: `Dziś jest ${dayInfo.polish}, ${dateStr}, godzina ${timeStr} (strefa ${WARSAW_TIMEZONE}).`
  };
}
