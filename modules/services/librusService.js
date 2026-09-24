import Librus from 'librus-api';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeQuery, executeRun } from '../database.js';
import {
  TEACHER_INITIALS_MAP,
  COMMON_FIRST_NAMES,
  cleanTeacherName,
  resolveFullTeacherName,
  matchTeacherNames
} from './teacherUtils.js';

export {
  TEACHER_INITIALS_MAP,
  COMMON_FIRST_NAMES,
  cleanTeacherName,
  resolveFullTeacherName,
  matchTeacherNames
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');
const envPath = path.resolve(rootDir, '.env');

/**
 * Pobiera poświadczenia Librus ze zmiennych środowiskowych lub pliku .env.
 */
export function getLibrusCredentials() {
  let login = process.env.LIBRUS_LOGIN || '';
  let password = process.env.LIBRUS_PASSWORD || '';

  if (!login || !password) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const mLogin = content.match(/^LIBRUS_LOGIN=(.*)$/m);
        const mPass = content.match(/^LIBRUS_PASSWORD=(.*)$/m);
        if (mLogin && mLogin[1]) login = mLogin[1].trim();
        if (mPass && mPass[1]) password = mPass[1].trim();
        if (login) process.env.LIBRUS_LOGIN = login;
        if (password) process.env.LIBRUS_PASSWORD = password;
      }
    } catch {}
  }

  return {
    login: login.trim(),
    password: password.trim(),
    isConfigured: !!(login.trim() && password.trim() && login !== 'twoj-login-librus')
  };
}

/**
 * Zapisuje poświadczenia Librus w pamięci procesu oraz w pliku .env.
 */
export function saveLibrusCredentials(login, password) {
  const cleanLogin = (login || '').trim();
  const cleanPass = (password || '').trim();

  process.env.LIBRUS_LOGIN = cleanLogin;
  process.env.LIBRUS_PASSWORD = cleanPass;

  let envContent = '';
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch {
    envContent = '';
  }

  const updateOrAppend = (key, val) => {
    if (new RegExp(`^${key}=.*`, 'm').test(envContent)) {
      envContent = envContent.replace(new RegExp(`^${key}=.*`, 'm'), `${key}=${val}`);
    } else {
      envContent += `\n${key}=${val}`;
    }
  };

  updateOrAppend('LIBRUS_LOGIN', cleanLogin);
  updateOrAppend('LIBRUS_PASSWORD', cleanPass);

  fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
  console.log('[+] SUCCESS :: LIBRUS :: Zaktualizowano poświadczenia Librus Synergia w .env');
  return { success: true };
}

/**
 * Parsuje ciąg tekstowy info o ocenie na obiekt ze szczegółami.
 * Przykładowy format w Librusie:
 * "Kategoria: Sprawdzian\nData: 2026-03-15\nNauczyciel: J. Kowalski\nWaga: 3\nKomentarz: Dział 3"
 */
export function parseGradeInfo(infoStr) {
  if (!infoStr || typeof infoStr !== 'string') {
    return { category: 'Brak', weight: 1, date: '', teacher: '', comment: '' };
  }

  const details = {
    category: 'Zwykła',
    weight: 1,
    date: '',
    teacher: '',
    comment: '',
    raw: infoStr
  };

  const lines = infoStr.split(/[\r\n]+|<br\s*\/?>/i);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/kategoria:/i.test(trimmed)) {
      details.category = trimmed.replace(/^.*?kategoria:\s*/i, '').trim();
    } else if (/waga:/i.test(trimmed)) {
      const match = trimmed.match(/waga:\s*([0-9.,]+)/i);
      if (match) {
        const parsedW = parseFloat(match[1].replace(',', '.'));
        details.weight = !isNaN(parsedW) ? parsedW : 1;
      }
    } else if (/data:/i.test(trimmed)) {
      details.date = trimmed.replace(/^.*?data:\s*/i, '').trim();
    } else if (/nauczyciel:/i.test(trimmed) || /dodał:/i.test(trimmed)) {
      if (!details.teacher || /nauczyciel:/i.test(trimmed)) {
        details.teacher = trimmed.replace(/^.*?(nauczyciel|dodał):\s*/i, '').trim();
      }
    } else if (/licz do średniej:/i.test(trimmed)) {
      const val = trimmed.replace(/^.*?licz do średniej:\s*/i, '').trim().toLowerCase();
      details.inAverage = !val.startsWith('nie');
    } else if (/komentarz:/i.test(trimmed) || /opis:/i.test(trimmed)) {
      details.comment = trimmed.replace(/^.*?(komentarz|opis):\s*/i, '').trim();
    }
  }

  return details;
}

/**
 * Przelicza numeryczną wartość oceny (obsługuje + i -).
 * np. "5+" -> 5.5, "4-" -> 3.75, "6" -> 6.0
 */
export function parseGradeNumeric(val) {
  if (!val) return null;
  const str = String(val).trim();
  const base = parseFloat(str.replace(/[^\d.]/g, ''));
  if (isNaN(base)) return null;

  if (str.includes('+')) return base + 0.5;
  if (str.includes('-')) return base - 0.25;
  return base;
}

/**
 * Oblicza średnie i metryki dla listy przedmiotów.
 */
export function computeGradeStats(subjects = []) {
  let totalSum = 0;
  let totalWeights = 0;
  let gradedSubjectsCount = 0;
  let highestAverage = { subject: '', average: 0 };
  let lowestAverage = { subject: '', average: 7 };

  const extractGradesList = (sem) => {
    if (!sem) return [];
    if (Array.isArray(sem)) return sem;
    if (Array.isArray(sem.grades)) return sem.grades;
    return [];
  };

  const enrichedSubjects = (subjects || []).map(subj => {
    const rawSem1 = subj.semester?.[0];
    const rawSem2 = subj.semester?.[1];

    const sem1Grades = extractGradesList(rawSem1).map(g => ({
      ...g,
      details: parseGradeInfo(g.info),
      numericValue: parseGradeNumeric(g.value)
    }));

    const sem2Grades = extractGradesList(rawSem2).map(g => ({
      ...g,
      details: parseGradeInfo(g.info),
      numericValue: parseGradeNumeric(g.value)
    }));

    const calcAverage = (gradesList) => {
      let sum = 0;
      let weights = 0;
      for (const g of gradesList) {
        if (g.numericValue !== null && g.details?.inAverage !== false) {
          const w = g.details?.weight || 1;
          sum += g.numericValue * w;
          weights += w;
        }
      }
      return weights > 0 ? parseFloat((sum / weights).toFixed(2)) : null;
    };

    const sem1Avg = parseFloat(rawSem1?.average || rawSem1?.tempAverage) || calcAverage(sem1Grades);
    const sem2Avg = parseFloat(rawSem2?.average || rawSem2?.tempAverage) || calcAverage(sem2Grades);
    
    // Użyj średniej z Librusa lub wyliczonej
    let finalAvg = parseFloat(subj.average || subj.tempAverage || 0);
    if (!finalAvg || isNaN(finalAvg)) {
      const allGrades = [...sem1Grades, ...sem2Grades];
      finalAvg = calcAverage(allGrades) || 0;
    }

    const cleanName = subj.name 
      ? subj.name.charAt(0).toUpperCase() + subj.name.slice(1) 
      : 'Przedmiot';

    if (finalAvg > 0) {
      gradedSubjectsCount++;
      totalSum += finalAvg;
      totalWeights += 1;

      if (finalAvg > highestAverage.average) {
        highestAverage = { subject: cleanName, average: finalAvg };
      }
      if (finalAvg < lowestAverage.average) {
        lowestAverage = { subject: cleanName, average: finalAvg };
      }
    }

    return {
      ...subj,
      name: cleanName,
      sem1Grades,
      sem2Grades,
      sem1Avg,
      sem2Avg,
      computedAverage: finalAvg
    };
  });

  const overallAverage = totalWeights > 0 ? parseFloat((totalSum / totalWeights).toFixed(2)) : 0;

  return {
    subjects: enrichedSubjects,
    overallAverage,
    totalSubjects: (subjects || []).length,
    gradedSubjectsCount,
    highestAverage: highestAverage.average > 0 ? highestAverage : null,
    lowestAverage: lowestAverage.average < 7 ? lowestAverage : null
  };
}

