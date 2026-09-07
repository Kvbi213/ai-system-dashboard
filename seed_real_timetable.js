import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname);

// Plan lekcji - GRUPA 1 (zawsze pierwsza pozycja z planu)
export const GROUP1_TIMETABLE = [
  // PONIEDZIAŁEK
  {
    id: 'mon_2',
    day: 'monday',
    subject: 'Informatyka',
    time_start: '08:50',
    time_end: '09:35',
    room: 'Sala 17',
    teacher: 'AB',
    type: 'Laboratorium',
    color: 'emerald',
    notes: 'Grupa 1'
  },
  {
    id: 'mon_3',
    day: 'monday',
    subject: 'Informatyka',
    time_start: '09:40',
    time_end: '10:25',
    room: 'Sala 17',
    teacher: 'AB',
    type: 'Laboratorium',
    color: 'emerald',
    notes: 'Grupa 1'
  },
  {
    id: 'mon_4',
    day: 'monday',
    subject: 'Chemia',
    time_start: '10:40',
    time_end: '11:25',
    room: 'Sala 31',
    teacher: 'KP',
    type: 'Wykład',
    color: 'amber',
    notes: ''
  },
  {
    id: 'mon_5',
    day: 'monday',
    subject: 'Edukacja zdrowotna',
    time_start: '11:30',
    time_end: '12:15',
    room: 'Sala 38',
    teacher: 'MS',
    type: 'Wykład',
    color: 'cyan',
    notes: ''
  },
  {
    id: 'mon_6',
    day: 'monday',
    subject: 'Systemy operacyjne',
    time_start: '12:20',
    time_end: '13:05',
    room: 'Sala 1.2',
    teacher: 'PW',
    type: 'Laboratorium',
    color: 'indigo',
    notes: 'Teoria i architektura systemów'
  },
  {
    id: 'mon_7',
    day: 'monday',
    subject: 'Systemy operacyjne',
    time_start: '13:15',
    time_end: '14:00',
    room: 'Sala 1.2',
    teacher: 'PW',
    type: 'Laboratorium',
    color: 'indigo',
    notes: 'Warsztaty praktyczne'
  },
  {
    id: 'mon_8',
    day: 'monday',
    subject: 'Biznes i zarządzanie',
    time_start: '14:05',
    time_end: '14:50',
    room: 'Sala 0.2',
    teacher: 'PS',
    type: 'Wykład',
    color: 'purple',
    notes: ''
  },

  // WTOREK
  {
    id: 'tue_1',
    day: 'tuesday',
    subject: 'Pracownia urządzeń techniki komputerowej',
    time_start: '08:00',
    time_end: '08:45',
    room: 'Sala 1.16',
    teacher: 'PW',
    type: 'Laboratorium',
    color: 'indigo',
    notes: 'Grupa 1'
  },
  {
    id: 'tue_2',
    day: 'tuesday',
    subject: 'Pracownia urządzeń techniki komputerowej',
    time_start: '08:50',
    time_end: '09:35',
    room: 'Sala 1.16',
    teacher: 'PW',
    type: 'Laboratorium',
    color: 'indigo',
    notes: 'Grupa 1'
  },
  {
    id: 'tue_3',
    day: 'tuesday',
    subject: 'Zajęcia z wychowawcą',
    time_start: '09:40',
    time_end: '10:25',
    room: 'Sala 1.16',
    teacher: 'ZJ',
    type: 'Inne',
    color: 'blue',
    notes: 'Godzina wychowawcza'
  },
  {
    id: 'tue_4',
    day: 'tuesday',
    subject: 'Wychowanie fizyczne',
    time_start: '10:40',
    time_end: '11:25',
    room: 'Hala',
    teacher: 'Gł',
    type: 'Ćwiczenia',
    color: 'cyan',
    notes: 'Grupa 1'
  },
  {
    id: 'tue_5',
    day: 'tuesday',
    subject: 'Wychowanie fizyczne',
    time_start: '11:30',
    time_end: '12:15',
    room: 'Hala',
    teacher: 'Gł',
    type: 'Ćwiczenia',
    color: 'cyan',
    notes: 'Grupa 1'
  },
  {
    id: 'tue_6',
    day: 'tuesday',
    subject: 'Pracownia systemów operacyjnych',
    time_start: '12:20',
    time_end: '13:05',
    room: 'Sala 1.2',
    teacher: 'SR',
    type: 'Laboratorium',
    color: 'indigo',
    notes: 'Grupa 1'
  },
  {
    id: 'tue_7',
    day: 'tuesday',
    subject: 'Pracownia systemów operacyjnych',
    time_start: '13:15',
    time_end: '14:00',
    room: 'Sala 1.2',
    teacher: 'SR',
    type: 'Laboratorium',
    color: 'indigo',
    notes: 'Grupa 1'
  },
  {
    id: 'tue_8',
    day: 'tuesday',
    subject: 'Matematyka',
    time_start: '14:05',
    time_end: '14:50',
    room: 'Sala 24',
    teacher: 'ZB',
    type: 'Wykład',
    color: 'rose',
    notes: ''
  },

  // ŚRODA
  {
    id: 'wed_4',
    day: 'wednesday',
    subject: 'Religia',
    time_start: '10:40',
    time_end: '11:25',
    room: 'Sala 1.16',
    teacher: 'R3',
    type: 'Wykład',
    color: 'amber',
    notes: ''
  },
  {
    id: 'wed_5',
    day: 'wednesday',
    subject: 'Biologia',
    time_start: '11:30',
    time_end: '12:15',
    room: 'Sala 19',
    teacher: 'JŁ',
    type: 'Wykład',
    color: 'emerald',
    notes: ''
  },
  {
    id: 'wed_6',
    day: 'wednesday',
    subject: 'Urządzenia techniki komputerowej',
    time_start: '12:20',
    time_end: '13:05',
    room: 'Sala 1.16',
    teacher: 'BG',
    type: 'Laboratorium',
    color: 'indigo',
    notes: 'Sprzęt i diagnostyka'
  },
  {
    id: 'wed_7',
    day: 'wednesday',
    subject: 'Urządzenia techniki komputerowej',
    time_start: '13:15',
    time_end: '14:00',
    room: 'Sala 1.16',
    teacher: 'BG',
    type: 'Laboratorium',
    color: 'indigo',
    notes: 'Warsztaty sprzętowe'
  },
  {
    id: 'wed_8',
    day: 'wednesday',
    subject: 'Historia',
    time_start: '14:05',
    time_end: '14:50',
    room: 'Sala 06',
    teacher: 'WW',
    type: 'Wykład',
    color: 'purple',
    notes: ''
  },
  {
    id: 'wed_9',
    day: 'wednesday',
    subject: 'Matematyka',
    time_start: '14:55',
    time_end: '15:40',
    room: 'Sala 24',
    teacher: 'ZB',
    type: 'Wykład',
    color: 'rose',
    notes: ''
  },

  // CZWARTEK
  {
    id: 'thu_1',
    day: 'thursday',
    subject: 'Język polski',
    time_start: '08:00',
    time_end: '08:45',
    room: 'Sala 34',
    teacher: 'AN',
    type: 'Wykład',
    color: 'blue',
    notes: ''
  },
  {
    id: 'thu_2',
    day: 'thursday',
    subject: 'Język angielski',
    time_start: '08:50',
    time_end: '09:35',
    room: 'Sala Z2',
    teacher: 'ZJ',
    type: 'Lektorat',
    color: 'amber',
    notes: 'Grupa 1'
  },
  {
    id: 'thu_3',
    day: 'thursday',
    subject: 'Język angielski zawodowy',
    time_start: '09:40',
    time_end: '10:25',
    room: 'Sala Z2',
    teacher: 'ZJ',
    type: 'Lektorat',
    color: 'amber',
    notes: 'Grupa 1'
  },
  {
    id: 'thu_4',
    day: 'thursday',
    subject: 'Pracownia lokalnych sieci komputerowych',
    time_start: '10:40',
    time_end: '11:25',
    room: 'Sala 1.16',
    teacher: 'KŁ',
    type: 'Laboratorium',
    color: 'cyan',
    notes: 'Konfiguracja LAN'
  },
  {
    id: 'thu_5',
    day: 'thursday',
    subject: 'Pracownia lokalnych sieci komputerowych',
    time_start: '11:30',
    time_end: '12:15',
    room: 'Sala 1.16',
    teacher: 'KŁ',
    type: 'Laboratorium',
    color: 'cyan',
    notes: 'Protokoły i routing'
  },
  {
    id: 'thu_6',
    day: 'thursday',
    subject: 'Matematyka',
    time_start: '12:20',
    time_end: '13:05',
    room: 'Sala 35',
    teacher: 'ZB',
    type: 'Wykład',
    color: 'rose',
    notes: ''
  },
  {
    id: 'thu_7',
    day: 'thursday',
    subject: 'Matematyka',
    time_start: '13:15',
    time_end: '14:00',
    room: 'Sala 35',
    teacher: 'ZB',
    type: 'Wykład',
    color: 'rose',
    notes: ''
  },
  {
    id: 'thu_8',
    day: 'thursday',
    subject: 'Język niemiecki',
    time_start: '14:05',
    time_end: '14:50',
    room: 'Sala Z1',
    teacher: 'BC',
    type: 'Lektorat',
    color: 'amber',
    notes: 'Grupa 1'
  },
  {
    id: 'thu_9',
    day: 'thursday',
    subject: 'Biologia',
    time_start: '14:55',
    time_end: '15:40',
    room: 'Sala 19',
    teacher: 'JŁ',
    type: 'Wykład',
    color: 'emerald',
    notes: ''
  },

  // PIĄTEK
  {
    id: 'fri_1',
    day: 'friday',
    subject: 'Język angielski',
    time_start: '08:00',
    time_end: '08:45',
    room: 'Sala Z2',
    teacher: 'ZJ',
    type: 'Lektorat',
    color: 'amber',
    notes: 'Grupa 1'
  },
  {
    id: 'fri_2',
    day: 'friday',
    subject: 'Język niemiecki',
    time_start: '08:50',
    time_end: '09:35',
    room: 'Sala Z1',
    teacher: 'BC',
    type: 'Lektorat',
    color: 'amber',
    notes: 'Grupa 1'
  },
  {
    id: 'fri_3',
    day: 'friday',
    subject: 'Wychowanie fizyczne',
    time_start: '09:40',
    time_end: '10:25',
    room: 'Hala',
    teacher: 'Gł',
    type: 'Ćwiczenia',
    color: 'cyan',
    notes: 'Grupa 1'
  },
  {
    id: 'fri_4',
    day: 'friday',
    subject: 'Lokalne sieci komputerowe',
    time_start: '10:40',
    time_end: '11:25',
    room: 'Sala 1.16',
    teacher: 'PW',
    type: 'Laboratorium',
    color: 'cyan',
    notes: 'Architektura sieciowa'
  },
  {
    id: 'fri_5',
    day: 'friday',
    subject: 'Chemia',
    time_start: '11:30',
    time_end: '12:15',
    room: 'Sala 31',
    teacher: 'KP',
    type: 'Wykład',
    color: 'amber',
    notes: ''
  },
  {
    id: 'fri_6',
    day: 'friday',
    subject: 'Edukacja obywatelska',
    time_start: '12:20',
    time_end: '13:05',
    room: 'Sala 09',
    teacher: 'AC',
    type: 'Wykład',
    color: 'purple',
    notes: ''
  },
  {
    id: 'fri_7',
    day: 'friday',
    subject: 'Język polski',
    time_start: '13:15',
    time_end: '14:00',
    room: 'Sala 34',
    teacher: 'AN',
    type: 'Wykład',
    color: 'blue',
    notes: ''
  },
  {
    id: 'fri_8',
    day: 'friday',
    subject: 'Język polski',
    time_start: '14:05',
    time_end: '14:50',
    room: 'Sala 34',
    teacher: 'AN',
    type: 'Wykład',
    color: 'blue',
    notes: ''
  }
];

