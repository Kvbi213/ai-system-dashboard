import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname);

// Dane z planu lekcji ze zdjęcia
export const REAL_TIMETABLE = [
  // PONIEDZIAŁEK
  {
    id: 'mon_2',
    day: 'monday',
    subject: 'Informatyka / Język niemiecki',
    time_start: '08:50',
    time_end: '09:35',
    room: 'Sala 17 / Sala 14',
    teacher: 'AB / GP',
    type: 'Laboratorium',
    color: 'emerald',
    notes: 'Podział na grupy: Gr 1: Informatyka (AB, s. 17) | Gr 2: J. niemiecki (GP, s. 14)'
  },
  {
    id: 'mon_3',
    day: 'monday',
    subject: 'Informatyka / Język angielski zawodowy',
    time_start: '09:40',
    time_end: '10:25',
    room: 'Sala 17 / Sz1',
    teacher: 'AB / ZJ',
    type: 'Laboratorium',
    color: 'emerald',
    notes: 'Podział na grupy: Gr 1: Informatyka (AB, s. 17) | Gr 2: J. angielski zawodowy (ZJ, Sz1)'
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
    notes: 'Lekcja 4'
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
    notes: 'Lekcja 5'
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
    notes: 'Lekcja 6: Teoria i architektura systemów'
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
    notes: 'Lekcja 7: Warsztaty praktyczne'
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
    notes: 'Lekcja 8'
  },

  // WTOREK
  {
    id: 'tue_1',
    day: 'tuesday',
    subject: 'Pracownia urządzeń techniki komput. / Pracownia systemów oper.',
    time_start: '08:00',
    time_end: '08:45',
    room: 'Sala 1.16 / Sala 1.15',
    teacher: 'PW / SR',
    type: 'Laboratorium',
    color: 'indigo',
    notes: 'Gr 1: Pracownia urządzeń (PW, 1.16) | Gr 2: Pracownia systemów (SR, 1.15)'
  },
  {
    id: 'tue_2',
    day: 'tuesday',
    subject: 'Pracownia urządzeń techniki komput. / Pracownia systemów oper.',
    time_start: '08:50',
    time_end: '09:35',
    room: 'Sala 1.16 / Sala 1.15',
    teacher: 'PW / SR',
    type: 'Laboratorium',
    color: 'indigo',
    notes: 'Gr 1: Pracownia urządzeń (PW, 1.16) | Gr 2: Pracownia systemów (SR, 1.15)'
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
    subject: 'Wychowanie fizyczne / Język angielski',
    time_start: '10:40',
    time_end: '11:25',
    room: 'Hala / Sala 18',
    teacher: 'Gł / ZJ',
    type: 'Ćwiczenia',
    color: 'cyan',
    notes: 'Gr 1: WF (Gł, Hala) | Gr 2: J. angielski (ZJ, s. 18)'
  },
  {
    id: 'tue_5',
    day: 'tuesday',
    subject: 'Wychowanie fizyczne / Pracownia urządzeń techniki komput.',
    time_start: '11:30',
    time_end: '12:15',
    room: 'Hala / Sala 16',
    teacher: 'Gł / BG',
    type: 'Ćwiczenia',
    color: 'cyan',
    notes: 'Gr 1: WF (Gł, Hala) | Gr 2: Pracownia urządzeń (BG, s. 16)'
  },
  {
    id: 'tue_6',
    day: 'tuesday',
    subject: 'Pracownia systemów oper. / Pracownia urządzeń techniki komput.',
    time_start: '12:20',
    time_end: '13:05',
    room: 'Sala 1.2 / Sala 16',
    teacher: 'SR / BG',
    type: 'Laboratorium',
    color: 'indigo',
    notes: 'Gr 1: Pracownia systemów (SR, 1.2) | Gr 2: Pracownia urządzeń (BG, s. 16)'
  },
  {
    id: 'tue_7',
    day: 'tuesday',
    subject: 'Pracownia systemów oper. / Wychowanie fizyczne',
    time_start: '13:15',
    time_end: '14:00',
    room: 'Sala 1.2 / Hala',
    teacher: 'SR / LK',
    type: 'Laboratorium',
    color: 'indigo',
    notes: 'Gr 1: Pracownia systemów (SR, 1.2) | Gr 2: WF (LK, Hala)'
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
    notes: 'Lekcja 8'
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
    notes: 'Lekcja 4'
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
    notes: 'Lekcja 5'
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
    notes: 'Lekcja 6: Sprzęt i diagnostyka'
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
    notes: 'Lekcja 7: Warsztaty sprzętowe'
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
    notes: 'Lekcja 8'
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
    notes: 'Lekcja 9'
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
    notes: 'Lekcja 1'
  },
  {
    id: 'thu_2',
    day: 'thursday',
    subject: 'Język angielski / Wychowanie fizyczne',
    time_start: '08:50',
    time_end: '09:35',
    room: 'Sala Z2 / Hala',
    teacher: 'ZJ / LK',
    type: 'Ćwiczenia',
    color: 'amber',
    notes: 'Gr 1: J. angielski (ZJ, Z2) | Gr 2: WF (LK, Hala)'
  },
  {
    id: 'thu_3',
    day: 'thursday',
    subject: 'Język angielski zawodowy / Wychowanie fizyczne',
    time_start: '09:40',
    time_end: '10:25',
    room: 'Sala Z2 / Hala',
    teacher: 'ZJ / LK',
    type: 'Ćwiczenia',
    color: 'amber',
    notes: 'Gr 1: J. ang. zawodowy (ZJ, Z2) | Gr 2: WF (LK, Hala)'
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
    notes: 'Lekcja 4: Konfiguracja LAN'
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
    notes: 'Lekcja 5: Protokoły i routing'
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
    notes: 'Lekcja 6'
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
    notes: 'Lekcja 7'
  },
  {
    id: 'thu_8',
    day: 'thursday',
    subject: 'Język niemiecki (Grupy)',
    time_start: '14:05',
    time_end: '14:50',
    room: 'Sala Z1 / Sala 01',
    teacher: 'BC / GP',
    type: 'Lektorat',
    color: 'amber',
    notes: 'Gr 1: BC (Z1) | Gr 2: GP (01)'
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
    notes: 'Lekcja 9'
  },

  // PIĄTEK
  {
    id: 'fri_1',
    day: 'friday',
    subject: 'Język angielski / Informatyka',
    time_start: '08:00',
    time_end: '08:45',
    room: 'Sala Z2 / Sala 1.15',
    teacher: 'ZJ / AP',
    type: 'Lektorat',
    color: 'amber',
    notes: 'Gr 1: J. angielski (ZJ, Z2) | Gr 2: Informatyka (AP, 1.15)'
  },
  {
    id: 'fri_2',
    day: 'friday',
    subject: 'Język niemiecki / Informatyka',
    time_start: '08:50',
    time_end: '09:35',
    room: 'Sala Z1 / Sala 1.15',
    teacher: 'BC / AP',
    type: 'Lektorat',
    color: 'amber',
    notes: 'Gr 1: J. niemiecki (BC, Z1) | Gr 2: Informatyka (AP, 1.15)'
  },
  {
    id: 'fri_3',
    day: 'friday',
    subject: 'Wychowanie fizyczne / Język angielski',
    time_start: '09:40',
    time_end: '10:25',
    room: 'Hala / Sala 14',
    teacher: 'Gł / ZJ',
    type: 'Ćwiczenia',
    color: 'cyan',
    notes: 'Gr 1: WF (Gł, Hala) | Gr 2: J. angielski (ZJ, s. 14)'
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
    notes: 'Lekcja 4: Architektura sieciowa'
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
    notes: 'Lekcja 5'
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
    notes: 'Lekcja 6'
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
    notes: 'Lekcja 7'
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
    notes: 'Lekcja 8'
  }
];