/**
 * Pobiera dane bezpośrednio z Synergia Librus przy użyciu librus-api.
 */
export async function fetchLibrusFromSource(login, password) {
  console.log(`[*] INFO :: LIBRUS :: Inicjalizacja autoryzacji dla użytkownika: ${login}`);
  const client = new Librus();

  await client.authorize(login, password);
  console.log(`[+] SUCCESS :: LIBRUS :: Autoryzacja udana. Pobieranie ocen i danych ucznia...`);

  // Pobierz oceny
  const rawGrades = await client.info.getGrades();

  // Pobierz szczęśliwy numerek (opcjonalnie, z odpornością na ewentualny błąd serwera)
  let luckyNumber = null;
  try {
    luckyNumber = await client.info.getLuckyNumber();
    if (typeof luckyNumber === 'object' && luckyNumber !== null) {
      luckyNumber = luckyNumber.luckyNumber || luckyNumber.number || null;
    }
  } catch (err) {
    console.warn(`[!] ALERT :: LIBRUS :: Nie udało się pobrać szczęśliwego numerka: ${err.message}`);
  }

  // Przetwórz i wzbogać statystykami
  const stats = computeGradeStats(rawGrades || []);

  const payload = {
    subjects: stats.subjects,
    overallAverage: stats.overallAverage,
    totalSubjects: stats.totalSubjects,
    gradedSubjectsCount: stats.gradedSubjectsCount,
    highestAverage: stats.highestAverage,
    lowestAverage: stats.lowestAverage,
    luckyNumber: luckyNumber ? parseInt(luckyNumber, 10) || null : null,
    lastSync: new Date().toISOString()
  };

  // Zapis do bazy SQLite
  try {
    await executeRun(`
      CREATE TABLE IF NOT EXISTS librus_cache (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        data TEXT NOT NULL,
        lucky_number INTEGER,
        last_sync DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'ok',
        error_message TEXT
      )
    `);
    await executeRun(
      `INSERT OR REPLACE INTO librus_cache (id, data, lucky_number, last_sync, status, error_message)
       VALUES (1, ?, ?, datetime('now'), 'ok', NULL)`,
      [JSON.stringify(payload), payload.luckyNumber]
    );
    console.log(`[+] SUCCESS :: LIBRUS :: Zapisano stan ocen do tabeli librus_cache.`);
  } catch (dbErr) {
    console.error(`[!] ERROR :: LIBRUS :: Błąd zapisu do bazy SQLite:`, dbErr.message);
  }

  // Pobierz terminarz szkolny (sprawdziany, kartkówki, nieobecności nauczycieli)
  let calendarPayload = null;
  try {
    calendarPayload = await fetchLibrusCalendarFromSource(client);
    if (calendarPayload && Array.isArray(calendarPayload.events)) {
      await saveCalendarToCache(calendarPayload);
      console.log(`[+] SUCCESS :: LIBRUS :: Zapisano i zreplikowano terminarz szkolny (${calendarPayload.events.length} zdarzeń).`);
    }
  } catch (cErr) {
    console.warn(`[!] ALERT :: LIBRUS :: Pominięto synchronizację terminarza: ${cErr.message}`);
  }

  // Pobierz plan lekcji i skoreluj go z nieobecnościami nauczycieli
  let timetablePayload = null;
  try {
    const rawTt = await fetchLibrusTimetableFromSource(client);
    const correlated = correlateTimetableWithAbsences(rawTt.lessons, calendarPayload?.events || []);
    timetablePayload = {
      hours: rawTt.hours,
      table: rawTt.table,
      lessons: correlated.lessons,
      substitutions: correlated.detectedSubstitutions,
      lastSync: new Date().toISOString()
    };
    await saveTimetableToCache(timetablePayload);
    console.log(`[+] SUCCESS :: LIBRUS :: Zapisano i skorelowano plan lekcji (${correlated.lessons.length} lekcji, ${correlated.detectedSubstitutions.length} zastępstw/absencji).`);
  } catch (tErr) {
    console.warn(`[!] ALERT :: LIBRUS :: Pominięto synchronizację planu lekcji: ${tErr.message}`);
  }

  // Replikacja ocen do Firebase Firestore (dostęp dla omnidash-509607.web.app)
  try {
    const { getFirestoreDb } = await import('../firebase.js');
    const firestoreDb = getFirestoreDb ? getFirestoreDb() : null;
    if (firestoreDb) {
      await firestoreDb.collection('librus_cache').doc('latest').set({
        ...payload,
        updated_at: new Date().toISOString()
      });
      console.log(`[+] SUCCESS :: LIBRUS :: Zreplikowano stan ocen do chmury Firestore (librus_cache/latest).`);
    }
  } catch (fErr) {
    console.warn(`[!] ALERT :: LIBRUS :: Pominięto replikację ocen do Firestore: ${fErr.message}`);
  }

  return { 
    ...payload, 
    calendar: calendarPayload?.events || [],
    timetable: timetablePayload?.lessons || [],
    substitutions: timetablePayload?.substitutions || []
  };
}

/**
 * Zwraca zbuforowane oceny z bazy SQLite.
 */
export async function getCachedGrades() {
  try {
    const rows = await executeQuery('SELECT * FROM librus_cache WHERE id = 1');
    if (rows && rows.length > 0) {
      const row = rows[0];
      const parsedData = JSON.parse(row.data);
      return {
        cached: true,
        lastSync: row.last_sync,
        luckyNumber: row.lucky_number,
        status: row.status,
        errorMessage: row.error_message,
        ...parsedData
      };
    }
  } catch (err) {
    console.error('[!] ERROR :: LIBRUS :: Błąd odczytu librus_cache:', err.message);
  }

  return null;
}