async function seed() {
  console.log('[*] Rozpoczynanie zapisu planu lekcji GRUPY 1...');

  // 1. Zapis do Cloud Firestore
  const saPath = path.resolve(rootDir, 'firebase-service-account.json');
  if (fs.existsSync(saPath)) {
    try {
      const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
      if (!getApps().length) {
        initializeApp({ credential: cert(sa), projectId: 'void-potato-7721' });
      }
      const firestore = getFirestore();
      console.log('[+] Połączono z Cloud Firestore (void-potato-7721).');

      // Wyczyść ewentualne stare lekcje
      const snapshot = await firestore.collection('timetable').get();
      const batch = firestore.batch();
      snapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`[*] Usunięto ${snapshot.size} poprzednich dokumentów z kolekcji timetable.`);

      // Zapisz nowe lekcje wyłącznie dla Grupy 1
      let count = 0;
      for (const lesson of GROUP1_TIMETABLE) {
        await firestore.collection('timetable').doc(lesson.id).set({
          ...lesson,
          updated_at: new Date().toISOString()
        });
        count++;
      }
      console.log(`[+] Zapisano pomyślnie ${count} lekcji dla Grupy 1 w Cloud Firestore (void-potato-7721)!`);
    } catch (err) {
      console.error('[!] Błąd zapisu do Firestore:', err.message);
    }
  }

  // 2. Zapis do lokalnej bazy SQLite (tasks.sqlite)
  const dbPath = path.resolve(rootDir, 'data/tasks.sqlite');
  if (fs.existsSync(path.dirname(dbPath))) {
    const db = new sqlite3.Database(dbPath);
    db.serialize(() => {
      db.run('DELETE FROM timetable');
      const stmt = db.prepare('INSERT INTO timetable (id, day, subject, time_start, time_end, room, teacher, type, color, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      GROUP1_TIMETABLE.forEach(l => {
        stmt.run(l.id, l.day, l.subject, l.time_start, l.time_end, l.room, l.teacher, l.type, l.color, l.notes);
      });
      stmt.finalize();
      console.log(`[+] Zapisano ${GROUP1_TIMETABLE.length} lekcji Grupy 1 do lokalnej bazy SQLite.`);
    });
    db.close();
  }

  // 3. Zaktualizuj modules/services/cloudSync.js
  const csPath = path.resolve(rootDir, 'modules/services/cloudSync.js');
  if (fs.existsSync(csPath)) {
    let csContent = fs.readFileSync(csPath, 'utf8');
    const regex = /timetable:\s*\[[\s\S]*?\n\s*\]\s*\n\};/;
    const replacement = 'timetable: ' + JSON.stringify(GROUP1_TIMETABLE, null, 4) + '\n};';
    csContent = csContent.replace(regex, replacement);
    fs.writeFileSync(csPath, csContent, 'utf8');
    console.log('[+] Zaktualizowano modules/services/cloudSync.js danymi Grupy 1.');
  }

  console.log('[+] Zakończono pomyślnie konfigurację planu dla Grupy 1.');
}

seed();