async function seed() {
  console.log('[*] Rozpoczynanie zapisu realnego planu lekcji...');

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

      // Wyczyść ewentualne stare testowe lekcje
      const snapshot = await firestore.collection('timetable').get();
      const batch = firestore.batch();
      snapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`[*] Usunięto ${snapshot.size} poprzednich dokumentów z kolekcji timetable.`);

      // Zapisz nowe lekcje
      let count = 0;
      for (const lesson of REAL_TIMETABLE) {
        await firestore.collection('timetable').doc(lesson.id).set({
          ...lesson,
          updated_at: new Date().toISOString()
        });
        count++;
      }
      console.log(`[+] Zapisano pomyślnie ${count} lekcji w Cloud Firestore (void-potato-7721)!`);
    } catch (err) {
      console.error('[!] Błąd zapisu do Firestore:', err.message);
    }
  } else {
    console.warn('[!] Brak pliku firebase-service-account.json');
  }

  // 2. Zapis do lokalnej bazy SQLite (tasks.sqlite)
  const dbPath = path.resolve(rootDir, 'data/tasks.sqlite');
  if (fs.existsSync(path.dirname(dbPath))) {
    const db = new sqlite3.Database(dbPath);
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS timetable (
        id TEXT PRIMARY KEY,
        day TEXT NOT NULL,
        subject TEXT NOT NULL,
        time_start TEXT NOT NULL,
        time_end TEXT NOT NULL,
        room TEXT,
        teacher TEXT,
        type TEXT DEFAULT 'Wykład',
        color TEXT DEFAULT 'indigo',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run('DELETE FROM timetable');
      const stmt = db.prepare('INSERT INTO timetable (id, day, subject, time_start, time_end, room, teacher, type, color, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      REAL_TIMETABLE.forEach(l => {
        stmt.run(l.id, l.day, l.subject, l.time_start, l.time_end, l.room, l.teacher, l.type, l.color, l.notes);
      });
      stmt.finalize();
      console.log(`[+] Zapisano ${REAL_TIMETABLE.length} lekcji do lokalnej bazy SQLite (${dbPath}).`);
    });
    db.close();
  }

  console.log('[+] Zakończono proces migracji planu lekcji.');
}

seed();