/**
 * Główna funkcja synchronizująca: sprawdza poświadczenia i odświeża cache.
 */
export async function syncLibrusGrades() {
  const creds = getLibrusCredentials();
  if (!creds.isConfigured) {
    console.log('[*] INFO :: LIBRUS :: Poświadczenia nie są skonfigurowane w systemie.');
    return { success: false, error: 'Brak skonfigurowanych poświadczeń Librus Synergia.' };
  }

  try {
    const data = await fetchLibrusFromSource(creds.login, creds.password);
    return { success: true, data };
  } catch (err) {
    const errMsg = err.message || 'Nieznany błąd połączenia z Librus Synergia';
    console.error(`[!] ERROR :: LIBRUS :: Niepowodzenie synchronizacji: ${errMsg}`);

    try {
      await executeRun(
        `UPDATE librus_cache SET status = 'error', error_message = ? WHERE id = 1`,
        [errMsg]
      );
    } catch {}

    return { success: false, error: errMsg };
  }
}

/**
 * Testuje autoryzację do Librusa bez trwałego zapisywania stanu.
 */
export async function testLibrusAuth(login, password) {
  if (!login || !password) {
    throw new Error('Login i hasło są wymagane do autoryzacji.');
  }
  const client = new Librus();
  await client.authorize(login, password);
  return { success: true, message: 'Autoryzacja w Librus Synergia przebiegła pomyślnie.' };
}

/**
 * Zwraca realistyczne dane demonstracyjne (Mock) dla trybu demonstracyjnego.
 */
export function getDemoGradesData() {
  const mockSubjects = [
    {
      name: 'Język polski',
      average: '4.80',
      semester: [
        [
          { id: 101, value: '5', info: 'Kategoria: Sprawdzian\nWaga: 3\nData: 2026-02-14\nNauczyciel: M. Nowak\nKomentarz: Epoka romantyzmu' },
          { id: 102, value: '4+', info: 'Kategoria: Kartkówka\nWaga: 1\nData: 2026-03-02\nNauczyciel: M. Nowak\nKomentarz: Lektura Kordian' },
          { id: 103, value: '5', info: 'Kategoria: Odpowiedź ustna\nWaga: 2\nData: 2026-03-18\nNauczyciel: M. Nowak\nKomentarz: Analiza wiersza' }
        ],
        [
          { id: 104, value: '5-', info: 'Kategoria: Wypracowanie\nWaga: 3\nData: 2026-04-10\nNauczyciel: M. Nowak\nKomentarz: Motyw władzy' },
          { id: 105, value: '5', info: 'Kategoria: Praca na lekcji\nWaga: 1\nData: 2026-04-22\nNauczyciel: M. Nowak' }
        ]
      ]
    },
    {
      name: 'Matematyka',
      average: '5.20',
      semester: [
        [
          { id: 201, value: '5', info: 'Kategoria: Sprawdzian\nWaga: 3\nData: 2026-02-18\nNauczyciel: A. Wiśniewski\nKomentarz: Ciągi arytmetyczne i geometryczne' },
          { id: 202, value: '5+', info: 'Kategoria: Kartkówka\nWaga: 1\nData: 2026-03-05\nNauczyciel: A. Wiśniewski' },
          { id: 203, value: '6', info: 'Kategoria: Zadanie dodatkowe\nWaga: 2\nData: 2026-03-24\nNauczyciel: A. Wiśniewski\nKomentarz: Zadania olimpijskie' }
        ],
        [
          { id: 204, value: '5', info: 'Kategoria: Sprawdzian\nWaga: 3\nData: 2026-04-15\nNauczyciel: A. Wiśniewski\nKomentarz: Rachunek prawdopodobieństwa' },
          { id: 205, value: '4+', info: 'Kategoria: Kartkówka\nWaga: 1\nData: 2026-04-29\nNauczyciel: A. Wiśniewski' }
        ]
      ]
    },
    {
      name: 'Język angielski',
      average: '5.60',
      semester: [
        [
          { id: 301, value: '6', info: 'Kategoria: Sprawdzian\nWaga: 3\nData: 2026-02-12\nNauczyciel: E. Smith\nKomentarz: Advanced Grammar Unit 4' },
          { id: 302, value: '5', info: 'Kategoria: Prezentacja\nWaga: 2\nData: 2026-03-08\nNauczyciel: E. Smith\nKomentarz: Artificial Intelligence in Modern Society' }
        ],
        [
          { id: 303, value: '6', info: 'Kategoria: Esej\nWaga: 3\nData: 2026-04-12\nNauczyciel: E. Smith\nKomentarz: Critical essay' },
          { id: 304, value: '5+', info: 'Kategoria: Kartkówka\nWaga: 1\nData: 2026-05-03\nNauczyciel: E. Smith\nKomentarz: Phrasal verbs' }
        ]
      ]
    },
    {
      name: 'Informatyka',
      average: '6.00',
      semester: [
        [
          { id: 401, value: '6', info: 'Kategoria: Projekt\nWaga: 3\nData: 2026-02-20\nNauczyciel: P. Zieliński\nKomentarz: Architektura fullstack w Node.js' },
          { id: 402, value: '6', info: 'Kategoria: Sprawdzian praktyczny\nWaga: 3\nData: 2026-03-15\nNauczyciel: P. Zieliński\nKomentarz: Algorytmy grafowe' }
        ],
        [
          { id: 403, value: '6', info: 'Kategoria: Projekt grupowy\nWaga: 3\nData: 2026-04-25\nNauczyciel: P. Zieliński\nKomentarz: Model AI & REST API' }
        ]
      ]
    },
    {
      name: 'Fizyka',
      average: '4.75',
      semester: [
        [
          { id: 501, value: '4+', info: 'Kategoria: Sprawdzian\nWaga: 3\nData: 2026-02-22\nNauczyciel: T. Lewandowski\nKomentarz: Termodynamika' },
          { id: 502, value: '5', info: 'Kategoria: Ćwiczenia laboratoryjne\nWaga: 2\nData: 2026-03-12\nNauczyciel: T. Lewandowski' }
        ],
        [
          { id: 503, value: '5', info: 'Kategoria: Sprawdzian\nWaga: 3\nData: 2026-04-18\nNauczyciel: T. Lewandowski\nKomentarz: Optyka falowa' }
        ]
      ]
    },
    {
      name: 'Historia',
      average: '5.00',
      semester: [
        [
          { id: 601, value: '5', info: 'Kategoria: Sprawdzian\nWaga: 3\nData: 2026-02-25\nNauczyciel: D. Kamińska\nKomentarz: Dwudziestolecie międzywojenne' }
        ],
        [
          { id: 602, value: '5', info: 'Kategoria: Kartkówka\nWaga: 1\nData: 2026-04-14\nNauczyciel: D. Kamińska' },
          { id: 603, value: '5', info: 'Kategoria: Projekt\nWaga: 2\nData: 2026-05-02\nNauczyciel: D. Kamińska' }
        ]
      ]
    }
  ];

  const stats = computeGradeStats(mockSubjects);
  return {
    isDemo: true,
    luckyNumber: 17,
    lastSync: new Date().toISOString(),
    status: 'demo',
    ...stats
  };
}

