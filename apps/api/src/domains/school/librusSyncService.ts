import Librus from 'librus-api';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbStore, parseSafeAverage, parseLibrusDate, sanitizeEventInfo } from '../../db/store.js';
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

export function parseGradeInfoString(rawInfo: string) {
  const categoryMatch = rawInfo.match(/Kategoria:\s*([^\n\r]+)/i);
  const dateMatch = rawInfo.match(/Data:\s*([^\n\r]+)/i);
  const teacherMatch = rawInfo.match(/Nauczyciel:\s*([^\n\r]+)/i);
  const weightMatch = rawInfo.match(/Waga:\s*(\d+)/i);
  const inAverageMatch = rawInfo.match(/Licz do średniej:\s*([^\n\r]+)/i);
  const commentMatch = rawInfo.match(/Komentarz:\s*([^\n\r]+)/i);

  return {
    category: categoryMatch ? categoryMatch[1].trim() : 'Brak kategorii',
    date: dateMatch ? dateMatch[1].trim() : 'Październik 2026',
    teacher: teacherMatch ? teacherMatch[1].trim() : '',
    weight: weightMatch ? parseInt(weightMatch[1], 10) : 1,
    inAverage: inAverageMatch ? inAverageMatch[1].trim().toLowerCase() === 'tak' : true,
    comment: commentMatch ? commentMatch[1].trim() : ''
  };
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
        const flatList: any[] = [];
        for (const item of cal) {
          if (!item) continue;
          const nested: any[] = Array.isArray(item)
            ? item
            : (typeof item === 'object'
                ? Object.values(item).filter((v: any) => v && typeof v === 'object' && (v.id !== undefined || v.title))
                : [item]);

          for (const ev of nested) {
            const evDate = parseLibrusDate(ev.date || ev.day) || `${now.getFullYear()}-${String(currentMonth).padStart(2, '0')}-01`;
            const numericId = Number(ev.id);
            const finalId = Number.isFinite(numericId) && numericId > 0 ? numericId : (ev.id !== undefined ? String(ev.id) : `event_${flatList.length + 1}`);
            flatList.push({
              id: finalId,
              title: ev.title || 'Wydarzenie szkolne',
              day: evDate,
              date: evDate,
              time: ev.time || undefined,
              teacher: ev.teacher || undefined,
              category: ev.category || 'Terminarz Librus',
              info: sanitizeEventInfo(ev.info || ev.title)
            });
          }
        }
        calendarEvents = flatList;
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

    // Wzbogać przedmioty o pola sem1Grades, sem2Grades, znormalizowane nazwy i szczegóły ocen
    const enrichedSubjects = (subjects || []).map((sub: any) => {
      const rawName = String(sub.name || '').trim();
      const name = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : 'Brak nazwy';

      const enrichGradeItem = (g: any) => {
        const infoStr = String(g.info || g.details?.raw || '');
        const parsed = parseGradeInfoString(infoStr);
        return {
          ...g,
          details: {
            category: g.details?.category || parsed.category,
            weight: g.details?.weight !== undefined ? Number(g.details.weight) : parsed.weight,
            date: g.details?.date || parsed.date,
            teacher: g.details?.teacher || parsed.teacher,
            comment: g.details?.comment || parsed.comment,
            raw: infoStr,
            inAverage: g.details?.inAverage !== undefined ? Boolean(g.details.inAverage) : parsed.inAverage
          },
          inAverage: g.inAverage !== undefined ? Boolean(g.inAverage) : parsed.inAverage
        };
      };

      const rawSem1 = Array.isArray(sub.sem1Grades)
        ? sub.sem1Grades
        : (Array.isArray(sub.semester?.[0]?.grades) ? sub.semester[0].grades : []);
      const rawSem2 = Array.isArray(sub.sem2Grades)
        ? sub.sem2Grades
        : (Array.isArray(sub.semester?.[1]?.grades) ? sub.semester[1].grades : []);

      const sem1Grades = rawSem1.map(enrichGradeItem);
      const sem2Grades = rawSem2.map(enrichGradeItem);

      const sem1Avg = parseSafeAverage(sub.semester?.[0]?.tempAverage) ?? parseSafeAverage(sub.sem1Avg) ?? null;
      const sem2Avg = parseSafeAverage(sub.semester?.[1]?.tempAverage) ?? parseSafeAverage(sub.sem2Avg) ?? null;
      const yearAvg = parseSafeAverage(sub.tempAverage) ?? sem1Avg;

      return {
        ...sub,
        name,
        sem1Grades,
        sem2Grades,
        sem1Avg,
        sem2Avg,
        tempAverage: sem1Avg,
        average: yearAvg
      };
    });

    const payload = {
      success: true,
      isConfigured: true,
      isDemo: false,
      timestamp: new Date().toISOString(),
      studentInfo: studentInfo || { name: 'Jakub Lis', class: '2 TI T' },
      luckyNumber,
      grades: {
        subjects: enrichedSubjects
      },
      calendar: {
        events: calendarEvents
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
