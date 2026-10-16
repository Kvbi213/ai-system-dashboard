import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeRun, executeQuery, initDB } from '../modules/database.js';
import { getFirestoreDb } from '../modules/firebase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../');

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const PERSONAL_ROUTINE_BLOCKS = [
  {
    code: 'wake',
    subject: 'Poranny rozruch',
    time_start: '06:00',
    time_end: '06:30',
    room: 'Dom',
    teacher: 'Rutyna',
    type: 'Inne',
    color: 'amber',
    notes: 'Pobudka, szklanka wody + 5g kreatyny przygotowane wieczorem na biurku. Szybka toaleta i wyjście.'
  },
  {
    code: 'dinner',
    subject: 'Obiad & Reset',
    time_start: '16:15',
    time_end: '17:00',
    room: 'Dom',
    teacher: 'Posiłek',
    type: 'Inne',
    color: 'emerald',
    notes: 'Spokojny obiad (paliwo na resztę dnia) i chwila na odcięcie się od szkoły.'
  },
  {
    code: 'chill',
    subject: 'Blok B: Czas dla siebie / Chill',
    time_start: '18:00',
    time_end: '20:00',
    room: 'Strefa Chill',
    teacher: 'Odpoczynek',
    type: 'Inne',
    color: 'cyan',
    notes: 'Relaks, gierki, znajomi, e-pet – czas na zresetowanie głowy.'
  },
  {
    code: 'dev',
    subject: 'Blok C: Praca głęboka / Kodowanie / Unity',
    time_start: '20:00',
    time_end: '22:30',
    room: 'Workstation',
    teacher: 'PROTOCOL: BLACKOUT',
    type: 'Projekt',
    color: 'indigo',
    notes: 'Dwie godziny skupienia na własnych projektach, zleceń i dłubaniu przy silniku PROTOCOL: BLACKOUT.'
  },
  {
    code: 'sleep',
    subject: 'Wyciszenie i Sen',
    time_start: '22:30',
    time_end: '23:00',
    room: 'Sypialnia',
    teacher: 'Regeneracja',
    type: 'Inne',
    color: 'slate',
    notes: 'Szybki prysznic, odstawienie ekranów, melatonina z melisą. 23:00: Odcięcie – równiutkie 7 godzin snu do 06:00 rano.'
  }
];

const WORKOUT_PLAN_MARKDOWN = `### Zasady Treningowe
- **Częstotliwość:** Poniedziałek / Środa / Piątek (30–40 min na strychu + po treningu szejk WPC)
- **Serie:** 2 serie robocze na każde ćwiczenie (poprzedzone krótką rozgrzewką i 1 serią lekką)
- **Powtórzenia:** 8–12 w serii. Progresja: jeśli domkniesz 12 powtórzeń z zapasem techniki – dokładasz ciężar lub mocniejszą gumę.
- **Przerwy:** 1,5–2 minuty między seriami

### Zestaw Ćwiczeń (Full Body Workout):
1. **Podciąganie na drążku (nachwyt lub z gumą)**
   - *Partia:* Plecy + Biceps
   - *Objętość:* 2 serie × 8–12 powtórzeń
   - *Wskazówki:* Klasyczne podciąganie nachwytem. Jeśli brakuje siły na czyste powtórzenia, przewiń gumę oporową przez drążek i wrzuć w nią kolano lub stopę.
2. **Dipy na poręczach lub Pompki klasyczne**
   - *Partia:* Klatka + Barki + Triceps
   - *Objętość:* 2 serie × 8–12 powtórzeń
   - *Wskazówki:* Jeśli dipy są za ciężkie, rób klasyczne pompki na podłodze. Jeśli wchodzą gładko – wykonuj dipy na poręczach.
3. **Wiosłowanie hantlem w opadzie tułowia**
   - *Partia:* Grzbiet + Ramiona
   - *Objętość:* 2 serie na stronę × 8–12 powtórzeń
   - *Wskazówki:* Oprzyj jedną rękę i kolano na ławce/skrzyni, w drugiej trzymaj hantel i przyciągaj go płynnie do biodra.
4. **Wyciskanie hantli nad głowę stojąc (OHP)**
   - *Partia:* Barki
   - *Objętość:* 2 serie × 8–12 powtórzeń
   - *Wskazówki:* Stojąc stabilnie na mocnych nogach, trzymaj hantle przy barkach i wyciskaj je pionowo nad głowę.
5. **Przysiady z hantlem przy klatce (Goblet Squat)**
   - *Partia:* Nogi
   - *Objętość:* 2 serie × 10–12 powtórzeń
   - *Wskazówki:* Trzymaj jeden hantel pionowo oburącz przy klatce piersiowej i wykonaj głęboki, kontrolowany przysiad.
6. **Unoszenie kolan do klatki w wiszeniu**
   - *Partia:* Brzuch / Core
   - *Objętość:* 2 serie × 10–12 powtórzeń
   - *Wskazówki:* Wisisz stabilnie na drążku i podciągasz kolana w górę do poziomu klatki piersiowej, pracując brzuchem.`;