/**
 * Parsuje surowy wpis z terminarza Librus do ustandaryzowanego obiektu zdarzenia.
 */
export function parseCalendarEvent(item) {
  if (!item || !item.title) return null;
  const rawTitle = String(item.title).trim();
  const day = item.day || '';
  const id = item.id || null;

  // 1. Nieobecność nauczyciela
  if (/nieobecność/i.test(rawTitle) && /nauczyciel/i.test(rawTitle)) {
    const teacherMatch = rawTitle.match(/nauczyciel:\s*([^\n\r]+?)(?:godziny:|$)/i);
    const hoursMatch = rawTitle.match(/godziny:\s*([^\n\r]+)/i);
    const teacher = teacherMatch ? teacherMatch[1].trim() : 'Nauczyciel';
    const hours = hoursMatch ? hoursMatch[1].trim() : 'Cały dzień';

    return {
      id: id || `abs_${day}_${teacher.replace(/\s+/g, '_')}`,
      date: day,
      type: 'absence',
      category: 'Nieobecność nauczyciela',
      title: `Nieobecność: ${teacher}`,
      teacher,
      time: hours,
      subject: null,
      description: `Nieobecność nauczyciela: ${teacher} (${hours})`,
      raw: rawTitle
    };
  }

  // 2. Kartkówka
  if (/kartkówka/i.test(rawTitle)) {
    const lessonMatch = rawTitle.match(/nr\s*lekcji:\s*(\d+)/i);
    const lessonNr = lessonMatch ? lessonMatch[1] : null;

    let subject = 'Zajęcia szkolne';
    const clean = rawTitle.replace(/nr\s*lekcji:\s*\d+/i, '').trim();
    const parts = clean.split(/,|\n/);
    if (parts.length > 0 && parts[0].trim()) {
      subject = parts[0].replace(/kartkówka/i, '').trim() || 'Zajęcia szkolne';
    }

    return {
      id: id || `kart_${day}_${Math.random().toString(36).substr(2, 5)}`,
      date: day,
      type: 'kartkowka',
      category: 'Kartkówka',
      title: `Kartkówka: ${subject}`,
      subject,
      teacher: null,
      time: lessonNr ? `Lekcja ${lessonNr}` : '',
      description: rawTitle,
      raw: rawTitle
    };
  }

  // 3. Sprawdzian / Praca klasowa
  if (/sprawdzian|praca\s*klasowa|test/i.test(rawTitle)) {
    const lessonMatch = rawTitle.match(/nr\s*lekcji:\s*(\d+)/i);
    const lessonNr = lessonMatch ? lessonMatch[1] : null;

    let subject = 'Zajęcia szkolne';
    const clean = rawTitle.replace(/nr\s*lekcji:\s*\d+/i, '').trim();
    const parts = clean.split(/,|\n/);
    if (parts.length > 0 && parts[0].trim()) {
      subject = parts[0].replace(/sprawdzian|praca\s*klasowa|test/i, '').trim() || 'Zajęcia szkolne';
    }

    return {
      id: id || `sprawdzian_${day}_${Math.random().toString(36).substr(2, 5)}`,
      date: day,
      type: 'sprawdzian',
      category: 'Sprawdzian',
      title: `Sprawdzian: ${subject}`,
      subject,
      teacher: null,
      time: lessonNr ? `Lekcja ${lessonNr}` : '',
      description: rawTitle,
      raw: rawTitle
    };
  }

  // 4. Wywiadówka / Zebranie
  if (/wywiadówka|zebranie|spotkanie/i.test(rawTitle)) {
    return {
      id: id || `event_${day}_${Math.random().toString(36).substr(2, 5)}`,
      date: day,
      type: 'wywiadowka',
      category: 'Wywiadówka / Zebranie',
      title: rawTitle.split(/[:\n]/)[0].trim() || 'Spotkanie z rodzicami',
      subject: null,
      teacher: null,
      time: '',
      description: rawTitle,
      raw: rawTitle
    };
  }

  // 5. Inne wydarzenia szkolne
  return {
    id: id || `event_${day}_${Math.random().toString(36).substr(2, 5)}`,
    date: day,
    type: 'inne',
    category: 'Wydarzenie szkolne',
    title: rawTitle.slice(0, 45),
    subject: null,
    teacher: null,
    time: '',
    description: rawTitle,
    raw: rawTitle
  };
}

/**
 * Pobiera terminarz z Librusa (bieżący miesiąc oraz opcjonalnie kolejny).
 */
export async function fetchLibrusCalendarFromSource(client, targetMonth, targetYear) {
  const now = new Date();
  const m = targetMonth || (now.getMonth() + 1);
  const y = targetYear || now.getFullYear();

  const rawCalendar = await client.calendar.getCalendar(m, y);
  const items = Array.isArray(rawCalendar) ? rawCalendar.flat().filter(Boolean) : [];

  const parsedEvents = [];
  for (const it of items) {
    const parsed = parseCalendarEvent(it);
    if (!parsed) continue;

    // Próba wzbogacenia o szczegóły jeśli ID jest unikalne i dodatnie
    if (it.id && typeof it.id === 'number' && it.id > 0) {
      try {
        const isAbs = parsed.type === 'absence';
        const details = await client.calendar.getEvent(it.id, isAbs);
        if (isAbs) {
          if (details.teacher) parsed.teacher = details.teacher;
          if (details.range) parsed.dateRange = details.range;
          if (!parsed.time || parsed.time === 'Cały dzień') {
            if (details.hours) parsed.time = details.hours;
            else if (details.time) parsed.time = details.time;
          }
        } else if (!isAbs) {
          if (details.subject) parsed.subject = details.subject;
          if (details.teacher) parsed.teacher = details.teacher;
          if (details.description) parsed.description = details.description;
          if (details.room) parsed.room = details.room;
          if (details.lessonNumber) parsed.time = `Lekcja ${details.lessonNumber}`;
        }
      } catch {}
    }
    parsedEvents.push(parsed);
  }

  // Posortuj chronologicznie
  parsedEvents.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  return {
    lastSync: new Date().toISOString(),
    month: m,
    year: y,
    events: parsedEvents
  };
}

/**
 * Zapisuje kalendarz do bazy SQLite oraz replikuje do Firestore (librus_cache/calendar).
 */
