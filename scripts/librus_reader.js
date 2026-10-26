/**
 * Script: librus_reader.js
 * Description: Standalone Manual Reader & Inspector for Librus Synergia API.
 *              Reads all available data (account, lucky number, notifications,
 *              grades for all subjects, full-week timetable with substitutions,
 *              calendar events and teacher absences) without restricting to a single day.
 * Standard: PROTOKÓŁ ANTIGRAVITY (NANO v3.2) — Zero-Emoji Policy
 *
 * Usage:
 *   node scripts/librus_reader.js              # Full manual read & diagnostic report
 *   node scripts/librus_reader.js --save       # Read & save to SQLite and Cloud Firestore
 *   node scripts/librus_reader.js --schedule   # Also import official lessons to active timetable
 *   node scripts/librus_reader.js --json       # Output machine-readable JSON
 */

import { fetchAllLibrusData, getLibrusCredentials } from '../modules/services/librusService.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    saveToDb: false,
    importToMainSchedule: false,
    jsonOutput: false,
    from: undefined,
    to: undefined,
    login: undefined,
    password: undefined
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--save' || arg === '-s') {
      options.saveToDb = true;
    } else if (arg === '--schedule') {
      options.saveToDb = true;
      options.importToMainSchedule = true;
    } else if (arg === '--json' || arg === '-j') {
      options.jsonOutput = true;
    } else if (arg === '--from' && args[i + 1]) {
      options.from = args[++i];
    } else if (arg === '--to' && args[i + 1]) {
      options.to = args[++i];
    } else if (arg === '--login' && args[i + 1]) {
      options.login = args[++i];
    } else if (arg === '--password' && args[i + 1]) {
      options.password = args[++i];
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();

  if (!options.jsonOutput) {
    console.log('================================================================');
    console.log('[*] LIBRUS SYNERGIA — RĘCZNY CZYTNIK API (GROUND TRUTH FULL SYNC)');
    console.log('================================================================');
    console.log(`[*] Czas wykonania: ${new Date().toISOString()}`);
    console.log(`[*] Tryb zapisu do bazy: ${options.saveToDb ? '[+] WŁĄCZONY' : '[-] WYŁĄCZONY (tylko odczyt)'}`);
    console.log(`[*] Import do aktywnego harmonogramu: ${options.importToMainSchedule ? '[+] WŁĄCZONY' : '[-] WYŁĄCZONY'}`);
    console.log('----------------------------------------------------------------');
  }

  const creds = (options.login && options.password)
    ? { login: options.login, password: options.password, isConfigured: true }
    : getLibrusCredentials();

  if (!creds.isConfigured) {
    console.error('[!] ALERT :: Brak poświadczeń Librus Synergia w pliku .env.');
    console.error('[*] Ustaw zmienne LIBRUS_LOGIN oraz LIBRUS_PASSWORD w pliku .env lub podaj argumenty:');
    console.error('    node scripts/librus_reader.js --login <login> --password <haslo>');
    process.exit(1);
  }

  try {
    const startTime = Date.now();
    const result = await fetchAllLibrusData({
      saveToDb: options.saveToDb,
      importToMainSchedule: options.importToMainSchedule,
      from: options.from,
      to: options.to,
      login: options.login,
      password: options.password
    });

    const elapsedMs = Date.now() - startTime;

    if (options.jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    }

    console.log('\n================================================================');
    console.log('[+] RAPORT WYKONAWCZY RĘCZNEGO CZYTNIKA LIBRUS API');
    console.log('================================================================');

    // 1. Profil ucznia
    console.log('\n[1] PROFIL UCZNIA & METRYKI KONTA:');
    if (result.studentInfo) {
      console.log(`  - Uczeń:         ${result.studentInfo.name || 'Nieznany'}`);
      console.log(`  - Klasa:         ${result.studentInfo.class || 'Brak'}`);
      console.log(`  - Nr z dziennika:${result.studentInfo.index || 'Brak'}`);
      console.log(`  - Wychowawca:    ${result.studentInfo.educator || 'Brak'}`);
    } else {
      console.log('  - Dane ucznia:   Brak lub pominięto');
    }
    console.log(`  - Szczęśliwy nr: ${result.luckyNumber !== null ? result.luckyNumber : 'Brak w danym dniu'}`);
    console.log(`  - Frekwencja:    ${result.attendanceRate !== null ? `${result.attendanceRate}%` : 'Brak danych'}`);

    // 2. Oceny
    console.log('\n[2] OCENY & STATYSTYKI PRZEDMIOTÓW:');
    if (result.grades) {
      console.log(`  - Średnia ważona ogólna:   ${result.grades.overallAverage || '0.00'}`);
      console.log(`  - Przedmioty ocenione:     ${result.grades.gradedSubjectsCount} / ${result.grades.totalSubjects}`);
      if (result.grades.highestAverage) {
        console.log(`  - Najwyższa średnia:       ${result.grades.highestAverage.subject} (${result.grades.highestAverage.average})`);
      }
      if (result.grades.lowestAverage) {
        console.log(`  - Najniższa średnia:        ${result.grades.lowestAverage.subject} (${result.grades.lowestAverage.average})`);
      }

      console.log('\n  SZCZEGÓŁOWY WYKAZ PRZEDMIOTÓW:');
      (result.grades.subjects || []).forEach((subj, idx) => {
        const gradesList = (subj.grades || []).map(g => g.value).join(', ') || 'brak ocen';
        const avgStr = subj.average ? subj.average.toFixed(2) : '—';
        console.log(`  ${String(idx + 1).padStart(2, ' ')}. ${subj.name.padEnd(42, ' ')} | Śr: ${avgStr.padEnd(5, ' ')} | Oceny: [${gradesList}]`);
      });
    } else {
      console.log('  [!] Brak danych o ocenach');
    }

    // 3. Plan lekcji dla wszystkich dni
    console.log('\n[3] PLAN LEKCJI DLA WSZYSTKICH DNI TYGODNIA:');
    if (result.timetable) {
      console.log(`  - Łączna liczba lekcji:    ${result.timetable.lessons.length}`);
      console.log(`  - Wykryte zastępstwa:     ${result.timetable.substitutions.length}`);

      const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const dayLabels = {
        monday: 'PONIEDZIAŁEK',
        tuesday: 'WTOREK',
        wednesday: 'ŚRODA',
        thursday: 'CZWARTEK',
        friday: 'PIĄTEK',
        saturday: 'SOBOTA',
        sunday: 'NIEDZIELA'
      };

      for (const dayKey of daysOrder) {
        const dayLessons = (result.timetable.lessons || []).filter(l => l.day === dayKey);
        console.log(`\n  --- ${dayLabels[dayKey]} (${dayLessons.length} lekcji) ---`);
        if (dayLessons.length === 0) {
          console.log('      (Brak lekcji w planie)');
        } else {
          dayLessons.forEach(l => {
            const statusTag = l.isCancelled ? '[!] ODWOŁANA ' : l.isSubstitution ? '[~] ZASTĘPSTWO' : '[+] AKTYWNA   ';
            const teacherRoom = `${l.cleanTeacher || l.teacher || '—'}${l.room ? ` (${l.room})` : ''}`;
            console.log(`      ${statusTag} | ${l.time_start} - ${l.time_end} | ${l.subject.padEnd(35, ' ')} | ${teacherRoom}`);
          });
        }
      }
    } else {
      console.log('  [!] Brak danych planu lekcji');
    }

    // 4. Terminarz i nieobecności
    console.log('\n[4] TERMINARZ SZKOLNY I NIEOBECNOŚCI NAUCZYCIELI:');
    if (result.calendar && Array.isArray(result.calendar.events)) {
      console.log(`  - Łączna liczba zdarzeń:   ${result.calendar.events.length}`);
      const absences = result.calendar.events.filter(e => e.type === 'absence');
      const exams = result.calendar.events.filter(e => e.type === 'sprawdzian' || e.type === 'kartkowka');
      console.log(`  - Nieobecności nauczycieli:${absences.length}`);
      console.log(`  - Sprawdziany i kartkówki: ${exams.length}`);

      if (absences.length > 0) {
        console.log('\n  REJESTR NIEOBECNOŚCI NAUCZYCIELI:');
        absences.slice(0, 15).forEach(a => {
          console.log(`    [~] ${a.date} | ${a.teacher.padEnd(25, ' ')} | Godziny: ${a.time || 'Cały dzień'}`);
        });
        if (absences.length > 15) {
          console.log(`    ... i ${absences.length - 15} kolejnych nieobecności.`);
        }
      }

      if (exams.length > 0) {
        console.log('\n  ZAPLANOWANE SPRAWDZIANY I KARTKÓWKI:');
        exams.forEach(ex => {
          const catTag = ex.type === 'sprawdzian' ? '[SPRAWDZIAN]' : '[KARTKÓWKA] ';
          console.log(`    ${catTag} ${ex.date} | ${ex.time ? `${ex.time} | ` : ''}${ex.title}`);
        });
      }
    }

    console.log('\n================================================================');
    console.log(`[+] SUCCESS :: Zakończono pełny odczyt Librus API w ${elapsedMs} ms.`);
    if (options.saveToDb) {
      console.log('[+] Dane zostały trwale zapisane w SQLite tasks.sqlite oraz Cloud Firestore.');
    } else {
      console.log('[*] Uruchom z flagą --save aby trwale zapisać odczytane dane do bazy.');
    }
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n[!] ERROR :: Niepowodzenie wykonania ręcznego czytnika Librus API:');
    console.error(`    ${err.message}`);
    if (err.stack) {
      console.error(`    ${err.stack.split('\n').slice(0, 4).join('\n    ')}`);
    }
    process.exit(1);
  }
}

main();