const BRAIN_FACTS = [
  {
    id: 'brain_daily_routine_v1',
    category: 'Rutyna & Schemat Dnia',
    fact: 'Stały schemat dnia (Poniedziałek – Piątek): 06:00-06:30 Poranny rozruch (pobudka, woda + 5g kreatyny z biurka, toaleta), 06:30-16:15 Szkoła i powrót do domu, 16:15-17:00 Obiad & Reset (odcięcie od szkoły, paliwo), 17:00-18:00 Blok A (Pon/Śr/Pt: Trening na strychu 30-40 min FBW + szejk WPC; Wt/Czw: Nauka 1h do sprawdzianów), 18:00-20:00 Blok B (Chill, gierki, znajomi, e-pet, reset głowy), 20:00-22:30 Blok C (Praca głęboka: 2h kodowania, Unity, silnik PROTOCOL: BLACKOUT, zlecenia), 22:30-23:00 Wyciszenie (prysznic, odstawienie ekranów, melatonina z melisą), 23:00-06:00 Sen (stałe 7 godzin regeneracji).'
  },
  {
    id: 'brain_workout_plan_v1',
    category: 'Plan Treningowy',
    fact: 'Plan Treningowy FBW na strychu (Poniedziałek / Środa / Piątek, 30-40 min, po treningu szejk WPC): 2 serie robocze po 8-12 powtórzeń (rozgrzewka + 1 seria lekka, przerwy 1.5-2 min, progresja ciężarem/gumą przy 12 powt.): 1. Podciąganie na drążku nachwyt/guma (Plecy+Biceps, 2x8-12), 2. Dipy na poręczach / pompki (Klatka+Barki+Triceps, 2x8-12), 3. Wiosłowanie hantlem w opadzie (Grzbiet+Ramiona, 2x8-12 na stronę), 4. Wyciskanie hantli OHP stojąc (Barki, 2x8-12), 5. Przysiady z hantlem Goblet Squat (Nogi, 2x10-12), 6. Unoszenie kolan do klatki w wiszeniu (Brzuch/Core, 2x10-12).'
  },
  {
    id: 'brain_supplements_v1',
    category: 'Suplementacja & Regeneracja',
    fact: 'Suplementacja i regeneracja: Rano po przebudzeniu szklanka wody + 5g kreatyny (przygotowane wieczorem). Po treningu siłowym: szejk białkowy WPC. Wieczorem o 22:30: melatonina z melisą przed snem. Regularny sen 7 godzin (23:00-06:00).'
  }
];