export async function saveCalendarToCache(payload) {
  try {
    await executeRun(`
      CREATE TABLE IF NOT EXISTS librus_calendar_cache (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        data TEXT NOT NULL,
        last_sync DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'ok',
        error_message TEXT
      )
    `);
    await executeRun(
      `INSERT OR REPLACE INTO librus_calendar_cache (id, data, last_sync, status, error_message)
       VALUES (1, ?, datetime('now'), 'ok', NULL)`,
      [JSON.stringify(payload)]
    );
  } catch (err) {
    console.error('[!] ERROR :: LIBRUS :: Błąd zapisu librus_calendar_cache w SQLite:', err.message);
  }

  // Replikacja do Firestore (dokument librus_cache/calendar - zaufana kolekcja z firestore.rules)
  try {
    const { getFirestoreDb } = await import('../firebase.js');
    const firestoreDb = getFirestoreDb ? getFirestoreDb() : null;
    if (firestoreDb) {
      await firestoreDb.collection('librus_cache').doc('calendar').set({
        ...payload,
        updated_at: new Date().toISOString()
      });
      console.log(`[+] SUCCESS :: LIBRUS :: Zreplikowano terminarz do Firestore (librus_cache/calendar).`);
    }
  } catch (fErr) {
    console.warn(`[!] ALERT :: LIBRUS :: Pominięto replikację terminarza do Firestore: ${fErr.message}`);
  }
}

/**
 * Zwraca zbuforowany terminarz z bazy SQLite.
 */
export async function getCachedCalendar() {
  try {
    const rows = await executeQuery('SELECT * FROM librus_calendar_cache WHERE id = 1');
    if (rows && rows.length > 0) {
      const row = rows[0];
      const parsedData = JSON.parse(row.data);
      return {
        cached: true,
        lastSync: row.last_sync,
        status: row.status,
        ...parsedData
      };
    }
  } catch (err) {
    console.error('[!] ERROR :: LIBRUS :: Błąd odczytu librus_calendar_cache:', err.message);
  }
  return null;
}

/**
 * Wymusza synchronizację samego terminarza szkolnego.
 */
