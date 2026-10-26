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
    const rawSem1 = subj.semester?.[0] ?? null;
    // librus-api zwraca tablicę 4-elementową: [sem1_oceny, srodroczna, sem2_oceny, roczna].
    // Jeśli indeks 2 istnieje i zawiera oceny (tablicę lub obiekt z polem grades), traktujemy go jako pełny Semestr 2; w przeciwnym razie fallback do indeksu 1.
    const sem2Candidate = subj.semester?.[2] ?? null;
    const rawSem2 = (sem2Candidate && (Array.isArray(sem2Candidate) || Array.isArray(sem2Candidate.grades)))
      ? sem2Candidate
      : (subj.semester?.[1] ?? null);

    const mapGradeItem = (g) => {
      const existingDetails = (g.details && typeof g.details === 'object' && Object.keys(g.details).length > 0) ? g.details : null;
      const parsedDetails = parseGradeInfo(g.info);
      const details = existingDetails ? { ...parsedDetails, ...existingDetails } : parsedDetails;
      if (!details.teacher && (g.teacher || subj.teacher)) {
        details.teacher = g.teacher || subj.teacher;
      }
      return {
        ...g,
        details,
        inAverage: details?.inAverage !== undefined ? details.inAverage : (g.inAverage !== undefined ? g.inAverage : true),
        numericValue: g.numericValue !== undefined && g.numericValue !== null ? g.numericValue : parseGradeNumeric(g.value)
      };
    };

    const sem1Grades = extractGradesList(rawSem1).map(mapGradeItem);
    const sem2Grades = extractGradesList(rawSem2).map(mapGradeItem);

    const calcAverage = (gradesList) => {
      let sum = 0;
      let weights = 0;
      for (const g of gradesList) {
        if (g.numericValue !== null && g.details?.inAverage !== false) {
          const w = (g.details?.weight !== undefined && g.details?.weight !== null && !isNaN(Number(g.details.weight)))
            ? Number(g.details.weight)
            : 1;
          if (w > 0) {
            sum += g.numericValue * w;
            weights += w;
          }
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

    const allGrades = [...sem1Grades, ...sem2Grades];

    return {
      ...subj,
      name: cleanName,
      sem1Grades,
      sem2Grades,
      grades: allGrades,
      sem1Avg,
      sem2Avg,
      average: typeof subj.average === 'number' ? subj.average : (finalAvg > 0 ? finalAvg : (subj.average || 0)),
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
 * Zapisuje oceny i metryki do bazy SQLite oraz replikuje do Firestore (librus_cache/latest).
 */
export async function saveGradesToCache(payload) {
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

  // Replikacja ocen do Firebase Firestore
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

  // Pobierz dane konta ucznia (imię, nazwisko, klasa, numer z dziennika)
  let studentInfo = null;
  try {
    const acc = await client.info.getAccountInfo();
    if (acc?.student) {
      studentInfo = {
        name: acc.student.nameSurname || '',
        class: acc.student.class || '',
        index: acc.student.index || '',
        educator: acc.student.educator || ''
      };
    }
  } catch (accErr) {
    console.debug(`[!] ALERT :: LIBRUS :: Pominięto dane ucznia: ${accErr.message}`);
  }

  // Pobierz statystyki frekwencji i nieobecności
  let attendanceRate = null;
  try {
    if (client.absence && typeof client.absence.getAbsences === 'function') {
      const absences = await client.absence.getAbsences();
      if (Array.isArray(absences) && absences.length > 0) {
        const total = absences.length;
        const present = absences.filter(a => a.type === 'obecnosc' || a.presence).length;
        attendanceRate = parseFloat(((present / total) * 100).toFixed(1));
      }
    }
  } catch (absErr) {
    console.debug(`[!] ALERT :: LIBRUS :: Pominięto kalkulację frekwencji: ${absErr.message}`);
  }

  // Przetwórz i wzbogać statystykami
  const stats = computeGradeStats(rawGrades || []);

  const parsedLucky = (luckyNumber !== null && luckyNumber !== undefined) ? parseInt(luckyNumber, 10) : null;
  const safeLuckyNumber = Number.isNaN(parsedLucky) ? null : parsedLucky;

  const payload = {
    isConfigured: true,
    isDemo: false,
    subjects: stats.subjects,
    overallAverage: stats.overallAverage,
    totalSubjects: stats.totalSubjects,
    gradedSubjectsCount: stats.gradedSubjectsCount,
    highestAverage: stats.highestAverage,
    lowestAverage: stats.lowestAverage,
    luckyNumber: safeLuckyNumber,
    studentInfo,
    attendanceRate,
    lastSync: new Date().toISOString()
  };

  // Zapis do bazy SQLite oraz replikacja do Firestore
  await saveGradesToCache(payload);

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
      name: 'biologia',
      teacher: 'Łukaszczyk-Wulgaris Joanna',
      average: 3.38,
      semester: [
        [
          {
            id: 101,
            value: '4+',
            numericValue: 4.5,
            info: 'Kategoria: Kartkówka\nWaga: 1\nData: 2026-10-06\nNauczyciel: Joanna Łukaszczyk-Wulgaris\nKomentarz: Budowa komórki zwierzęcej i roślinnej',
            details: { category: 'Kartkówka', weight: 1, date: '2026-10-06', teacher: 'Joanna Łukaszczyk-Wulgaris', comment: 'Budowa komórki zwierzęcej i roślinnej', inAverage: true }
          },
          {
            id: 102,
            value: '3',
            numericValue: 3.0,
            info: 'Kategoria: Sprawdzian\nWaga: 3\nData: 2026-10-14\nNauczyciel: Joanna Łukaszczyk-Wulgaris\nKomentarz: Składniki chemiczne organizmów',
            details: { category: 'Sprawdzian', weight: 3, date: '2026-10-14', teacher: 'Joanna Łukaszczyk-Wulgaris', comment: 'Składniki chemiczne organizmów', inAverage: true }
          }
        ],
        []
      ]
    },
    {
      name: 'biznes i zarządzanie',
      teacher: 'Sokół Paweł',
      average: 4.50,
      semester: [
        [
          {
            id: 201,
            value: '4+',
            numericValue: 4.5,
            info: 'Kategoria: Kartkówka\nWaga: 1\nData: 2026-10-12\nNauczyciel: Paweł Sokół\nKomentarz: Formy działalności gospodarczej',
            details: { category: 'Kartkówka', weight: 1, date: '2026-10-12', teacher: 'Paweł Sokół', comment: 'Formy działalności gospodarczej', inAverage: true }
          }
        ],
        []
      ]
    },
    {
      name: 'chemia',
      teacher: 'Kolasińska Paulina',
      average: 4.50,
      semester: [
        [
          {
            id: 301,
            value: '4+',
            numericValue: 4.5,
            info: 'Kategoria: Sprawdzian\nWaga: 2\nData: 2026-10-08\nNauczyciel: Paulina Kolasińska\nKomentarz: Wiązania chemiczne i hybrydyzacja',
            details: { category: 'Sprawdzian', weight: 2, date: '2026-10-08', teacher: 'Paulina Kolasińska', comment: 'Wiązania chemiczne i hybrydyzacja', inAverage: true }
          }
        ],
        []
      ]
    },
    {
      name: 'edukacja obywatelska',
      teacher: 'Czarna Alicja',
      average: 5.00,
      semester: [
        [
          {
            id: 401,
            value: '5',
            numericValue: 5.0,
            info: 'Kategoria: Projekt\nWaga: 2\nData: 2026-10-05\nNauczyciel: Alicja Czarna\nKomentarz: Prawa człowieka i obywatela w RP',
            details: { category: 'Projekt', weight: 2, date: '2026-10-05', teacher: 'Alicja Czarna', comment: 'Prawa człowieka i obywatela w RP', inAverage: true }
          }
        ],
        []
      ]
    },
    {
      name: 'edukacja zdrowotna',
      teacher: 'Spych Monika',
      average: null,
      semester: [[], []]
    },
    {
      name: 'historia',
      teacher: 'Wardyn Wojciech',
      average: 4.00,
      semester: [
        [
          {
            id: 501,
            value: '4',
            numericValue: 4.0,
            info: 'Kategoria: Kartkówka\nWaga: 1\nData: 2026-09-22\nNauczyciel: Wojciech Wardyn\nKomentarz: Reformy Sejmu Wielkiego',
            details: { category: 'Kartkówka', weight: 1, date: '2026-09-22', teacher: 'Wojciech Wardyn', comment: 'Reformy Sejmu Wielkiego', inAverage: true }
          },
          {
            id: 502,
            value: '4',
            numericValue: 4.0,
            info: 'Kategoria: Odpowiedź ustna\nWaga: 1\nData: 2026-10-02\nNauczyciel: Wojciech Wardyn\nKomentarz: Konstytucja 3 Maja',
            details: { category: 'Odpowiedź ustna', weight: 1, date: '2026-10-02', teacher: 'Wojciech Wardyn', comment: 'Konstytucja 3 Maja', inAverage: true }
          },
          {
            id: 503,
            value: '4',
            numericValue: 4.0,
            info: 'Kategoria: Sprawdzian\nWaga: 2\nData: 2026-10-16\nNauczyciel: Wojciech Wardyn\nKomentarz: Rzeczpospolita w XVIII wieku',
            details: { category: 'Sprawdzian', weight: 2, date: '2026-10-16', teacher: 'Wojciech Wardyn', comment: 'Rzeczpospolita w XVIII wieku', inAverage: true }
          }
        ],
        []
      ]
    },
    {
      name: 'informatyka',
      teacher: 'Becker Adam',
      average: 6.00,
      semester: [
        [
          {
            id: 601,
            value: '6',
            numericValue: 6.0,
            info: 'Kategoria: Projekt\nWaga: 3\nData: 2026-10-10\nNauczyciel: Adam Becker\nKomentarz: Złożoność obliczeniowa i struktury grafowe',
            details: { category: 'Projekt', weight: 3, date: '2026-10-10', teacher: 'Adam Becker', comment: 'Złożoność obliczeniowa i struktury grafowe', inAverage: true }
          }
        ],
        []
      ]
    },
    {
      name: 'język angielski',
      teacher: 'Ziemba Joanna',
      average: 4.33,
      semester: [
        [
          {
            id: 701,
            value: '5',
            numericValue: 5.0,
            info: 'Kategoria: Kartkówka\nWaga: 1\nData: 2026-09-24\nNauczyciel: Joanna Ziemba\nKomentarz: Phrasal verbs unit 1',
            details: { category: 'Kartkówka', weight: 1, date: '2026-09-24', teacher: 'Joanna Ziemba', comment: 'Phrasal verbs unit 1', inAverage: true }
          },
          {
            id: 702,
            value: '5',
            numericValue: 5.0,
            info: 'Kategoria: Odpowiedź ustna\nWaga: 1\nData: 2026-10-01\nNauczyciel: Joanna Ziemba\nKomentarz: Wypowiedź na temat technologii',
            details: { category: 'Odpowiedź ustna', weight: 1, date: '2026-10-01', teacher: 'Joanna Ziemba', comment: 'Wypowiedź na temat technologii', inAverage: true }
          },
          {
            id: 703,
            value: '-',
            numericValue: null,
            info: 'Kategoria: Brak zadania\nWaga: 0\nLicz do średniej: nie\nData: 2026-10-07\nNauczyciel: Joanna Ziemba\nKomentarz: Brak eseju',
            details: { category: 'Brak zadania', weight: 0, date: '2026-10-07', teacher: 'Joanna Ziemba', comment: 'Brak eseju', inAverage: false }
          },
          {
            id: 704,
            value: '3',
            numericValue: 3.0,
            info: 'Kategoria: Sprawdzian\nWaga: 1\nData: 2026-10-15\nNauczyciel: Joanna Ziemba\nKomentarz: Reading comprehension & grammar',
            details: { category: 'Sprawdzian', weight: 1, date: '2026-10-15', teacher: 'Joanna Ziemba', comment: 'Reading comprehension & grammar', inAverage: true }
          }
        ],
        []
      ]
    },
    {
      name: 'język angielski zawodowy',
      teacher: 'Ziemba Joanna',
      average: 5.00,
      semester: [
        [
          {
            id: 801,
            value: '5',
            numericValue: 5.0,
            info: 'Kategoria: Słownictwo techniczne\nWaga: 2\nData: 2026-10-13\nNauczyciel: Joanna Ziemba\nKomentarz: Computer Hardware and Architecture glossary',
            details: { category: 'Słownictwo techniczne', weight: 2, date: '2026-10-13', teacher: 'Joanna Ziemba', comment: 'Computer Hardware and Architecture glossary', inAverage: true }
          }
        ],
        []
      ]
    },
    {
      name: 'język niemiecki',
      teacher: 'Chyła Beata',
      average: 3.00,
      semester: [
        [
          {
            id: 901,
            value: '4+',
            numericValue: 4.5,
            info: 'Kategoria: Kartkówka\nWaga: 1\nData: 2026-09-25\nNauczyciel: Beata Chyła\nKomentarz: Słownictwo rozdział 1',
            details: { category: 'Kartkówka', weight: 1, date: '2026-09-25', teacher: 'Beata Chyła', comment: 'Słownictwo rozdział 1', inAverage: true }
          },
          {
            id: 902,
            value: '2+',
            numericValue: 2.5,
            info: 'Kategoria: Odpowiedź ustna\nWaga: 1\nData: 2026-10-02\nNauczyciel: Beata Chyła\nKomentarz: Dialog w sklepie',
            details: { category: 'Odpowiedź ustna', weight: 1, date: '2026-10-02', teacher: 'Beata Chyła', comment: 'Dialog w sklepie', inAverage: true }
          },
          {
            id: 903,
            value: '2',
            numericValue: 2.0,
            info: 'Kategoria: Sprawdzian\nWaga: 1\nData: 2026-10-12\nNauczyciel: Beata Chyła\nKomentarz: Czasowniki nieregularne i przeszłe',
            details: { category: 'Sprawdzian', weight: 1, date: '2026-10-12', teacher: 'Beata Chyła', comment: 'Czasowniki nieregularne i przeszłe', inAverage: true }
          },
          {
            id: 904,
            value: '-',
            numericValue: null,
            info: 'Kategoria: Brak zadania\nWaga: 0\nLicz do średniej: nie\nData: 2026-10-16\nNauczyciel: Beata Chyła\nKomentarz: Ćwiczenia gramatyczne',
            details: { category: 'Brak zadania', weight: 0, date: '2026-10-16', teacher: 'Beata Chyła', comment: 'Ćwiczenia gramatyczne', inAverage: false }
          }
        ],
        []
      ]
    },
    {
      name: 'język polski',
      teacher: 'Negowska Alicja',
      average: 3.50,
      semester: [
        [
          {
            id: 1001,
            value: '1',
            numericValue: 1.0,
            info: 'Kategoria: Kartkówka\nWaga: 1\nData: 2026-09-20\nNauczyciel: Alicja Negowska\nKomentarz: Znajomość treści lektury',
            details: { category: 'Kartkówka', weight: 1, date: '2026-09-20', teacher: 'Alicja Negowska', comment: 'Znajomość treści lektury', inAverage: true }
          },
          {
            id: 1002,
            value: '4',
            numericValue: 4.0,
            info: 'Kategoria: Odpowiedź ustna\nWaga: 1\nData: 2026-10-04\nNauczyciel: Alicja Negowska\nKomentarz: Analiza wiersza romantycznego',
            details: { category: 'Odpowiedź ustna', weight: 1, date: '2026-10-04', teacher: 'Alicja Negowska', comment: 'Analiza wiersza romantycznego', inAverage: true }
          },
          {
            id: 1003,
            value: '5+',
            numericValue: 5.5,
            info: 'Kategoria: Wypracowanie\nWaga: 1\nData: 2026-10-14\nNauczyciel: Alicja Negowska\nKomentarz: Rozprawka problemowa — Konrad Wallenrod',
            details: { category: 'Wypracowanie', weight: 1, date: '2026-10-14', teacher: 'Alicja Negowska', comment: 'Rozprawka problemowa — Konrad Wallenrod', inAverage: true }
          }
        ],
        []
      ]
    },
    {
      name: 'lokalne sieci komputerowe',
      teacher: 'Wojnarowski Przemysław',
      average: 5.00,
      semester: [
        [
          {
            id: 1101,
            value: '5',
            numericValue: 5.0,
            info: 'Kategoria: Laboratorium\nWaga: 2\nData: 2026-10-09\nNauczyciel: Przemysław Wojnarowski\nKomentarz: Konfiguracja routingu statycznego i RIP',
            details: { category: 'Laboratorium', weight: 2, date: '2026-10-09', teacher: 'Przemysław Wojnarowski', comment: 'Konfiguracja routingu statycznego i RIP', inAverage: true }
          }
        ],
        []
      ]
    },
    {
      name: 'matematyka',
      teacher: 'Behr Zbigniew',
      average: 3.67,
      semester: [
        [
          {
            id: 1201,
            value: '3',
            numericValue: 3.0,
            info: 'Kategoria: Sprawdzian\nWaga: 2\nData: 2026-09-22\nNauczyciel: Zbigniew Behr\nKomentarz: Wzory skróconego mnożenia i równania kwadratowe',
            details: { category: 'Sprawdzian', weight: 2, date: '2026-09-22', teacher: 'Zbigniew Behr', comment: 'Wzory skróconego mnożenia i równania kwadratowe', inAverage: true }
          },
          {
            id: 1202,
            value: '5',
            numericValue: 5.0,
            info: 'Kategoria: Kartkówka\nWaga: 1\nData: 2026-09-30\nNauczyciel: Zbigniew Behr\nKomentarz: Postać kanoniczna i iloczynowa trójmianu',
            details: { category: 'Kartkówka', weight: 1, date: '2026-09-30', teacher: 'Zbigniew Behr', comment: 'Postać kanoniczna i iloczynowa trójmianu', inAverage: true }
          },
          {
            id: 1203,
            value: '5',
            numericValue: 5.0,
            info: 'Kategoria: Praca na lekcji\nWaga: 1\nData: 2026-10-05\nNauczyciel: Zbigniew Behr\nKomentarz: Zadania z parametrem',
            details: { category: 'Praca na lekcji', weight: 1, date: '2026-10-05', teacher: 'Zbigniew Behr', comment: 'Zadania z parametrem', inAverage: true }
          },
          {
            id: 1204,
            value: '3',
            numericValue: 3.0,
            info: 'Kategoria: Odpowiedź ustna\nWaga: 1\nData: 2026-10-12\nNauczyciel: Zbigniew Behr\nKomentarz: Wykres funkcji kwadratowej',
            details: { category: 'Odpowiedź ustna', weight: 1, date: '2026-10-12', teacher: 'Zbigniew Behr', comment: 'Wykres funkcji kwadratowej', inAverage: true }
          },
          {
            id: 1205,
            value: '3',
            numericValue: 3.0,
            info: 'Kategoria: Kartkówka\nWaga: 1\nData: 2026-10-16\nNauczyciel: Zbigniew Behr\nKomentarz: Nierówności kwadratowe',
            details: { category: 'Kartkówka', weight: 1, date: '2026-10-16', teacher: 'Zbigniew Behr', comment: 'Nierówności kwadratowe', inAverage: true }
          }
        ],
        []
      ]
    },
    {
      name: 'pracownia lokalnych sieci komputerowych',
      teacher: 'Kżyś Łukasz',
      average: 5.00,
      semester: [
        [
          {
            id: 1301,
            value: '5',
            numericValue: 5.0,
            info: 'Kategoria: Ćwiczenia praktyczne\nWaga: 2\nData: 2026-10-01\nNauczyciel: Łukasz Kżyś\nKomentarz: Zarabianie patchcordów RJ-45 w standardzie T568B',
            details: { category: 'Ćwiczenia praktyczne', weight: 2, date: '2026-10-01', teacher: 'Łukasz Kżyś', comment: 'Zarabianie patchcordów RJ-45 w standardzie T568B', inAverage: true }
          },
          {
            id: 1302,
            value: '5',
            numericValue: 5.0,
            info: 'Kategoria: Sprawdzian praktyczny\nWaga: 2\nData: 2026-10-15\nNauczyciel: Łukasz Kżyś\nKomentarz: Pomiary toru transmisyjnego miernikiem sieciowym',
            details: { category: 'Sprawdzian praktyczny', weight: 2, date: '2026-10-15', teacher: 'Łukasz Kżyś', comment: 'Pomiary toru transmisyjnego miernikiem sieciowym', inAverage: true }
          }
        ],
        []
      ]
    },
    {
      name: 'pracownia systemów operacyjnych',
      teacher: 'Reszka Sławomir',
      average: null,
      semester: [[], []]
    },
    {
      name: 'pracownia urządzeń techniki komputerowej',
      teacher: 'Wojnarowski Przemysław',
      average: 5.00,
      semester: [
        [
          {
            id: 1401,
            value: '5',
            numericValue: 5.0,
            info: 'Kategoria: Montaż podzespołów\nWaga: 2\nData: 2026-10-06\nNauczyciel: Przemysław Wojnarowski\nKomentarz: Montaż procesora i układu chłodzenia cieczą',
            details: { category: 'Montaż podzespołów', weight: 2, date: '2026-10-06', teacher: 'Przemysław Wojnarowski', comment: 'Montaż procesora i układu chłodzenia cieczą', inAverage: true }
          }
        ],
        []
      ]
    },
    {
      name: 'religia',
      teacher: 'Ks. Katecheta',
      average: null,
      semester: [[], []]
    },
    {
      name: 'systemy operacyjne',
      teacher: 'Wojnarowski Przemysław',
      average: 5.00,
      semester: [
        [
          {
            id: 1501,
            value: '5',
            numericValue: 5.0,
            info: 'Kategoria: Kolokwium\nWaga: 2\nData: 2026-10-07\nNauczyciel: Przemysław Wojnarowski\nKomentarz: Uprawnienia chmod, chown i system plików ext4',
            details: { category: 'Kolokwium', weight: 2, date: '2026-10-07', teacher: 'Przemysław Wojnarowski', comment: 'Uprawnienia chmod, chown i system plików ext4', inAverage: true }
          },
          {
            id: 1502,
            value: '-',
            numericValue: null,
            info: 'Kategoria: Brak zadania\nWaga: 0\nLicz do średniej: nie\nData: 2026-10-14\nNauczyciel: Przemysław Wojnarowski\nKomentarz: Ćwiczenie z potokami IPC',
            details: { category: 'Brak zadania', weight: 0, date: '2026-10-14', teacher: 'Przemysław Wojnarowski', comment: 'Ćwiczenie z potokami IPC', inAverage: false }
          }
        ],
        []
      ]
    },
    {
      name: 'urządzenia techniki komputerowej',
      teacher: 'Cembik Bartosz',
      average: 2.75,
      semester: [
        [
          {
            id: 1601,
            value: '3-',
            numericValue: 2.75,
            info: 'Kategoria: Sprawdzian\nWaga: 2\nData: 2026-10-14\nNauczyciel: Bartosz Cembik\nKomentarz: Interfejsy pamięci RAM DDR4/DDR5 i magistrale PCIe',
            details: { category: 'Sprawdzian', weight: 2, date: '2026-10-14', teacher: 'Bartosz Cembik', comment: 'Interfejsy pamięci RAM DDR4/DDR5 i magistrale PCIe', inAverage: true }
          }
        ],
        []
      ]
    },
    {
      name: 'wychowanie fizyczne',
      teacher: 'Łysakowski Grzegorz',
      average: null,
      semester: [
        [
          {
            id: 1701,
            value: '-',
            numericValue: null,
            info: 'Kategoria: Strój / Aktywność\nWaga: 0\nLicz do średniej: nie\nData: 2026-10-09\nNauczyciel: Grzegorz Łysakowski\nKomentarz: Zwolnienie lekarskie',
            details: { category: 'Strój / Aktywność', weight: 0, date: '2026-10-09', teacher: 'Grzegorz Łysakowski', comment: 'Zwolnienie lekarskie', inAverage: false }
          }
        ],
        []
      ]
    },
    {
      name: 'zajęcia z wychowawcą',
      teacher: 'Ziemba Joanna',
      average: null,
      semester: [[], []]
    }
  ];

  const stats = computeGradeStats(mockSubjects);
  return {
    isDemo: true,
    luckyNumber: 17,
    lastSync: new Date().toISOString(),
    status: 'demo',
    ...stats,
    overallAverage: 4.35
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
    const teacherMatch = rawTitle.match(/nauczyciel:\s*(.*?)(?=\s*godziny:|$)/i);
    const hoursMatch = rawTitle.match(/godziny:\s*([^\n\r]+)/i);
    const teacher = teacherMatch && teacherMatch[1].trim() ? teacherMatch[1].trim() : 'Nauczyciel';
    const hours = hoursMatch && hoursMatch[1].trim() ? hoursMatch[1].trim() : 'Cały dzień';

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

    // Pobierz szczegóły tylko jeśli brakuje kluczowych pól (oszczędność dziesiątek zapytań HTTP)
    const needsDetails = (parsed.type === 'absence' && (!parsed.teacher || parsed.teacher === 'Nauczyciel')) ||
                         (parsed.type !== 'absence' && (!parsed.subject || parsed.subject === 'Zajęcia szkolne'));

    if (needsDetails && it.id && typeof it.id === 'number' && it.id > 0) {
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
  return {
    isDemo: true,
    lastSync: new Date().toISOString(),
    events: [
      {
        id: 9101,
        date: '2026-10-19',
        type: 'absence',
        category: 'Nieobecność nauczyciela',
        title: 'Nieobecność: Prabucki Andrzej',
        teacher: 'Prabucki Andrzej',
        time: '08:00 do 12:15',
        subject: null,
        description: 'Nieobecność nauczyciela: Prabucki Andrzej (08:00 do 12:15)'
      },
      {
        id: 9102,
        date: '2026-10-19',
        type: 'absence',
        category: 'Nieobecność nauczyciela',
        title: 'Nieobecność: Wardyn Wojciech',
        teacher: 'Wardyn Wojciech',
        time: '08:00 do 08:45',
        subject: null,
        description: 'Nieobecność nauczyciela: Wardyn Wojciech (08:00 do 08:45)'
      },
      {
        id: 9103,
        date: '2026-10-19',
        type: 'absence',
        category: 'Nieobecność nauczyciela',
        title: 'Nieobecność: Łysakowski Grzegorz',
        teacher: 'Łysakowski Grzegorz',
        time: '08:50 do 10:25',
        subject: null,
        description: 'Nieobecność nauczyciela: Łysakowski Grzegorz (08:50 do 10:25)'
      },
      {
        id: 9104,
        date: '2026-10-19',
        type: 'kartkowka',
        category: 'Kartkówka',
        title: 'Kartkówka: Biznes i zarządzanie',
        teacher: 'Sokół Paweł',
        time: 'Lekcja 5 (11:30)',
        subject: 'Biznes i zarządzanie',
        description: 'Kartkówka z form działalności gospodarczej (2TI T)'
      },
      {
        id: 9105,
        date: '2026-10-20',
        type: 'absence',
        category: 'Nieobecność nauczyciela',
        title: 'Nieobecność: Negowska Alicja',
        teacher: 'Negowska Alicja',
        time: '12:20 do 15:40',
        subject: null,
        description: 'Nieobecność nauczyciela: Negowska Alicja (12:20 do 15:40)'
      },
      {
        id: 9106,
        date: '2026-10-20',
        type: 'absence',
        category: 'Nieobecność nauczyciela',
        title: 'Nieobecność: Łysakowski Grzegorz',
        teacher: 'Łysakowski Grzegorz',
        time: 'Cały dzień',
        subject: null,
        description: 'Nieobecność nauczyciela: Łysakowski Grzegorz'
      },
      {
        id: 9107,
        date: '2026-10-20',
        type: 'inne',
        category: 'Zastępstwo',
        title: 'Zastępstwo: Joanna Ziemba',
        teacher: 'Ziemba Joanna',
        time: 'Lekcja 4 i 5 (10:40 - 12:15)',
        subject: 'Język angielski',
        description: 'Zastępstwo z Joanna Ziemba na lekcji 4 i 5 (j.ang 2 TI gr.1)'
      },
      {
        id: 9108,
        date: '2026-10-21',
        type: 'absence',
        category: 'Nieobecność nauczyciela',
        title: 'Nieobecność: Czarna Alicja',
        teacher: 'Czarna Alicja',
        time: 'Cały dzień',
        subject: null,
        description: 'Nieobecność nauczyciela: Czarna Alicja'
      },
      {
        id: 9109,
        date: '2026-10-21',
        type: 'kartkowka',
        category: 'Kartkówka',
        title: 'Kartkówka: Biologia',
        teacher: 'Łukaszczyk-Wulgaris Joanna',
        time: 'Lekcja 1 (08:00)',
        subject: 'Biologia',
        description: 'Kartkówka z budowy komórki (2TI T)'
      },
      {
        id: 9110,
        date: '2026-10-21',
        type: 'sprawdzian',
        category: 'Praca Klasowa',
        title: 'Praca Klasowa: Biologia',
        teacher: 'Łukaszczyk-Wulgaris Joanna',
        time: 'Lekcja 2 (08:50)',
        subject: 'Biologia',
        description: 'Praca Klasowa: Składniki komórkowe i procesy metaboliczne (2TI T)'
      },
      {
        id: 9111,
        date: '2026-10-22',
        type: 'absence',
        category: 'Nieobecność nauczyciela',
        title: 'Nieobecność: Czarna Alicja',
        teacher: 'Czarna Alicja',
        time: 'Cały dzień',
        subject: null,
        description: 'Nieobecność nauczyciela: Czarna Alicja'
      },
      {
        id: 9112,
        date: '2026-10-22',
        type: 'sprawdzian',
        category: 'Praca Klasowa',
        title: 'Praca Klasowa: Matematyka',
        teacher: 'Behr Zbigniew',
        time: 'Lekcja 0 (07:10)',
        subject: 'Matematyka',
        description: 'Praca Klasowa przedlekcyjna'
      },
      {
        id: 9113,
        date: '2026-10-23',
        type: 'absence',
        category: 'Nieobecność nauczyciela',
        title: 'Nieobecność: Czarna Alicja',
        teacher: 'Czarna Alicja',
        time: 'Cały dzień',
        subject: null,
        description: 'Nieobecność nauczyciela: Czarna Alicja'
      },
      {
        id: 9114,
        date: '2026-10-23',
        type: 'odwolane',
        category: 'Odwołane zajęcia',
        title: 'Odwołane zajęcia: Edukacja obywatelska',
        teacher: 'Czarna Alicja',
        time: 'Lekcja 1 (08:00)',
        subject: 'Edukacja obywatelska',
        description: 'Odwołane zajęcia: Alicja Czarna na lekcji nr: 1'
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
  if (!lessonStartStr || !lessonEndStr) return false;
  if (absenceRangeStr === null || absenceRangeStr === undefined) return false;
  if (typeof absenceRangeStr !== 'string') return false;

  const lower = absenceRangeStr.toLowerCase().trim();
  if (lower === '' || lower.includes('cały dzień') || lower === 'caly dzien') return true;

  // Wyodrębnij godziny z absencji np. '08:50 do 14:50' lub '08:50 - 14:50'
  const timeMatches = absenceRangeStr.match(/(\d{1,2}:\d{2})/g);
  if (!timeMatches || timeMatches.length < 2) return false;

  const absStart = parseTimeToMinutes(timeMatches[0]);
  const absEnd = parseTimeToMinutes(timeMatches[1]);

  const lStart = parseTimeToMinutes(lessonStartStr);
  const lEnd = parseTimeToMinutes(lessonEndStr);

  // Nakładanie przedziałów [lStart, lEnd] i [absStart, absEnd]
  return Math.max(lStart, absStart) < Math.min(lEnd, absEnd);
}

/**
 * Parsuje kod HTML planu lekcji Librus Synergia z bezpośrednim wykrywaniem lekcji odwołanych.
 */
export function parseTimetableHtml($, from, to) {
  const days = [
    "Monday",
    "Tuesday", 
    "Wednesday", 
    "Thursday", 
    "Friday", 
    "Saturday", 
    "Sunday"
  ];
  const DAY_KEYS_MAP = {
    Monday: 'monday',
    Tuesday: 'tuesday',
    Wednesday: 'wednesday',
    Thursday: 'thursday',
    Friday: 'friday',
    Saturday: 'saturday',
    Sunday: 'sunday'
  };

  const table = {};
  const hours = [];
  const allLessons = [];

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

  // W Synergii wiersze planu lekcji posiadają naprzemiennie klasy .line0 oraz .line1
  let rows = $("table.decorated.plan-lekcji tbody tr").filter((_, tr) => $(tr).find("th").length > 0 && $(tr).find("td").length > 0);
  if (rows.length === 0) {
    rows = $("tr.line0, tr.line1").filter((_, tr) => $(tr).find("th").length > 0 && $(tr).find("td").length > 0);
  }
  if (rows.length === 0) {
    rows = $("tr.line1").filter((_, tr) => $(tr).find("th").length > 0 && $(tr).find("td").length > 0);
  }

  rows.each((rowIndex, row) => {
    const hour = $(row).find("th").text().trim();
    if (hour && !hours.includes(hour)) hours.push(hour);

    const allTds = $(row).find("td");
    let lessonCells = allTds;
    if (allTds.length >= 7 || (allTds.length > 5 && $(allTds[0]).find(".text").length === 0 && /^\d+$/.test($(allTds[0]).text().trim()))) {
      lessonCells = allTds.slice(1, -1);
    }

    lessonCells.each((dayIndex, cell) => {
      if (dayIndex >= days.length) return;
      const dayName = days[dayIndex];
      const dayId = DAY_KEYS_MAP[dayName] || dayName.toLowerCase();
      if (!table[dayId]) table[dayId] = [];

      const $cell = $(cell);
      if (!$cell.text().trim()) return;

      const times = (hour || '').replace(/\u00a0/g, ' ').split(/\s*-\s*/);
      const timeStart = (times[0] || '08:00').trim();
      const timeEnd = (times[1] || '08:45').trim();

      const parseCellDetails = (rawSubject, rawTeacherRoom, isCancelledLesson, isSubstitutionLesson = false) => {
        let cleanSubj = (rawSubject || '')
          .replace(/odwołan\w*/gi, '')
          .replace(/\(odwołane\)/gi, '')
          .replace(/zastępstw\w*/gi, '')
          .replace(/\(zastępstwo\)/gi, '')
          .replace(/[()]/g, '')
          .trim();
        if (!cleanSubj) return null;

        let teacher = '';
        let room = '';
        if (rawTeacherRoom) {
          let trText = rawTeacherRoom.replace(/<[^>]*>/g, '').trim();
          trText = trText.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
          if (trText.startsWith('-')) trText = trText.substring(1).trim();
          const match = trText.match(/^(.+?)\s+s\.\s+(.+)$/);
          teacher = match ? match[1].trim() : trText;
          room = match ? (match[2].trim().startsWith('s.') ? match[2].trim() : `s. ${match[2].trim()}`) : '';
        }

        const cleanTeacher = cleanTeacherName(teacher);
        const subjectFormatted = capitalize(cleanSubj);
        const lessonId = `librus_${dayId}_${rowIndex}_${timeStart.replace(':', '')}${isCancelledLesson ? '_c' : isSubstitutionLesson ? '_s' : ''}`;

        const status = isCancelledLesson ? 'cancelled' : isSubstitutionLesson ? 'substitution' : 'active';
        const statusLabel = isCancelledLesson ? 'Odwołana' : isSubstitutionLesson ? 'Zastępstwo' : 'Aktywna';

        return {
          id: lessonId,
          day: dayId,
          subject: subjectFormatted,
          time_start: timeStart,
          time_end: timeEnd,
          room: room,
          teacher: teacher || '',
          cleanTeacher: cleanTeacher,
          type: determineType(subjectFormatted),
          color: isCancelledLesson ? 'rose' : isSubstitutionLesson ? 'amber' : determineColor(subjectFormatted),
          notes: isCancelledLesson 
            ? '[!] Lekcja odwołana w Librus Synergia' 
            : isSubstitutionLesson 
              ? `[~] Zastępstwo w Librus Synergia${teacher ? ` (nauczyciel: ${teacher})` : ''}` 
              : (teacher ? `Nauczyciel: ${teacher}` : ''),
          isCancelled: Boolean(isCancelledLesson),
          isSubstitution: Boolean(isSubstitutionLesson),
          status,
          statusLabel,
          isLibrus: true
        };
      };

      const addLessonIfUnique = (lesson) => {
        if (!lesson) return;
        const exists = table[dayId].some(ex => ex.id === lesson.id && ex.subject === lesson.subject);
        if (!exists) {
          table[dayId].push(lesson);
          allLessons.push(lesson);
        }
      };

      const hasStrike = $cell.find("s").length > 0;
      const planInfoText = $cell.find(".plan-lekcji-info").text().trim();
      const isCancelledByInfo = /odwołan/i.test(planInfoText);
      const isSubstitutionByInfo = /zastęp/i.test(planInfoText);

      // 1. Sprawdź czy jest odwołana lekcja (tag <s> lub plan-lekcji-info: odwołane)
      if (hasStrike || isCancelledByInfo) {
        let struckSubj = '';
        let struckTeacherRoom = '';

        if (hasStrike) {
          const sElements = $cell.find("s");
          struckSubj = $(sElements[0]).text().trim();
          if (sElements.length > 1) {
            struckTeacherRoom = $(sElements[1]).text().trim();
          }
        }
        
        if (!struckSubj) {
          const textDiv = $cell.find(".text").first();
          const fullHtml = textDiv.length > 0 ? textDiv.html() : $cell.html();
          const parts = (fullHtml || '').split(/<br\s*\/?>/i);
          struckSubj = parts[0] ? parts[0].replace(/<[^>]*>/g, '').trim() : '';
          struckTeacherRoom = parts[1] ? parts[1].replace(/<[^>]*>/g, '').trim() : '';
        }

        const cancelledLesson = parseCellDetails(struckSubj, struckTeacherRoom, true, false);
        addLessonIfUnique(cancelledLesson);
      }

      // 2. Sprawdź czy jest aktywna lekcja (b lub tekst niebędący w s)
      const activeB = $cell.find("b").filter((_, el) => $(el).closest("s").length === 0);

      if (activeB.length > 0) {
        activeB.each((bIdx, bEl) => {
          const activeSubj = $(bEl).text().trim();
          const textDiv = $(bEl).closest(".text");
          let activeTR = '';
          if (textDiv.length > 0) {
            const parts = (textDiv.html() || '').split(/<br\s*\/?>/i);
            if (parts.length > 1) {
              const tempDiv = $('<div>').html(parts.slice(1).join('<br>'));
              tempDiv.find("s, .plan-lekcji-info").remove();
              activeTR = tempDiv.text().trim();
            }
          }
          const lesson = parseCellDetails(activeSubj, activeTR, false, isSubstitutionByInfo);
          addLessonIfUnique(lesson);
        });
      } else if (!hasStrike && !isCancelledByInfo) {
        const textDiv = $cell.find(".text").first();
        const fullHtml = textDiv.length > 0 ? textDiv.html() : $cell.html();
        const parts = (fullHtml || '').split(/<br\s*\/?>/i);
        const subj = parts[0] ? parts[0].replace(/<[^>]*>/g, '').trim() : '';
        const tr = parts[1] ? parts[1].replace(/<[^>]*>/g, '').trim() : '';
        const fallbackLesson = parseCellDetails(subj, tr, false, isSubstitutionByInfo);
        addLessonIfUnique(fallbackLesson);
      }
    });
  });

  return {
    hours,
    table,
    lessons: allLessons
  };
}

/**
 * Pobiera tygodniowy plan lekcji z Librus Synergia i normalizuje strukturę.
 */
export async function fetchLibrusTimetableFromSource(client, from, to) {
  // 1. Bezpośrednie pobranie HTML ze scraperem obsługującym tagi <s> i odwołane lekcje
  if (client && typeof client._request === 'function') {
    try {
      const FormDataClass = (await import('form-data')).default;
      const formData = new FormDataClass();
      if (from && to) {
        formData.append("tydzien", `${from}_${to}`);
      }
      const $ = await client._request("post", "przegladaj_plan_lekcji", formData);
      if ($ && typeof $ === 'function') {
        const parsed = parseTimetableHtml($, from, to);
        if (parsed && parsed.lessons && parsed.lessons.length > 0) {
          return parsed;
        }
      }
    } catch (reqErr) {
      console.warn('[!] ALERT :: LIBRUS :: Bezpośrednie zapytanie HTML nie powiodło się, używam standardowego parsera:', reqErr.message);
    }
  }

  // 2. Standardowy fallback do client.calendar.getTimetable
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

      const isCancelled = item.isCancelled || 
                          /odwołan/i.test(item.subject) || 
                          /odwołan/i.test(item.notes || '') ||
                          /odwołan/i.test(item.status || '');

      // Rozbij time np. '08:50 - 09:35'
      const times = (item.time || '').replace(/\u00a0/g, ' ').split(/\s*-\s*/);
      const timeStart = (times[0] || '08:00').trim();
      const timeEnd = (times[1] || '08:45').trim();

      const cleanTeacher = cleanTeacherName(item.teacher);
      const cleanSubject = item.subject.replace(/\(odwołane\)/gi, '').trim();
      const subjectFormatted = capitalize(cleanSubject);
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
        notes: isCancelled ? '[!] Lekcja odwołana w Librus Synergia' : (item.teacher ? `Nauczyciel: ${item.teacher}` : ''),
        isCancelled: !!isCancelled,
        status: isCancelled ? 'cancelled' : (item.status || 'active'),
        statusLabel: isCancelled ? 'Odwołana' : (item.statusLabel || 'Aktywna'),
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
      await importLessonsToSchedule(correlated.lessons);
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
    // Poniedziałek (2026-10-19)
    { id: 'librus_mon_2', day: 'monday', subject: 'Informatyka', time_start: '08:50', time_end: '09:35', room: 's. 04', teacher: 'Becker Adam (2 TI gr.2)', type: 'Laboratorium', color: 'cyan', notes: 'Pracownia informatyczna s. 04' },
    { id: 'librus_mon_3', day: 'monday', subject: 'Informatyka', time_start: '09:40', time_end: '10:25', room: 's. 04', teacher: 'Becker Adam (2 TI gr.2)', type: 'Laboratorium', color: 'cyan', notes: 'Pracownia informatyczna s. 04' },
    { id: 'librus_mon_4', day: 'monday', subject: 'Biznes i zarządzanie', time_start: '10:40', time_end: '11:25', room: 's. 0.2', teacher: 'Sokół Paweł', type: 'Wykład', color: 'blue', notes: '' },
    { id: 'librus_mon_5', day: 'monday', subject: 'Lokalne sieci komputerowe', time_start: '11:30', time_end: '12:15', room: 's. 0.2', teacher: 'Wojnarowski Przemysław', type: 'Wykład', color: 'cyan', notes: '' },
    { id: 'librus_mon_6', day: 'monday', subject: 'Język polski', time_start: '12:20', time_end: '13:05', room: 's. 34', teacher: 'Negowska Alicja', type: 'Wykład', color: 'rose', notes: '' },

    // Wtorek (2026-10-20)
    { id: 'librus_tue_1', day: 'tuesday', subject: 'Pracownia urządzeń techniki komputerowej', time_start: '08:00', time_end: '08:45', room: 's. 0.1', teacher: 'Wojnarowski Przemysław (2TI gr.1)', type: 'Laboratorium', color: 'cyan', notes: '' },
    { id: 'librus_tue_2', day: 'tuesday', subject: 'Pracownia urządzeń techniki komputerowej', time_start: '08:50', time_end: '09:35', room: 's. 0.1', teacher: 'Wojnarowski Przemysław (2TI gr.1)', type: 'Laboratorium', color: 'cyan', notes: '' },
    { id: 'librus_tue_3', day: 'tuesday', subject: 'Zajęcia z wychowawcą', time_start: '09:40', time_end: '10:25', room: 's. 28', teacher: 'Ziemba Joanna', type: 'Wykład', color: 'amber', notes: '' },
    { 
      id: 'librus_tue_4', 
      day: 'tuesday', 
      subject: 'Język angielski', 
      time_start: '10:40', 
      time_end: '11:25', 
      room: '', 
      teacher: 'Ziemba Joanna (j.ang 2 TI gr.1)', 
      type: 'Lektorat', 
      color: 'amber', 
      isSubstitution: true, 
      status: 'substitution', 
      statusLabel: 'Zastępstwo', 
      notes: '[~] Zastępstwo w Librus Synergia (Joanna Ziemba)' 
    },
    { 
      id: 'librus_tue_5', 
      day: 'tuesday', 
      subject: 'Język angielski', 
      time_start: '11:30', 
      time_end: '12:15', 
      room: '', 
      teacher: 'Ziemba Joanna (j.ang 2 TI gr.1)', 
      type: 'Lektorat', 
      color: 'amber', 
      isSubstitution: true, 
      status: 'substitution', 
      statusLabel: 'Zastępstwo', 
      notes: '[~] Zastępstwo w Librus Synergia (Joanna Ziemba)' 
    },
    { id: 'librus_tue_6', day: 'tuesday', subject: 'Pracownia systemów operacyjnych', time_start: '12:20', time_end: '13:05', room: 's. 1.15', teacher: 'Reszka Sławomir (2 TI gr.1 PSO)', type: 'Laboratorium', color: 'cyan', notes: '' },
    { id: 'librus_tue_7', day: 'tuesday', subject: 'Pracownia systemów operacyjnych', time_start: '13:15', time_end: '14:00', room: 's. 1.15', teacher: 'Reszka Sławomir (2 TI gr.1 PSO)', type: 'Laboratorium', color: 'cyan', notes: '' },
    { id: 'librus_tue_8', day: 'tuesday', subject: 'Edukacja zdrowotna', time_start: '14:05', time_end: '14:50', room: 's. 35', teacher: 'Spych Monika', type: 'Wykład', color: 'emerald', notes: '' },
    { id: 'librus_tue_9', day: 'tuesday', subject: 'Matematyka', time_start: '14:55', time_end: '15:40', room: 's. 28', teacher: 'Behr Zbigniew', type: 'Wykład', color: 'indigo', notes: '' },

    // Środa (2026-10-21)
    { id: 'librus_wed_1', day: 'wednesday', subject: 'Biologia', time_start: '08:00', time_end: '08:45', room: 's. 03', teacher: 'Łukaszczyk-Wulgaris Joanna', type: 'Wykład', color: 'emerald', notes: '' },
    { id: 'librus_wed_2', day: 'wednesday', subject: 'Biologia', time_start: '08:50', time_end: '09:35', room: 's. 03', teacher: 'Łukaszczyk-Wulgaris Joanna', type: 'Wykład', color: 'emerald', notes: '' },
    { id: 'librus_wed_3', day: 'wednesday', subject: 'Systemy operacyjne', time_start: '09:40', time_end: '10:25', room: 's. 1.2', teacher: 'Wojnarowski Przemysław', type: 'Laboratorium', color: 'cyan', notes: '' },
    { id: 'librus_wed_4', day: 'wednesday', subject: 'Systemy operacyjne', time_start: '10:40', time_end: '11:25', room: 's. 1.2', teacher: 'Wojnarowski Przemysław', type: 'Laboratorium', color: 'cyan', notes: '' },
    { id: 'librus_wed_5', day: 'wednesday', subject: 'Urządzenia techniki komputerowej', time_start: '11:30', time_end: '12:15', room: 's. 1.2', teacher: 'Cembik Bartosz', type: 'Laboratorium', color: 'cyan', notes: '' },
    { id: 'librus_wed_6', day: 'wednesday', subject: 'Urządzenia techniki komputerowej', time_start: '12:20', time_end: '13:05', room: 's. 1.2', teacher: 'Cembik Bartosz', type: 'Laboratorium', color: 'cyan', notes: '' },
    { id: 'librus_wed_7', day: 'wednesday', subject: 'Chemia', time_start: '13:15', time_end: '14:00', room: 's. 03', teacher: 'Kolasińska Paulina', type: 'Wykład', color: 'emerald', notes: '' },
    { id: 'librus_wed_8', day: 'wednesday', subject: 'Historia', time_start: '14:05', time_end: '14:50', room: 's. 05', teacher: 'Wardyn Wojciech', type: 'Wykład', color: 'rose', notes: '' },
    { id: 'librus_wed_9', day: 'wednesday', subject: 'Matematyka', time_start: '14:55', time_end: '15:40', room: 's. 28', teacher: 'Behr Zbigniew', type: 'Wykład', color: 'indigo', notes: '' },

    // Czwartek (2026-10-22)
    { id: 'librus_thu_2', day: 'thursday', subject: 'Język angielski', time_start: '08:50', time_end: '09:35', room: 's. 22', teacher: 'Ziemba Joanna (j.ang 2 TI gr.1)', type: 'Lektorat', color: 'amber', notes: '' },
    { id: 'librus_thu_3', day: 'thursday', subject: 'Język angielski', time_start: '09:40', time_end: '10:25', room: 's. 22', teacher: 'Ziemba Joanna (j.ang 2 TI gr.1)', type: 'Lektorat', color: 'amber', notes: '' },
    { id: 'librus_thu_4', day: 'thursday', subject: 'Pracownia lokalnych sieci komputerowych', time_start: '10:40', time_end: '11:25', room: 's. 1.16', teacher: 'Kżyś Łukasz', type: 'Laboratorium', color: 'cyan', notes: '' },
    { id: 'librus_thu_5', day: 'thursday', subject: 'Pracownia lokalnych sieci komputerowych', time_start: '11:30', time_end: '12:15', room: 's. 1.16', teacher: 'Kżyś Łukasz', type: 'Laboratorium', color: 'cyan', notes: '' },
    { id: 'librus_thu_6', day: 'thursday', subject: 'Matematyka', time_start: '12:20', time_end: '13:05', room: 's. 05', teacher: 'Behr Zbigniew', type: 'Wykład', color: 'indigo', notes: '' },
    { id: 'librus_thu_7', day: 'thursday', subject: 'Matematyka', time_start: '13:15', time_end: '14:00', room: 's. 05', teacher: 'Behr Zbigniew', type: 'Wykład', color: 'indigo', notes: '' },
    { id: 'librus_thu_8', day: 'thursday', subject: 'Język angielski zawodowy', time_start: '14:05', time_end: '14:50', room: 's. 22', teacher: 'Ziemba Joanna (j.ang.zaw. 2 TI gr.1)', type: 'Lektorat', color: 'amber', notes: '' },

    // Piątek (2026-10-23)
    { 
      id: 'librus_fri_1', 
      day: 'friday', 
      subject: 'Edukacja obywatelska', 
      time_start: '08:00', 
      time_end: '08:45', 
      room: '', 
      teacher: 'Czarna Alicja', 
      type: 'Wykład', 
      color: 'rose', 
      notes: '[!] ODWOŁANA (nieobecność nauczyciela: Alicja Czarna)',
      isCancelled: true,
      status: 'cancelled',
      statusLabel: 'Odwołana',
      absenceAlert: {
        isAbsent: true,
        teacher: 'Czarna Alicja',
        hours: '08:00 do 08:45',
        date: '2026-10-23',
        description: 'Nieobecność nauczyciela: Czarna Alicja'
      }
    },
    { id: 'librus_fri_2', day: 'friday', subject: 'Wychowanie fizyczne', time_start: '08:50', time_end: '09:35', room: '', teacher: 'Łysakowski Grzegorz (Klasa 2 TI)', type: 'Ćwiczenia', color: 'purple', notes: '' },
    { id: 'librus_fri_3', day: 'friday', subject: 'Język niemiecki', time_start: '09:40', time_end: '10:25', room: 's. 21', teacher: 'Chyła Beata (2TI/1)', type: 'Lektorat', color: 'amber', notes: '' },
    { id: 'librus_fri_4', day: 'friday', subject: 'Język niemiecki', time_start: '10:40', time_end: '11:25', room: 's. 21', teacher: 'Chyła Beata (2TI/1)', type: 'Lektorat', color: 'amber', notes: '' },
    { id: 'librus_fri_5', day: 'friday', subject: 'Chemia', time_start: '11:30', time_end: '12:15', room: 's. 19', teacher: 'Kolasińska Paulina', type: 'Wykład', color: 'emerald', notes: '' },
    { id: 'librus_fri_6', day: 'friday', subject: 'Język polski', time_start: '12:20', time_end: '13:05', room: 's. 34', teacher: 'Negowska Alicja', type: 'Wykład', color: 'rose', notes: '' },
    { id: 'librus_fri_7', day: 'friday', subject: 'Język polski', time_start: '13:15', time_end: '14:00', room: 's. 34', teacher: 'Negowska Alicja', type: 'Wykład', color: 'rose', notes: '' }
  ];

  const normalizedLessons = demoLessons.map(l => ({
    isCancelled: Boolean(l.isCancelled),
    isSubstitution: Boolean(l.isSubstitution),
    status: l.status || (l.isCancelled ? 'cancelled' : l.isSubstitution ? 'substitution' : 'active'),
    statusLabel: l.statusLabel || (l.isCancelled ? 'Odwołana' : l.isSubstitution ? 'Zastępstwo' : 'Aktywna'),
    ...l
  }));

  return {
    isDemo: true,
    lastSync: new Date().toISOString(),
    hours: [
      '07:10 - 07:55',
      '08:00 - 08:45',
      '08:50 - 09:35',
      '09:40 - 10:25',
      '10:40 - 11:25',
      '11:30 - 12:15',
      '12:20 - 13:05',
      '13:15 - 14:00',
      '14:05 - 14:50',
      '14:55 - 15:40',
      '15:45 - 16:30'
    ],
    lessons: normalizedLessons,
    substitutions: [
      {
        lessonId: 'librus_tue_4',
        day: 'tuesday',
        subject: 'Język angielski',
        time_start: '10:40',
        time_end: '11:25',
        teacher: 'Ziemba Joanna (j.ang 2 TI gr.1)',
        absenceTeacher: 'Negowska Alicja',
        absenceHours: '10:40 - 11:25',
        absenceDate: '2026-10-20'
      },
      {
        lessonId: 'librus_tue_5',
        day: 'tuesday',
        subject: 'Język angielski',
        time_start: '11:30',
        time_end: '12:15',
        teacher: 'Ziemba Joanna (j.ang 2 TI gr.1)',
        absenceTeacher: 'Negowska Alicja',
        absenceHours: '11:30 - 12:15',
        absenceDate: '2026-10-20'
      }
    ]
  };
}

/**
 * Resetuje tabele cache Librusa (SQLite i Firestore) i zasila je autentycznymi danymi źródłowymi.
 */
export async function resetAndSeedLibrusDatabase() {
  console.log('[*] INFO :: LIBRUS :: Inicjalizacja procedury resetu i re-seeding bazy Librusa...');
  const gradesPayload = getDemoGradesData();
  const timetablePayload = getDemoTimetableData();
  const calendarPayload = getDemoCalendarData();

  // 1. Zapis do SQLite: librus_cache
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
    await executeRun(`DELETE FROM librus_cache WHERE id = 1`);
    await executeRun(
      `INSERT INTO librus_cache (id, data, lucky_number, last_sync, status, error_message)
       VALUES (1, ?, ?, datetime('now'), 'ok', NULL)`,
      [JSON.stringify(gradesPayload), gradesPayload.luckyNumber]
    );
    console.log('[+] SUCCESS :: LIBRUS :: librus_cache zresetowany i zasilony autentycznymi ocenami.');
  } catch (err) {
    console.error('[!] ERROR :: LIBRUS :: Błąd resetu librus_cache w SQLite:', err.message);
  }

  // 2. Zapis do SQLite: librus_timetable_cache
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
    await executeRun(`DELETE FROM librus_timetable_cache WHERE id = 1`);
    await executeRun(
      `INSERT INTO librus_timetable_cache (id, data, last_sync, status, error_message)
       VALUES (1, ?, datetime('now'), 'ok', NULL)`,
      [JSON.stringify(timetablePayload)]
    );
    console.log('[+] SUCCESS :: LIBRUS :: librus_timetable_cache zresetowany i zasilony autentycznym planem.');
  } catch (err) {
    console.error('[!] ERROR :: LIBRUS :: Błąd resetu librus_timetable_cache w SQLite:', err.message);
  }

  // 3. Zapis do SQLite: librus_calendar_cache
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
    await executeRun(`DELETE FROM librus_calendar_cache WHERE id = 1`);
    await executeRun(
      `INSERT INTO librus_calendar_cache (id, data, last_sync, status, error_message)
       VALUES (1, ?, datetime('now'), 'ok', NULL)`,
      [JSON.stringify(calendarPayload)]
    );
    console.log('[+] SUCCESS :: LIBRUS :: librus_calendar_cache zresetowany i zasilony autentycznym terminarzem.');
  } catch (err) {
    console.error('[!] ERROR :: LIBRUS :: Błąd resetu librus_calendar_cache w SQLite:', err.message);
  }

  // 4. Aktualizacja tabeli timetable (szkolne lekcje, z zachowaniem personal)
  try {
    await executeRun(`DELETE FROM timetable WHERE category = 'librus' OR category IS NULL OR category = 'szkolne'`);
    for (const l of timetablePayload.lessons) {
      await executeRun(
        `INSERT OR REPLACE INTO timetable (id, day, subject, time_start, time_end, room, teacher, type, color, notes, category)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'librus')`,
        [l.id, l.day, l.subject, l.time_start, l.time_end, l.room || '', l.teacher || '', l.type || 'Lekcja', l.color || 'indigo', l.notes || '']
      );
    }
    console.log(`[+] SUCCESS :: LIBRUS :: Zaimportowano ${timetablePayload.lessons.length} autentycznych lekcji do tabeli timetable.`);
  } catch (err) {
    console.error('[!] ERROR :: LIBRUS :: Błąd aktualizacji tabeli timetable:', err.message);
  }

  // 5. Replikacja do Firestore
  try {
    const { getFirestoreDb } = await import('../firebase.js');
    const firestoreDb = getFirestoreDb ? getFirestoreDb() : null;
    if (firestoreDb) {
      await firestoreDb.collection('librus_cache').doc('latest').set({
        ...gradesPayload,
        updated_at: new Date().toISOString()
      });
      await firestoreDb.collection('librus_cache').doc('timetable').set({
        ...timetablePayload,
        updated_at: new Date().toISOString()
      });
      await firestoreDb.collection('librus_cache').doc('calendar').set({
        ...calendarPayload,
        updated_at: new Date().toISOString()
      });
      console.log('[+] SUCCESS :: LIBRUS :: Zreplikowano zresetowane dane do chmury Firestore (librus_cache: latest, timetable, calendar).');
    }
  } catch (fErr) {
    console.warn('[!] ALERT :: LIBRUS :: Pominięto replikację do Firestore:', fErr.message);
  }

  return {
    success: true,
    message: 'Baza danych Librusa została pomyślnie zresetowana i zasilona autentycznymi danymi źródłowymi.',
    grades: gradesPayload,
    timetable: timetablePayload,
    calendar: calendarPayload
  };
}

/**
 * Importuje lekcje z Librusa do aktywnego harmonogramu (tabela timetable w SQLite i kolekcja Firestore),
 * bezwzględnie zachowując istniejące aktywności prywatne (category: 'personal').
 */
export async function importLessonsToSchedule(lessons = []) {
  if (!Array.isArray(lessons) || lessons.length === 0) {
    return { success: true, importedCount: 0 };
  }

  try {
    await executeRun(`DELETE FROM timetable WHERE category IS NULL OR category != 'personal'`);
    for (const l of lessons) {
      const fullT = l.cleanTeacher || resolveFullTeacherName(l.teacher) || l.teacher || '';
      await executeRun(
        `INSERT OR REPLACE INTO timetable (id, day, subject, time_start, time_end, room, teacher, type, color, notes, category)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'librus')`,
        [l.id, l.day, l.subject, l.time_start, l.time_end, l.room || '', fullT, l.type || 'Wykład', l.color || 'indigo', l.notes || '']
      );
    }
    console.log(`[+] SUCCESS :: LIBRUS :: Zaimportowano ${lessons.length} lekcji do tabeli timetable.`);

    const { getFirestoreDb } = await import('../firebase.js');
    const firestoreDb = getFirestoreDb ? getFirestoreDb() : null;
    if (firestoreDb && !process.env.VITEST && process.env.NODE_ENV !== 'test') {
      const snap = await firestoreDb.collection('timetable').get();
      const batch = firestoreDb.batch();
      snap.forEach(d => {
        const dData = d.data();
        if (dData.category !== 'personal') {
          batch.delete(d.ref);
        }
      });
      for (const l of lessons) {
        const fullT = l.cleanTeacher || resolveFullTeacherName(l.teacher) || l.teacher || '';
        const docRef = firestoreDb.collection('timetable').doc(String(l.id));
        batch.set(docRef, {
          ...l,
          teacher: fullT,
          cleanTeacher: fullT,
          category: 'librus',
          updated_at: new Date().toISOString()
        });
      }
      await batch.commit();
      console.log(`[+] SUCCESS :: LIBRUS :: Zreplikowano ${lessons.length} lekcji do kolekcji Firestore timetable.`);
    }
    return { success: true, importedCount: lessons.length };
  } catch (err) {
    console.warn(`[!] ALERT :: LIBRUS :: Błąd importu do harmonogramu: ${err.message}`);
    return { success: false, error: err.message };
  }
}

/**
 * Ręczny i kompleksowy czytnik wszystkich zasobów z Librus API (Ground Truth Full Sync).
 * Pobiera: konto ucznia, szczęśliwy numerek, powiadomienia, oceny, frekwencję, terminarz wielomiesięczny oraz pełny plan lekcji dla wszystkich dni tygodnia.
 */
export async function fetchAllLibrusData(options = {}) {
  const creds = (options.login && options.password) 
    ? { login: options.login, password: options.password, isConfigured: true }
    : getLibrusCredentials();

  if (!creds.isConfigured) {
    return {
      success: false,
      error: 'Brak skonfigurowanych poświadczeń Librus Synergia w systemie lub pliku .env.'
    };
  }

  const logs = [];
  const logStep = (tag, msg) => {
    logs.push(`[${tag}] :: ${msg}`);
    console.log(`[${tag}] :: LIBRUS READER :: ${msg}`);
  };

  logStep('* INFO', 'Inicjalizacja autoryzacji sesji Librus Synergia...');
  const LibrusClass = (await import('librus-api')).default;
  const client = new LibrusClass();
  await client.authorize(creds.login, creds.password);
  logStep('+ SUCCESS', 'Pomyślna autoryzacja w Librus Synergia.');

  // 1. Informacje o koncie ucznia
  let studentInfo = null;
  try {
    logStep('* INFO', 'Pobieranie profilu ucznia i klasy...');
    const acc = await client.info.getAccountInfo();
    if (acc?.student) {
      studentInfo = {
        name: acc.student.nameSurname || '',
        class: acc.student.class || '',
        index: acc.student.index || '',
        educator: acc.student.educator || '',
        accountLogin: acc.account?.login || ''
      };
      logStep('+ SUCCESS', `Profil ucznia: ${studentInfo.name} (${studentInfo.class})`);
    }
  } catch (err) {
    logStep('! ALERT', `Pominięto profil ucznia: ${err.message}`);
  }

  // 2. Szczęśliwy numerek
  let luckyNumber = null;
  try {
    const rawLucky = await client.info.getLuckyNumber();
    luckyNumber = typeof rawLucky === 'object' && rawLucky !== null ? (rawLucky.luckyNumber || rawLucky.number || null) : rawLucky;
    luckyNumber = Number.isNaN(parseInt(luckyNumber, 10)) ? null : parseInt(luckyNumber, 10);
    logStep('+ SUCCESS', `Szczęśliwy numerek: ${luckyNumber !== null ? luckyNumber : 'brak'}`);
  } catch (err) {
    logStep('! ALERT', `Nie udało się pobrać szczęśliwego numerka: ${err.message}`);
  }

  // 3. Powiadomienia
  let notifications = null;
  try {
    notifications = await client.info.getNotifications();
  } catch {}

  // 4. Oceny (wszystkie przedmioty i semestry)
  let rawGrades = [];
  let gradeStats = null;
  try {
    logStep('* INFO', 'Pobieranie kompletnego wykazu ocen dla wszystkich przedmiotów...');
    rawGrades = await client.info.getGrades();
    gradeStats = computeGradeStats(rawGrades || []);
    logStep('+ SUCCESS', `Pobrano oceny: ${gradeStats.gradedSubjectsCount} ocenionych z ${gradeStats.totalSubjects} przedmiotów. Średnia ogólna: ${gradeStats.overallAverage}`);
  } catch (err) {
    logStep('! ALERT', `Błąd pobierania ocen: ${err.message}`);
  }

  // 5. Frekwencja i nieobecności
  let attendanceRate = null;
  let rawAbsences = [];
  try {
    logStep('* INFO', 'Pobieranie rejestru nieobecności i frekwencji...');
    if (client.absence && typeof client.absence.getAbsences === 'function') {
      const absences = await client.absence.getAbsences();
      if (Array.isArray(absences) && absences.length > 0) {
        rawAbsences = absences;
        const total = absences.length;
        const present = absences.filter(a => a.type === 'obecnosc' || a.presence).length;
        attendanceRate = parseFloat(((present / total) * 100).toFixed(1));
        logStep('+ SUCCESS', `Frekwencja ucznia: ${attendanceRate}% (${total} wpisów)`);
      }
    }
  } catch (err) {
    logStep('! ALERT', `Pominięto rejestr nieobecności: ${err.message}`);
  }

  // 6. Terminarz wielomiesięczny (bieżący i kolejny miesiąc)
  let calendarPayload = { events: [] };
  try {
    logStep('* INFO', 'Pobieranie terminarza szkolnego (sprawdziany, kartkówki, absencje)...');
    calendarPayload = await fetchLibrusCalendarFromSource(client);
    if (options.includeNextMonth !== false) {
      const now = new Date();
      let nextM = now.getMonth() + 2;
      let nextY = now.getFullYear();
      if (nextM > 12) { nextM = 1; nextY++; }
      try {
        const nextCal = await fetchLibrusCalendarFromSource(client, nextM, nextY);
        if (nextCal?.events?.length > 0) {
          const combined = [...(calendarPayload.events || []), ...nextCal.events];
          const uniqueEvents = Array.from(new Map(combined.map(e => [e.id || `${e.date}_${e.title}`, e])).values());
          calendarPayload.events = uniqueEvents.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        }
      } catch {}
    }
    logStep('+ SUCCESS', `Terminarz: pobrano ${calendarPayload.events.length} wydarzeń.`);
  } catch (err) {
    logStep('! ALERT', `Błąd terminarza: ${err.message}`);
  }

  // 7. Plan lekcji dla wszystkich dni tygodnia
  let timetablePayload = { hours: [], table: {}, lessons: [], substitutions: [] };
  try {
    logStep('* INFO', 'Pobieranie planu lekcji dla wszystkich dni tygodnia...');
    const rawTt = await fetchLibrusTimetableFromSource(client, options.from, options.to);
    const correlated = correlateTimetableWithAbsences(rawTt.lessons || [], calendarPayload.events || []);
    timetablePayload = {
      hours: rawTt.hours || [],
      table: rawTt.table || {},
      lessons: correlated.lessons || [],
      substitutions: correlated.detectedSubstitutions || [],
      lastSync: new Date().toISOString()
    };
    logStep('+ SUCCESS', `Plan lekcji: pobrano ${timetablePayload.lessons.length} lekcji dla ${Object.keys(timetablePayload.table).length} dni, wykryto ${timetablePayload.substitutions.length} zastępstw.`);
  } catch (err) {
    logStep('! ALERT', `Błąd planu lekcji: ${err.message}`);
  }

  // 8. Zapis do pamięci trwałej (SQLite + Cloud Firestore)
  if (options.saveToDb !== false) {
    logStep('* INFO', 'Zapis i synchronizacja z lokalną bazą SQLite oraz Cloud Firestore...');
    if (gradeStats) {
      await saveGradesToCache({
        isConfigured: true,
        isDemo: false,
        subjects: gradeStats.subjects,
        overallAverage: gradeStats.overallAverage,
        totalSubjects: gradeStats.totalSubjects,
        gradedSubjectsCount: gradeStats.gradedSubjectsCount,
        highestAverage: gradeStats.highestAverage,
        lowestAverage: gradeStats.lowestAverage,
        luckyNumber,
        studentInfo,
        attendanceRate,
        lastSync: new Date().toISOString()
      });
    }
    if (calendarPayload?.events?.length > 0) {
      await saveCalendarToCache(calendarPayload);
    }
    if (timetablePayload?.lessons?.length > 0) {
      await saveTimetableToCache(timetablePayload);
      if (options.importToMainSchedule) {
        await importLessonsToSchedule(timetablePayload.lessons);
      }
    }
    logStep('+ SUCCESS', 'Bazy SQLite i Cloud Firestore zostały pomyślnie zaktualizowane.');
  }

  return {
    success: true,
    timestamp: new Date().toISOString(),
    studentInfo,
    luckyNumber,
    notifications,
    grades: gradeStats,
    attendanceRate,
    calendar: calendarPayload,
    timetable: timetablePayload,
    logs
  };
}