async function seed() {
  console.log('[*] Inicjalizacja seedera: Stały Schemat Dnia & Plan Treningowy...');
  await initDB();

  // 1. TIMETABLE: Budowanie listy pozycji osobistych dla każdego dnia Pon-Pt
  const timetableItems = [];

  for (const day of DAYS) {
    const isWorkoutDay = ['monday', 'wednesday', 'friday'].includes(day);

    // Standardowe bloki stałe
    for (const b of PERSONAL_ROUTINE_BLOCKS) {
      timetableItems.push({
        id: `personal_${day}_${b.code}`,
        day: day,
        subject: b.subject,
        time_start: b.time_start,
        time_end: b.time_end,
        room: b.room,
        teacher: b.teacher,
        type: b.type,
        color: b.color,
        notes: b.notes,
        category: 'personal',
        isPersonal: true
      });
    }

    // Blok A: Trening vs Nauka
    if (isWorkoutDay) {
      timetableItems.push({
        id: `personal_${day}_block_a_workout`,
        day: day,
        subject: 'Blok A: Trening Full Body (Strych)',
        time_start: '17:00',
        time_end: '18:00',
        room: 'Strych',
        teacher: 'FBW Trening',
        type: 'Ćwiczenia',
        color: 'purple',
        notes: 'Wchodzisz na strych, robisz 30–40 min zestaw Full Body + po treningu szejk WPC.',
        category: 'personal',
        isPersonal: true
      });
    } else {
      timetableItems.push({
        id: `personal_${day}_block_a_study`,
        day: day,
        subject: 'Blok A: Nauka & Powtórki',
        time_start: '17:00',
        time_end: '18:00',
        room: 'Biurko',
        teacher: 'Edukacja',
        type: 'Wykład',
        color: 'indigo',
        notes: '1h czystej nauki do sprawdzianów i kartkówek, żeby nie robić zaległości.',
        category: 'personal',
        isPersonal: true
      });
    }
  }

  // Zapis do SQLite: timetable
  console.log(`[*] Zapisywanie ${timetableItems.length} pozycji planu dnia do SQLite timetable...`);
  for (const item of timetableItems) {
    await executeRun(
      `INSERT OR REPLACE INTO timetable (id, day, subject, time_start, time_end, room, teacher, type, color, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.day,
        item.subject,
        item.time_start,
        item.time_end,
        item.room,
        item.teacher,
        item.type,
        item.color,
        item.notes
      ]
    );
  }
  console.log('[+] SUCCESS: Zapisano pozycje planu dnia w SQLite.');

  // 2. WORKOUTS: Zapis planu treningowego do bazy SQLite
  console.log('[*] Zapisywanie planu treningowego i sesji do SQLite workouts...');
  const workoutSessions = [
    {
      title: 'Plan Główny: Full Body Workout (Strych)',
      type: 'Siłowy',
      date: '2026-10-16',
      description: WORKOUT_PLAN_MARKDOWN
    },
    {
      title: 'Trening FBW: Podciąganie, Dipy, Wiosłowanie, OHP, Przysiady, Brzuch',
      type: 'Siłowy',
      date: '2026-10-16',
      description: 'Zestaw 6 ćwiczeń (2 serie robocze 8-12 powtórzeń, przerwy 1.5-2 min). Po treningu szejk WPC.'
    },
    {
      title: 'Trening FBW: Podciąganie, Dipy, Wiosłowanie, OHP, Przysiady, Brzuch',
      type: 'Siłowy',
      date: '2026-10-14',
      description: 'Zestaw 6 ćwiczeń (2 serie robocze 8-12 powtórzeń, przerwy 1.5-2 min). Po treningu szejk WPC.'
    },
    {
      title: 'Trening FBW: Podciąganie, Dipy, Wiosłowanie, OHP, Przysiady, Brzuch',
      type: 'Siłowy',
      date: '2026-10-12',
      description: 'Zestaw 6 ćwiczeń (2 serie robocze 8-12 powtórzeń, przerwy 1.5-2 min). Po treningu szejk WPC.'
    }
  ];

  for (const w of workoutSessions) {
    await executeRun(
      `INSERT INTO workouts (title, type, description, date) VALUES (?, ?, ?, ?)`,
      [w.title, w.type, w.description, w.date]
    );
  }
  console.log('[+] SUCCESS: Zapisano sesje treningowe w SQLite workouts.');

  // 3. OPERATOR BRAIN / USER MEMORY: Zapis faktów do SQLite
  console.log('[*] Zapisywanie faktów rutyny i treningu do SQLite user_memory...');
  for (const f of BRAIN_FACTS) {
    await executeRun(
      `INSERT INTO user_memory (fact, category) VALUES (?, ?)`,
      [f.fact, f.category]
    );
  }
  console.log('[+] SUCCESS: Zapisano fakty w SQLite user_memory.');

  // 4. CLOUD FIRESTORE REPLICATION
  const firestoreDb = getFirestoreDb();
  if (firestoreDb) {
    console.log('[*] Replikacja danych do Cloud Firestore (void-potato-7721)...');

    // A. Replikacja timetable
    const batch = firestoreDb.batch();
    for (const item of timetableItems) {
      const docRef = firestoreDb.collection('timetable').doc(item.id);
      batch.set(docRef, {
        ...item,
        updated_at: new Date().toISOString()
      }, { merge: true });
    }
    await batch.commit();
    console.log(`[+] SUCCESS: Zreplikowano ${timetableItems.length} pozycji do Firestore timetable.`);

    // B. Replikacja workouts
    const wBatch = firestoreDb.batch();
    for (let i = 0; i < workoutSessions.length; i++) {
      const w = workoutSessions[i];
      const docId = `workout_seed_${Date.now()}_${i}`;
      const docRef = firestoreDb.collection('workouts').doc(docId);
      wBatch.set(docRef, {
        id: docId,
        ...w,
        created_at: new Date().toISOString()
      }, { merge: true });
    }
    await wBatch.commit();
    console.log(`[+] SUCCESS: Zreplikowano ${workoutSessions.length} treningów do Firestore workouts.`);

    // C. Replikacja operator_brain
    const bBatch = firestoreDb.batch();
    for (const f of BRAIN_FACTS) {
      const docRef = firestoreDb.collection('operator_brain').doc(f.id);
      bBatch.set(docRef, {
        ...f,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { merge: true });
    }
    await bBatch.commit();
    console.log(`[+] SUCCESS: Zreplikowano ${BRAIN_FACTS.length} faktów do Firestore operator_brain.`);
  } else {
    console.warn('[!] WARN: Brak aktywnego połączenia Firestore, pominięto replikację bezpośrednią.');
  }

  // 5. OBSIDIAN & MARKDOWN KNOWLEDGE FILE
  const fullDocumentMarkdown = `# STAŁY SCHEMAT DNIA & PLAN TRENINGOWY OPERATORA

> Dokument nadrzędny harmonogramu tygodniowego i wytycznych treningowo-regeneracyjnych.

---

## ⏰ STAŁY SCHEMAT DNIA (Poniedziałek – Piątek)

- **06:00 – 06:30 | Poranny rozruch**  
  Pobudka, szklanka wody + 5g kreatyny przygotowane wieczorem na biurku. Szybka toaleta i wychodzisz.
- **06:30 – 16:15 | Szkoła & Powrót**  
  Zajęcia w szkole, powrót do domu na 16:15.
- **16:15 – 17:00 | Obiad & Reset**  
  Spokojny obiad (paliwo na resztę dnia) i chwila na odcięcie się od szkoły.
- **17:00 – 18:00 | Blok A: Trening / Nauka (Naprzemiennie)**  
  - **Dni treningowe (Poniedziałek / Środa / Piątek):** Wchodzisz na strych, robisz 30–40 min zestaw Full Body + po treningu szejk WPC.  
  - **Dni bez treningu (Wtorek / Czwartek):** 1h czystej nauki do sprawdzianów i kartkówek, żeby nie robić zaległości.
- **18:00 – 20:00 | Blok B: Czas dla siebie / Chill**  
  Relaks, gierki, znajomi, e-pet – czas na zresetowanie głowy.
- **20:00 – 22:30 | Blok C: Praca głęboka / Kodowanie / Unity**  
  Dwie godziny skupienia na własnych projektach, zleceń i dłubaniu przy silniku PROTOCOL: BLACKOUT.
- **22:30 – 23:00 | Wyciszenie i Sen**  
  Szybki prysznic, odstawienie ekranów, melatonina z melisą.  
  **23:00:** Odcięcie – równiutkie 7 godzin snu do 06:00 rano.

---

## 🏋️ PLAN TRENINGOWY (Poniedziałek / Środa / Piątek)

### Zasady Ogólne
- **Serie robocze:** 2 serie robocze na każde ćwiczenie (poprzedzone krótką rozgrzewką i 1 serią lekką).
- **Powtórzenia:** 8–12 w serii. Jeśli domkniesz 12 powtórzeń z zapasem techniki – dokładasz ciężar lub mocniejszą gumę.
- **Przerwy:** 1,5–2 minuty między seriami.

### Ćwiczenia:
1. **Podciąganie na drążku (nachwyt lub z gumą)**  
   *Partia:* Plecy + Biceps | *Objętość:* 2 serie × 8–12 powtórzeń.  
   *Technika:* Klasyczne podciąganie nachwytem. Jeśli brakuje siły na czyste powtórzenia, przewiń gumę oporową przez drążek i wrzuć w nią kolano lub stopę.
2. **Dipy na poręczach lub Pompki klasyczne**  
   *Partia:* Klatka + Barki + Triceps | *Objętość:* 2 serie × 8–12 powtórzeń.  
   *Technika:* Jeśli dipy są za ciężkie, rób klasyczne pompki na podłodze. Jeśli wchodzą gładko – wykonuj dipy na poręczach.
3. **Wiosłowanie hantlem w opadzie tułowia**  
   *Partia:* Grzbiet + Ramiona | *Objętość:* 2 serie na stronę × 8–12 powtórzeń.  
   *Technika:* Oprzyj jedną rękę i kolano na ławce/skrzyni, w drugiej trzymaj hantel i przyciągaj go płynnie do biodra.
4. **Wyciskanie hantli nad głowę stojąc (OHP)**  
   *Partia:* Barki | *Objętość:* 2 serie × 8–12 powtórzeń.  
   *Technika:* Stojąc stabilnie na mocnych nogach, trzymaj hantle przy barkach i wyciskaj je pionowo nad głowę.
5. **Przysiady z hantlem przy klatce (Goblet Squat)**  
   *Partia:* Nogi | *Objętość:* 2 serie × 10–12 powtórzeń.  
   *Technika:* Trzymaj jeden hantel pionowo oburącz przy klatce piersiowej i wykonaj głęboki, kontrolowany przysiad.
6. **Unoszenie kolan do klatki w wiszeniu**  
   *Partia:* Brzuch / Core | *Objętość:* 2 serie × 10–12 powtórzeń.  
   *Technika:* Wisisz stabilnie na drążku i podciągasz kolana w górę do poziomu klatki piersiowej, pracując brzuchem.
`;

  // Zapis w katalogu repozytorium: data/
  const repoDataPath = path.resolve(rootDir, 'data/SCHEMAT_DNIA_I_TRENING.md');
  fs.writeFileSync(repoDataPath, fullDocumentMarkdown, 'utf8');
  console.log(`[+] SUCCESS: Zapisano dokument w repozytorium: ${repoDataPath}`);

  // Zapis w skarbcu Obsidian
  const obsidianDir = 'C:\\Users\\Jakub Lis\\Documents\\OBSIDIAN\\informacje';
  if (fs.existsSync(obsidianDir)) {
    const obsidianPath = path.join(obsidianDir, 'SCHEMAT_DNIA_I_TRENING.md');
    fs.writeFileSync(obsidianPath, fullDocumentMarkdown, 'utf8');
    console.log(`[+] SUCCESS: Zsynchronizowano ze skarbcem Obsidian: ${obsidianPath}`);
  }

  console.log('[+] Seedowanie zakończone pełnym sukcesem.');
}

seed().catch(err => {
  console.error('[!] Błąd krytyczny seedowania:', err);
  process.exit(1);
});