export async function syncLibrusCalendar() {
  const creds = getLibrusCredentials();
  if (!creds.isConfigured) {
    return { success: false, error: 'Brak skonfigurowanych poświadczeń Librus Synergia.' };
  }

  try {
    const LibrusClass = (await import('librus-api')).default;
    const client = new LibrusClass();
    await client.authorize(creds.login, creds.password);
    const calendarPayload = await fetchLibrusCalendarFromSource(client);
    await saveCalendarToCache(calendarPayload);
    return { success: true, data: calendarPayload };
  } catch (err) {
    console.error(`[!] ERROR :: LIBRUS :: Błąd synchronizacji terminarza:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Zwraca realistyczne dane demonstracyjne terminarza szkolnego.
 */
export function getDemoCalendarData() {
  const today = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const formatDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const d1 = new Date(today);
  d1.setDate(d1.getDate() + 1);
  const d2 = new Date(today);
  d2.setDate(d2.getDate() + 2);
  const d3 = new Date(today);
  d3.setDate(d3.getDate() + 4);
  const d4 = new Date(today);
  d4.setDate(d4.getDate() + 7);

  return {
    isDemo: true,
    lastSync: new Date().toISOString(),
    events: [
      {
        id: 9001,
        date: formatDate(today),
        type: 'absence',
        category: 'Nieobecność nauczyciela',
        title: 'Nieobecność: Lorenz Krzysztof',
        teacher: 'Lorenz Krzysztof',
        time: '08:00 do 13:05',
        subject: 'Informatyka',
        description: 'Nieobecność nauczyciela w godz. 08:00 do 13:05 (zastępstwo lub okienko)'
      },
      {
        id: 9002,
        date: formatDate(d1),
        type: 'kartkowka',
        category: 'Kartkówka',
        title: 'Kartkówka: Język angielski',
        teacher: 'Ziemba Joanna',
        time: 'Lekcja 2 (08:50)',
        subject: 'Język angielski',
        description: 'Słownictwo unit 4 (Phrasal verbs & Collocations)'
      },
      {
        id: 9003,
        date: formatDate(d2),
        type: 'absence',
        category: 'Nieobecność nauczyciela',
        title: 'Nieobecność: Negowska Alicja',
        teacher: 'Negowska Alicja',
        time: '08:50 do 14:50',
        subject: null,
        description: 'Nieobecność nauczyciela: Negowska Alicja (08:50 do 14:50)'
      },
      {
        id: 9004,
        date: formatDate(d3),
        type: 'sprawdzian',
        category: 'Sprawdzian',
        title: 'Sprawdzian: Matematyka',
        teacher: 'Wiśniewski Andrzej',
        time: 'Lekcja 4 (10:40)',
        subject: 'Matematyka',
        description: 'Rachunek prawdopodobieństwa, permutacje i kombinatoryka'
      },
      {
        id: 9005,
        date: formatDate(d4),
        type: 'sprawdzian',
        category: 'Praca klasowa',
        title: 'Praca klasowa: Język polski',
        teacher: 'Kowalska Jadwiga',
        time: 'Lekcja 3 (09:45)',
        subject: 'Język polski',
        description: 'Dziady cz. III oraz Kordian — motyw prometeizmu i tyrteizmu'
      }
    ]
  };
}



/**
 * Parsuje string czasu 'HH:MM' do minut od północy.
 */
export function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

/**
 * Sprawdza czy godziny lekcji nakładają się na godziny absencji.
 */
export function checkTimeOverlap(lessonStartStr, lessonEndStr, absenceRangeStr) {
  if (!absenceRangeStr || typeof absenceRangeStr !== 'string') return true;
  const lower = absenceRangeStr.toLowerCase().trim();
  if (lower.includes('cały dzień') || lower === '' || lower === 'brak') return true;

  // Wyodrębnij godziny z absencji np. '08:50 do 14:50' lub '08:50 - 14:50'
  const timeMatches = absenceRangeStr.match(/(\d{1,2}:\d{2})/g);
  if (!timeMatches || timeMatches.length < 2) return true;

  const absStart = parseTimeToMinutes(timeMatches[0]);
  const absEnd = parseTimeToMinutes(timeMatches[1]);

  const lStart = parseTimeToMinutes(lessonStartStr);
  const lEnd = parseTimeToMinutes(lessonEndStr);

  // Nakładanie przedziałów [lStart, lEnd] i [absStart, absEnd]
  return Math.max(lStart, absStart) < Math.min(lEnd, absEnd);
}

/**
 * Pobiera tygodniowy plan lekcji z Librus Synergia i normalizuje strukturę.
 */
export async function fetchLibrusTimetableFromSource(client, from, to) {
  const rawTimetable = await client.calendar.getTimetable(from, to);
  if (!rawTimetable || !rawTimetable.table) {
    return { hours: [], table: {}, lessons: [] };
  }

  const DAY_KEYS_MAP = {
    Monday: 'monday',
    Tuesday: 'tuesday',
    Wednesday: 'wednesday',
    Thursday: 'thursday',
    Friday: 'friday',
    Saturday: 'saturday',
    Sunday: 'sunday'
  };

  const allLessons = [];
  const normalizedTable = {};

  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const determineColor = (subject) => {
    const s = (subject || '').toLowerCase();
    if (s.includes('informatyk') || s.includes('systemy') || s.includes('sieci') || s.includes('komputer')) return 'cyan';
    if (s.includes('matematyk') || s.includes('fizyk')) return 'indigo';
    if (s.includes('angielski') || s.includes('niemiecki')) return 'amber';
    if (s.includes('polski') || s.includes('histori')) return 'rose';
    if (s.includes('chem') || s.includes('biolog') || s.includes('zdrowotna')) return 'emerald';
    if (s.includes('wychowanie fiz') || s.includes('wf')) return 'purple';
    return 'blue';
  };

  const determineType = (subject) => {
    const s = (subject || '').toLowerCase();
    if (s.includes('pracownia') || s.includes('laboratorium')) return 'Laboratorium';
    if (s.includes('ćwiczenia') || s.includes('wf') || s.includes('fizyczne')) return 'Ćwiczenia';
    if (s.includes('projekt')) return 'Projekt';
    if (s.includes('angielski') || s.includes('niemiecki')) return 'Lektorat';
    return 'Wykład';
  };

  for (const [dayName, lessonsList] of Object.entries(rawTimetable.table)) {
    const dayId = DAY_KEYS_MAP[dayName] || dayName.toLowerCase();
    normalizedTable[dayId] = [];

    (lessonsList || []).forEach((item, idx) => {
      if (!item || !item.subject) return;

      // Rozbij time np. '08:50 - 09:35'
      const times = (item.time || '').replace(/\u00a0/g, ' ').split(/\s*-\s*/);
      const timeStart = (times[0] || '08:00').trim();
      const timeEnd = (times[1] || '08:45').trim();

      const cleanTeacher = cleanTeacherName(item.teacher);
      const subjectFormatted = capitalize(item.subject.trim());
      const lessonId = `librus_${dayId}_${idx}_${timeStart.replace(':', '')}`;

      const lessonObj = {
        id: lessonId,
        day: dayId,
        subject: subjectFormatted,
        time_start: timeStart,
        time_end: timeEnd,
        room: item.room ? (item.room.startsWith('s.') ? item.room : `s. ${item.room}`) : '',
        teacher: item.teacher || '',
        cleanTeacher: cleanTeacher,
        type: determineType(item.subject),
        color: determineColor(item.subject),
        notes: item.teacher ? `Nauczyciel: ${item.teacher}` : '',
        isLibrus: true
      };

      normalizedTable[dayId].push(lessonObj);
      allLessons.push(lessonObj);
    });
  }

  return {
    hours: rawTimetable.hours || [],
    table: normalizedTable,
    lessons: allLessons
  };
}

/**
 * Koreluje plan lekcji z nieobecnościami nauczycieli i zmianami w terminarzu.
 */
export function correlateTimetableWithAbsences(lessons, calendarEvents = []) {
  if (!Array.isArray(lessons)) return { lessons: [], detectedSubstitutions: [] };

  const DAY_INDEX_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const absenceEvents = (calendarEvents || []).filter(e => e && e.type === 'absence' && e.teacher);
  const detectedSubstitutions = [];

  const correlatedLessons = lessons.map(lesson => {
    let matchedAbsence = null;

    for (const abs of absenceEvents) {
      // 1. Sprawdź czy nauczyciel pasuje
      if (!matchTeacherNames(lesson.teacher || lesson.cleanTeacher, abs.teacher)) {
        continue;
      }

      // 2. Sprawdź dzień tygodnia na podstawie daty absencji
      let absDayOfWeek = null;
      if (abs.date) {
        try {
          const d = new Date(abs.date + 'T12:00:00Z');
          absDayOfWeek = DAY_INDEX_NAMES[d.getUTCDay()];
        } catch {}
      }

      if (absDayOfWeek && absDayOfWeek !== lesson.day) {
        continue; // Zdarzenie z innego dnia tygodnia
      }

      // 3. Sprawdź czy godziny lekcji nakładają się na godziny absencji
      const isOverlap = checkTimeOverlap(lesson.time_start, lesson.time_end, abs.time || abs.range || '');
      if (isOverlap) {
        matchedAbsence = abs;
        break;
      }
    }

    if (matchedAbsence) {
      const alertInfo = {
        isAbsent: true,
        teacher: matchedAbsence.teacher,
        hours: matchedAbsence.time || 'Cały dzień',
        date: matchedAbsence.date || '',
        description: matchedAbsence.description || `Nieobecność nauczyciela: ${matchedAbsence.teacher}`,
        suggestedStatus: 'okienko_or_sub'
      };

      const enriched = {
        ...lesson,
        absenceAlert: alertInfo,
        notes: lesson.notes 
          ? `${lesson.notes} | [!] NIEOBECNOŚĆ: ${matchedAbsence.teacher} (${alertInfo.hours})`
          : `[!] NIEOBECNOŚĆ: ${matchedAbsence.teacher} (${alertInfo.hours})`
      };

      detectedSubstitutions.push({
        lessonId: lesson.id,
        day: lesson.day,
        subject: lesson.subject,
        time_start: lesson.time_start,
        time_end: lesson.time_end,
        teacher: lesson.teacher,
        absenceTeacher: matchedAbsence.teacher,
        absenceHours: alertInfo.hours,
        absenceDate: matchedAbsence.date
      });

      return enriched;
    }

    return lesson;
  });

  return {
    lessons: correlatedLessons,
    detectedSubstitutions
  };
}

/**
 * Zapisuje plan lekcji z buforem zastępstw do SQLite oraz replikuje do Firestore (librus_cache/timetable).
 */
export async function saveTimetableToCache(payload) {
  try {
    await executeRun(`
      CREATE TABLE IF NOT EXISTS librus_timetable_cache (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        data TEXT NOT NULL,
        last_sync DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'ok',
        error_message TEXT
      )
    `);
    await executeRun(
      `INSERT OR REPLACE INTO librus_timetable_cache (id, data, last_sync, status, error_message)
       VALUES (1, ?, datetime('now'), 'ok', NULL)`,
      [JSON.stringify(payload)]
    );
  } catch (err) {
    console.error('[!] ERROR :: LIBRUS :: Błąd zapisu librus_timetable_cache w SQLite:', err.message);
  }

  // Replikacja do Firestore (dokument librus_cache/timetable - dozwolona kolekcja w firestore.rules)
  try {
    const { getFirestoreDb } = await import('../firebase.js');
    const firestoreDb = getFirestoreDb ? getFirestoreDb() : null;
    if (firestoreDb) {
      await firestoreDb.collection('librus_cache').doc('timetable').set({
        ...payload,
        updated_at: new Date().toISOString()
      });
      console.log(`[+] SUCCESS :: LIBRUS :: Zreplikowano plan lekcji i zastępstwa do Firestore (librus_cache/timetable).`);
    }
  } catch (fErr) {
    console.warn(`[!] ALERT :: LIBRUS :: Pominięto replikację planu lekcji do Firestore: ${fErr.message}`);
  }
}

/**
 * Zwraca zbuforowany plan lekcji i zastępstwa z SQLite.
 */
export async function getCachedTimetable() {
  try {
    const rows = await executeQuery('SELECT * FROM librus_timetable_cache WHERE id = 1');
    if (rows && rows.length > 0) {
      const row = rows[0];
      const parsedData = JSON.parse(row.data);
      return {
        cached: true,
        lastSync: row.last_sync,
        status: row.status,
        ...parsedData
      };
    }
  } catch (err) {
    console.error('[!] ERROR :: LIBRUS :: Błąd odczytu librus_timetable_cache:', err.message);
  }
  return null;
}

/**
 * Wymusza synchronizację planu lekcji z Librusa, korelując go z aktualnymi nieobecnościami.
 */
export async function syncLibrusTimetable(options = {}) {
  const creds = getLibrusCredentials();
  if (!creds.isConfigured) {
    return { success: false, error: 'Brak skonfigurowanych poświadczeń Librus Synergia.' };
  }

  try {
    const LibrusClass = (await import('librus-api')).default;
    const client = new LibrusClass();
    await client.authorize(creds.login, creds.password);

    // 1. Pobierz terminarz dla zdarzeń nieobecności
    const calPayload = await fetchLibrusCalendarFromSource(client);
    await saveCalendarToCache(calPayload);

    // 2. Pobierz plan lekcji
    const rawTt = await fetchLibrusTimetableFromSource(client);

    // 3. Skoreluj lekcje z nieobecnościami nauczycieli
    const correlated = correlateTimetableWithAbsences(rawTt.lessons, calPayload?.events || []);

    const timetablePayload = {
      hours: rawTt.hours,
      table: rawTt.table,
      lessons: correlated.lessons,
      substitutions: correlated.detectedSubstitutions,
      lastSync: new Date().toISOString()
    };

    await saveTimetableToCache(timetablePayload);

    // 4. Opcjonalny import do aktywnego planu zajęć aplikacji (tabela `timetable`)
    if (options.importToMainSchedule) {
      try {
        await executeRun(`DELETE FROM timetable`);
        for (const l of correlated.lessons) {
          const fullT = l.cleanTeacher || resolveFullTeacherName(l.teacher) || l.teacher || '';
          await executeRun(
            `INSERT OR REPLACE INTO timetable (id, day, subject, time_start, time_end, room, teacher, type, color, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [l.id, l.day, l.subject, l.time_start, l.time_end, l.room || '', fullT, l.type || 'Wykład', l.color || 'indigo', l.notes || '']
          );
        }
        console.log(`[+] SUCCESS :: LIBRUS :: Zaimportowano ${correlated.lessons.length} lekcji do tabeli timetable.`);

        // Replikacja do kolekcji Firestore 'timetable'
        try {
          const { getFirestoreDb } = await import('../firebase.js');
          const firestoreDb = getFirestoreDb ? getFirestoreDb() : null;
          if (firestoreDb) {
            const snap = await firestoreDb.collection('timetable').get();
            const batch = firestoreDb.batch();
            snap.forEach(d => batch.delete(d.ref));
            for (const l of correlated.lessons) {
              const fullT = l.cleanTeacher || resolveFullTeacherName(l.teacher) || l.teacher || '';
              const docRef = firestoreDb.collection('timetable').doc(String(l.id));
              batch.set(docRef, {
                ...l,
                teacher: fullT,
                cleanTeacher: fullT,
                updated_at: new Date().toISOString()
              });
            }
            await batch.commit();
            console.log(`[+] SUCCESS :: LIBRUS :: Zreplikowano ${correlated.lessons.length} lekcji do kolekcji Firestore timetable.`);
          }
        } catch (fSyncErr) {
          console.warn(`[!] ALERT :: LIBRUS :: Błąd replikacji do kolekcji timetable:`, fSyncErr.message);
        }
      } catch (impErr) {
        console.warn(`[!] ALERT :: LIBRUS :: Błąd importu do tabeli timetable: ${impErr.message}`);
      }
    }

    return { success: true, data: timetablePayload };
  } catch (err) {
    console.error(`[!] ERROR :: LIBRUS :: Błąd synchronizacji planu lekcji:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Zwraca realistyczne dane demonstracyjne planu lekcji wraz z nałożonymi absencjami.
 */
export function getDemoTimetableData() {
  const demoLessons = [
    // Poniedziałek
    { id: 'librus_mon_1', day: 'monday', subject: 'Informatyka', time_start: '08:50', time_end: '09:35', room: 's. 17', teacher: 'Becker Adam (2 TI gr.2)', type: 'Laboratorium', color: 'cyan', notes: 'Pracownia' },
    { id: 'librus_mon_2', day: 'monday', subject: 'Informatyka', time_start: '09:40', time_end: '10:25', room: 's. 17', teacher: 'Becker Adam (2 TI gr.2)', type: 'Laboratorium', color: 'cyan', notes: 'Pracownia' },
    { id: 'librus_mon_3', day: 'monday', subject: 'Chemia', time_start: '10:40', time_end: '11:25', room: 's. 31', teacher: 'Kolasińska Paulina', type: 'Wykład', color: 'emerald', notes: '' },
    { id: 'librus_mon_4', day: 'monday', subject: 'Edukacja zdrowotna', time_start: '11:30', time_end: '12:15', room: 's. 38', teacher: 'Spych Monika', type: 'Wykład', color: 'emerald', notes: '' },
    { id: 'librus_mon_5', day: 'monday', subject: 'Systemy operacyjne', time_start: '12:20', time_end: '13:05', room: 's. 1.16', teacher: 'Wojnarowski Przemysław', type: 'Laboratorium', color: 'cyan', notes: '' },
    { id: 'librus_mon_6', day: 'monday', subject: 'Systemy operacyjne', time_start: '13:15', time_end: '14:00', room: 's. 1.16', teacher: 'Wojnarowski Przemysław', type: 'Laboratorium', color: 'cyan', notes: '' },

    // Wtorek
    { id: 'librus_tue_1', day: 'tuesday', subject: 'Pracownia urządzeń techniki komputerowej', time_start: '08:00', time_end: '08:45', room: 's. 1.16', teacher: 'Wojnarowski Przemysław', type: 'Laboratorium', color: 'cyan', notes: '' },
    { id: 'librus_tue_2', day: 'tuesday', subject: 'Pracownia urządzeń techniki komputerowej', time_start: '08:50', time_end: '09:35', room: 's. 1.16', teacher: 'Wojnarowski Przemysław', type: 'Laboratorium', color: 'cyan', notes: '' },
    { id: 'librus_tue_3', day: 'tuesday', subject: 'Zajęcia z wychowawcą', time_start: '09:40', time_end: '10:25', room: 's. 1.16', teacher: 'Ziemba Joanna', type: 'Wykład', color: 'amber', notes: '' },
    { id: 'librus_tue_4', day: 'tuesday', subject: 'Wychowanie fizyczne', time_start: '10:40', time_end: '11:25', room: 's. WF', teacher: 'Łysakowski Grzegorz', type: 'Ćwiczenia', color: 'purple', notes: '' },
    { id: 'librus_tue_5', day: 'tuesday', subject: 'Wychowanie fizyczne', time_start: '11:30', time_end: '12:15', room: 's. WF', teacher: 'Łysakowski Grzegorz', type: 'Ćwiczenia', color: 'purple', notes: '' },
    { id: 'librus_tue_6', day: 'tuesday', subject: 'Matematyka', time_start: '14:05', time_end: '14:50', room: 's. 26', teacher: 'Bahr Zbigniew', type: 'Wykład', color: 'indigo', notes: '' },

    // Środa
    { id: 'librus_wed_1', day: 'wednesday', subject: 'Biznes i zarządzanie', time_start: '10:40', time_end: '11:25', room: 's. 0.2', teacher: 'Sokół Paweł', type: 'Wykład', color: 'blue', notes: '' },
    { id: 'librus_wed_2', day: 'wednesday', subject: 'Biologia', time_start: '11:30', time_end: '12:15', room: 's. 19', teacher: 'Łukaszczyk-Wulgaris Joanna', type: 'Wykład', color: 'emerald', notes: '' },
    { id: 'librus_wed_3', day: 'wednesday', subject: 'Urządzenia techniki komputerowej', time_start: '12:20', time_end: '13:05', room: 's. 1.16', teacher: 'Gembiak Bartosz', type: 'Laboratorium', color: 'cyan', notes: '' },
    { id: 'librus_wed_4', day: 'wednesday', subject: 'Historia', time_start: '14:05', time_end: '14:50', room: 's. 06', teacher: 'Wardyn Wojciech', type: 'Wykład', color: 'rose', notes: '' },
    { id: 'librus_wed_5', day: 'wednesday', subject: 'Matematyka', time_start: '14:55', time_end: '15:40', room: 's. 26', teacher: 'Bahr Zbigniew', type: 'Wykład', color: 'indigo', notes: '' },

    // Czwartek
    { 
      id: 'librus_thu_1', 
      day: 'thursday', 
      subject: 'Język polski', 
      time_start: '08:00', 
      time_end: '08:45', 
      room: 's. 34', 
      teacher: 'Negowska Alicja', 
      type: 'Wykład', 
      color: 'rose', 
      notes: ''
    },
    { id: 'librus_thu_2', day: 'thursday', subject: 'Język angielski zawodowy', time_start: '08:50', time_end: '09:35', room: 's. Z2', teacher: 'Ziemba Joanna', type: 'Lektorat', color: 'amber', notes: '' },
    { id: 'librus_thu_3', day: 'thursday', subject: 'Pracownia lokalnych sieci komputerowych', time_start: '10:40', time_end: '11:25', room: 's. 1.16', teacher: 'Kryła Łukasz', type: 'Laboratorium', color: 'cyan', notes: '' },
    { id: 'librus_thu_4', day: 'thursday', subject: 'Matematyka', time_start: '12:20', time_end: '13:05', room: 's. 05', teacher: 'Bahr Zbigniew', type: 'Wykład', color: 'indigo', notes: '' },
    { 
      id: 'librus_thu_5', 
      day: 'thursday', 
      subject: 'Język polski', 
      time_start: '13:15', 
      time_end: '14:00', 
      room: 's. 34', 
      teacher: 'Negowska Alicja', 
      type: 'Wykład', 
      color: 'rose', 
      notes: '[!] NIEOBECNOŚĆ: Negowska Alicja (08:50 do 14:50)',
      absenceAlert: {
        isAbsent: true,
        teacher: 'Negowska Alicja',
        hours: '08:50 do 14:50',
        date: '2026-09-24',
        description: 'Nieobecność nauczyciela: Negowska Alicja (08:50 do 14:50)',
        suggestedStatus: 'okienko_or_sub'
      }
    },

    // Piątek
    { id: 'librus_fri_1', day: 'friday', subject: 'Język angielski', time_start: '08:00', time_end: '08:45', room: 's. Z2', teacher: 'Ziemba Joanna', type: 'Lektorat', color: 'amber', notes: '' },
    { id: 'librus_fri_2', day: 'friday', subject: 'Język niemiecki', time_start: '08:50', time_end: '09:35', room: 's. Z1', teacher: 'Chyła Beata', type: 'Lektorat', color: 'amber', notes: '' },
    { id: 'librus_fri_3', day: 'friday', subject: 'Wychowanie fizyczne', time_start: '09:40', time_end: '10:25', room: 's. WF', teacher: 'Łysakowski Grzegorz', type: 'Ćwiczenia', color: 'purple', notes: '' },
    { id: 'librus_fri_4', day: 'friday', subject: 'Lokalne sieci komputerowe', time_start: '10:40', time_end: '11:25', room: 's. 1.16', teacher: 'Wojnarowski Przemysław', type: 'Wykład', color: 'cyan', notes: '' },
    { id: 'librus_fri_5', day: 'friday', subject: 'Chemia', time_start: '11:30', time_end: '12:15', room: 's. 19', teacher: 'Kolasińska Paulina', type: 'Wykład', color: 'emerald', notes: '' },
    { id: 'librus_fri_6', day: 'friday', subject: 'Edukacja obywatelska', time_start: '12:20', time_end: '13:05', room: 's. 09', teacher: 'Czarna Alicja', type: 'Wykład', color: 'rose', notes: '' }
  ];

  return {
    isDemo: true,
    lastSync: new Date().toISOString(),
    hours: [
      '08:00 - 08:45',
      '08:50 - 09:35',
      '09:40 - 10:25',
      '10:40 - 11:25',
      '11:30 - 12:15',
      '12:20 - 13:05',
      '13:15 - 14:00',
      '14:05 - 14:50',
      '14:55 - 15:40'
    ],
    lessons: demoLessons,
    substitutions: [
      {
        lessonId: 'librus_thu_5',
        day: 'thursday',
        subject: 'Język polski',
        time_start: '13:15',
        time_end: '14:00',
        teacher: 'Negowska Alicja',
        absenceTeacher: 'Negowska Alicja',
        absenceHours: '08:50 do 14:50',
        absenceDate: '2026-09-24'
      }
    ]
  };
}
