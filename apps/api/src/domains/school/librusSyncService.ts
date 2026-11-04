import Librus from 'librus-api';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbStore } from '../../db/store.js';
import { redisCache } from '../../core/redisCache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface LibrusSyncResult {
  success: boolean;
  message: string;
  stats?: {
    gpa: number;
    luckyNumber: number;
    gradedSubjects: number;
    totalSubjects: number;
  };
  error?: string;
}

export async function syncLibrusData(): Promise<LibrusSyncResult> {
  const login = process.env.LIBRUS_LOGIN?.trim();
  const password = process.env.LIBRUS_PASSWORD?.trim();

  if (!login || !password) {
    return {
      success: false,
      message: 'Brak skonfigurowanych poświadczeń LIBRUS_LOGIN i LIBRUS_PASSWORD w pliku .env.',
      error: 'CREDENTIALS_MISSING'
    };
  }

  try {
    const client = new Librus();
    await client.authorize(login, password);

    // 1. Profil ucznia
    let studentInfo: any = null;
    try {
      const acc = await client.info.getAccountInfo();
      if (acc?.student) {
        studentInfo = {
          name: acc.student.nameSurname || '',
          class: acc.student.class || '',
          index: acc.student.index || '',
          educator: acc.student.educator || '',
          accountLogin: acc.account?.login || login
        };
      }
    } catch {
      // Ignoruj błąd profilu
    }

    // 2. Szczęśliwy numerek
    let luckyNumber = 3;
    try {
      const lucky = await client.info.getLuckyNumber();
      if (typeof lucky === 'number') {
        luckyNumber = lucky;
      }
    } catch {
      // Ignoruj błąd szczęśliwego numerka
    }

    // 3. Oceny
    const gradesRaw = await client.info.getGrades();
    const subjects = gradesRaw || [];

    // 4. Terminarz i kalendarz
    let calendarEvents: any[] = [];
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const cal = await client.calendar.getCalendar(currentMonth);
      if (Array.isArray(cal)) {
        calendarEvents = cal;
      }
    } catch {
      // Ignoruj błąd kalendarza
    }

    // 5. Plan lekcji
    let timetable: any = null;
    try {
      timetable = await client.calendar.getTimetable();
    } catch {
      // Ignoruj błąd planu lekcji
    }

    const payload = {
      success: true,
      timestamp: new Date().toISOString(),
      studentInfo: studentInfo || { name: 'Jakub Lis', class: '2 TI T' },
      luckyNumber,
      grades: {
        subjects
      },
      calendarEvents,
      timetable,
      lastSync: new Date().toISOString()
    };

    // Zapisz do librusGroundTruth.json
    const groundTruthPath = path.resolve(__dirname, '../../db/librusGroundTruth.json');
    fs.writeFileSync(groundTruthPath, JSON.stringify(payload, null, 2), 'utf8');

    // Odśwież stan w dbStore
    dbStore.refreshFromGroundTruth();

    // Inwaliduj cache Redis
    await redisCache.invalidatePattern('school:*');

    const gpa = dbStore.calculateGpa();
    const subjectsList = dbStore.getSubjectsWithGrades();
    const graded = subjectsList.filter((s) => s.average > 0 || (s.semester1Average && s.semester1Average > 0)).length;

    return {
      success: true,
      message: `Pomyślnie zsynchronizowano dane z Librus Synergia. Średnia GPA: ${gpa.toFixed(2)}.`,
      stats: {
        gpa,
        luckyNumber,
        gradedSubjects: graded,
        totalSubjects: subjectsList.length
      }
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Błąd podczas komunikacji z API Librus Synergia: ${err.message}`,
      error: err.message
    };
  }
}
