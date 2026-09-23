/**
 * Moduł pomocniczy do normalizacji, rozwiązywania i dopasowywania danych nauczycieli.
 * Czysty moduł JavaScript (bez zależności środowiskowych Node.js/browser) dla pełnej
 * interoperacyjności pomiędzy frontendem React (Vite) a backendem Express/Librus.
 */

export const TEACHER_INITIALS_MAP = {
  'AN': 'Negowska Alicja',
  'NA': 'Negowska Alicja',
  'PW': 'Wojnarowski Przemysław',
  'WP': 'Wojnarowski Przemysław',
  'KP': 'Kolasińska Paulina',
  'PK': 'Kolasińska Paulina',
  'AC': 'Czarna Alicja',
  'CA': 'Czarna Alicja',
  'GŁ': 'Łysakowski Grzegorz',
  'ŁG': 'Łysakowski Grzegorz',
  'GL': 'Łysakowski Grzegorz',
  'LG': 'Łysakowski Grzegorz',
  'ZJ': 'Ziemba Joanna',
  'JZ': 'Ziemba Joanna',
  'ZB': 'Bahr Zbigniew',
  'BZ': 'Bahr Zbigniew',
  'KŁ': 'Kryła Łukasz',
  'ŁK': 'Kryła Łukasz',
  'BG': 'Gembiak Bartosz',
  'GB': 'Gembiak Bartosz',
  'WW': 'Wardyn Wojciech',
  'PS': 'Sokół Paweł',
  'SP': 'Sokół Paweł',
  'JŁ': 'Łukaszczyk-Wulgaris Joanna',
  'ŁJ': 'Łukaszczyk-Wulgaris Joanna',
  'JL': 'Łukaszczyk-Wulgaris Joanna',
  'LJ': 'Łukaszczyk-Wulgaris Joanna',
  'SR': 'Reszka Sławomir',
  'RS': 'Reszka Sławomir',
  'AB': 'Becker Adam',
  'BA': 'Becker Adam',
  'MS': 'Spych Monika',
  'SM': 'Spych Monika',
  'MG': 'Gizela Maciej',
  'GM': 'Gizela Maciej',
  'BC': 'Chyła Beata',
  'CB': 'Chyła Beata',
  'KL': 'Lorenz Krzysztof',
  'LK': 'Lorenz Krzysztof',
  'PA': 'Prabucki Andrzej',
  'AP': 'Prabucki Andrzej'
};

export const COMMON_FIRST_NAMES = new Set([
  'adam', 'alicja', 'andrzej', 'anna', 'bartosz', 'beata', 'grzegorz', 'jan', 
  'joanna', 'krzysztof', 'łukasz', 'maciej', 'monika', 'paulina', 'paweł', 
  'piotr', 'przemysław', 'sławomir', 'wojciech', 'zbigniew'
]);

/**
 * Czyści surowy ciąg nauczyciela z dopisków grup, klas, sal i stopni naukowych.
 * @param {string} rawTeacher 
 * @returns {string}
 */
export function cleanTeacherName(rawTeacher) {
  if (!rawTeacher || typeof rawTeacher !== 'string') return '';
  const cleaned = rawTeacher
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*-\s*gr\s*\d+/gi, '')
    .replace(/\s*gr\s*\.?\s*\d+/gi, '')
    .replace(/(?:^|\s)(?:mgr|inż|dr|prof|hab|p)\.?(?=\s|$)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const upper = cleaned.toUpperCase();
  if (TEACHER_INITIALS_MAP[upper]) {
    return TEACHER_INITIALS_MAP[upper];
  }
  return cleaned;
}

/**
 * Rozwija skróty/inicjały nauczyciela do pełnego imienia i nazwiska.
 * @param {string} rawTeacher 
 * @returns {string}
 */
export function resolveFullTeacherName(rawTeacher) {
  if (!rawTeacher || typeof rawTeacher !== 'string') return '';
  const trimmed = rawTeacher.trim();
  const upper = trimmed.toUpperCase();
  if (TEACHER_INITIALS_MAP[upper]) {
    return TEACHER_INITIALS_MAP[upper];
  }
  return cleanTeacherName(rawTeacher);
}

/**
 * Sprawdza czy dwie reprezentacje nauczyciela odnoszą się do tej samej osoby.
 * Eliminuje fałszywe dopasowania po samym imieniu (np. Alicja Czarna vs Alicja Negowska)
 * oraz błędy dopasowania podciągów (np. "AN" vs "Prabucki Andrzej").
 * @param {string} teacherA 
 * @param {string} teacherB 
 * @returns {boolean}
 */
export function matchTeacherNames(teacherA, teacherB) {
  const cleanA = resolveFullTeacherName(teacherA).toLowerCase();
  const cleanB = resolveFullTeacherName(teacherB).toLowerCase();
  if (!cleanA || !cleanB) return false;
  if (cleanA === cleanB) return true;

  // Rozbij na tokeny słowne (odrzucamy znaki interpunkcyjne)
  const wordsA = cleanA.split(/[\s,.-]+/).filter(w => w.length >= 2);
  const wordsB = cleanB.split(/[\s,.-]+/).filter(w => w.length >= 2);

  if (wordsA.length === 0 || wordsB.length === 0) return false;

  // Zbiór wspólnych pełnych słów
  const commonWords = wordsA.filter(w => wordsB.includes(w));

  // Gdy oba ciągi mają co najmniej 2 słowa (imię i nazwisko):
  // Wymagamy obecności obu słów (np. "Negowska Alicja" i "Alicja Negowska")
  if (wordsA.length >= 2 && wordsB.length >= 2) {
    return commonWords.length >= 2;
  }

  // Gdy jeden ciąg to tylko jedno słowo (np. samo nazwisko "Wojnarowski"):
  if (commonWords.length >= 1) {
    const matchedWord = commonWords[0];
    if (COMMON_FIRST_NAMES.has(matchedWord)) {
      return false; // Nie łączymy osób o różnym nazwisku tylko dlatego, że mają tak samo na imię
    }
    return matchedWord.length >= 4; // Dopasowanie po unikalnym nazwisku
  }

  return false;
}
