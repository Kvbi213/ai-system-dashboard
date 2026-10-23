export const DEFAULT_OVERALL_AVG = 4.62;
export const HONORS_THRESHOLD = 4.75;
export const MAX_GRADE = 6.00;

export const NEUTRAL_GRADE_TOKENS = new Set(['-', 'NP', 'BZ', 'NB', 'ZW']);
export const ALLOWED_SIM_GRADES = new Set(['6', '5.5', '5', '4.5', '4', '3']);
export const ALLOWED_SIM_WEIGHTS = new Set(['3', '2', '1']);

/**
 * Safely converts any value to a finite number or null.
 * @param {unknown} v 
 * @returns {number|null}
 */
export const toFiniteNumber = (v) => {
  if (v === null || v === undefined || typeof v === 'boolean' || typeof v === 'symbol' || typeof v === 'function' || typeof v === 'object') {
    return null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * Validate average – optionally allow zero.
 * @param {unknown} v
 * @param {boolean} [allowZero=false]
 * @returns {boolean}
 */
export const isValidAverage = (v, allowZero = false) => {
  const n = toFiniteNumber(v);
  if (n === null) return false;
  return allowZero ? n >= 0 : n > 0;
};

/**
 * Determines whether a grade represents a neutral attendance or non-numeric token.
 * @param {unknown} val 
 * @returns {boolean}
 */
export const isNeutralGrade = (val) => {
  if (typeof val !== 'string') return false;
  const clean = val.trim().toUpperCase();
  return NEUTRAL_GRADE_TOKENS.has(clean);
};

/**
 * Safely extracts numeric grade weight from details object.
 * @param {object|null|undefined} details 
 * @returns {number}
 */
export const getGradeWeight = (details) => {
  if (!details || typeof details !== 'object' || Array.isArray(details)) return 1;
  const raw = details.weight;
  if (raw !== undefined && raw !== null && raw !== '') {
    const num = Number(raw);
    if (Number.isFinite(num) && num >= 0) return num;
  }
  return 1;
};

/**
 * Resolves uppercase subject code prefix.
 * Returns null if name is not a valid string or empty.
 * @param {unknown} name 
 * @returns {string|null}
 */
export const getSubjectCode = (name) => {
  if (typeof name !== 'string') return null;
  const n = name.trim().toLowerCase();
  if (!n) return null;
  if (/informatyk|programow/i.test(n)) return 'INF-SYS-01';
  if (/matematyk/i.test(n)) return 'MAT-ADV-02';
  if (/fizyk|mechatron/i.test(n)) return 'PHY-MCH-03';
  if (/angielsk/i.test(n)) return 'LNG-ENG-C1';
  if (/przedsiębiorcz|zarządz/i.test(n)) return 'ECO-MGT-05';
  if (/algorytm|struktur/i.test(n)) return 'CS-ALG-06';
  if (/polsk/i.test(n)) return 'HUM-POL-07';
  if (/histori/i.test(n)) return 'HIS-PL-08';
  if (/sieci/i.test(n)) return 'NET-LOC-09';
  if (/systemy/i.test(n)) return 'SYS-LIN-10';
  if (/urządzen/i.test(n)) return 'HW-TECH-11';
  return null;
};

/**
 * Returns CSS classes for grade badge pill in Obsidian Minimalist Dark & Stitch style.
 * @param {unknown} val 
 * @returns {string}
 */
export const getGradeBadgeStyle = (val) => {
  if (val === null || val === undefined || (typeof val !== 'string' && typeof val !== 'number')) {
    return 'bg-surface-container text-outline border-dashed border-outline-variant/50 hover:bg-surface-container-high';
  }
  const s = String(val).trim().toUpperCase();
  if (!s) {
    return 'bg-surface-container text-outline border-dashed border-outline-variant/50 hover:bg-surface-container-high';
  }

  // 1. Tokeny neutralne i specjalne w pierwszej kolejności
  if (isNeutralGrade(s)) {
    return 'bg-surface-container-high text-on-surface-variant border-border/80 hover:bg-surface-container';
  }
  if (s === '+') {
    return 'bg-secondary/15 text-secondary border-secondary/30 hover:bg-secondary/25';
  }

  // 2. Oceny numeryczne i nieklasyfikowane (N)
  if (s.startsWith('6')) {
    return 'bg-primary/10 text-primary border-primary/30 shadow-[0_0_8px_rgba(77,142,255,0.25)] hover:bg-primary/20';
  }
  if (s.startsWith('5')) {
    return 'bg-surface-container-high text-on-surface border-border/80 hover:bg-surface-bright';
  }
  if (s.startsWith('4')) {
    return 'bg-tertiary/10 text-tertiary border-tertiary/30 hover:bg-tertiary/20';
  }
  if (s.startsWith('3')) {
    return 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20';
  }
  if (s.startsWith('2')) {
    return 'bg-orange-500/10 text-orange-300 border-orange-500/30 hover:bg-orange-500/20';
  }
  if (s.startsWith('1') || s === 'N') {
    return 'bg-error-container/30 text-error border-error/40 hover:bg-error-container/40 font-bold';
  }

  return 'bg-surface-container text-on-surface border-border hover:bg-surface-container-high';
};
