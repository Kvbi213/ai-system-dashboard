import {
  TaskItem,
  TransactionItem,
  SubscriptionItem,
  SavingsGoal,
  ExerciseItem,
  HabitItem,
  PersonalRecord,
  TrafficCamera,
  SpeedRadar,
  LessonItem,
  GradeItem,
  RoutineItem,
  PersonalGoalItem,
  JournalEntry,
  SchoolEvent
} from './types.js';

export const SEED_TASKS: TaskItem[] = [
  { id: 't1', userId: 'operator-system-core', title: 'Wdrożyć architekturę monorepo v4.0.0', priority: 'HIGH', completed: true, category: 'Architektura', createdAt: '2026-10-30T09:00:00Z' },
  { id: 't2', userId: 'operator-system-core', title: 'Skonfigurować bezpieczny CORS whitelist bez *', priority: 'HIGH', completed: true, category: 'Bezpieczeństwo', createdAt: '2026-10-30T09:30:00Z' },
  { id: 't3', userId: 'operator-system-core', title: 'Podłączyć silnik agenta AI ze streamingiem SSE', priority: 'HIGH', completed: false, category: 'AI Engine', createdAt: '2026-10-30T10:00:00Z' }
];

export const SEED_TRANSACTIONS: TransactionItem[] = [
  { id: 'tx1', userId: 'operator-system-core', title: 'Artykuły biurowe i książka techniczna', amount: 84.50, envelope: 'WANTS', category: 'Rozwój', date: 'Dzisiaj, 09:15', type: 'EXPENSE' },
  { id: 'tx2', userId: 'operator-system-core', title: 'Abonament serwerowy VPS LXC', amount: 65.00, envelope: 'NEEDS', category: 'Infrastruktura', date: 'Wczoraj, 14:20', type: 'EXPENSE' },
  { id: 'tx3', userId: 'operator-system-core', title: 'Wpłata na fundusz awaryjny', amount: 200.00, envelope: 'SAVINGS', category: 'Oszczędności', date: '28 paź 2026', type: 'EXPENSE' }
];

export const SEED_SUBSCRIPTIONS: SubscriptionItem[] = [
  { id: 's1', name: 'Hosting Chmurowy VPS (LXC)', category: 'Infrastruktura', costPln: 65.0, renewalDay: 28, status: 'active' },
  { id: 's2', name: 'Bilet Okresowy / Transport', category: 'Mobilność i Dojazdy', costPln: 160.0, renewalDay: 1, status: 'active' },
  { id: 's3', name: 'Narzędzia Asystenta Dev / AI', category: 'Narzędzia IT', costPln: 45.0, renewalDay: 15, status: 'active' },
  { id: 's4', name: 'Łącze Światłowodowe / Internet', category: 'Rachunki Stałe', costPln: 79.0, renewalDay: 10, status: 'active' }
];

export const SEED_SAVINGS_GOALS: SavingsGoal[] = [
  { id: 'g1', name: 'Fundusz Awaryjny (Poduszka 3m)', currentPln: 3200, targetPln: 5000, deadline: '31 gru 2026' },
  { id: 'g2', name: 'Nowy Hardware Stacji Roboczej', currentPln: 1450, targetPln: 4000, deadline: '30 cze 2027' }
];

export const SEED_EXERCISES: ExerciseItem[] = [
  { id: 'ex1', name: 'Podciąganie na drążku (nachwyt)', sets: 4, reps: 8, weightKg: 0, completedSets: 2 },
  { id: 'ex2', name: 'Dipy na poręczach (kalistenika)', sets: 4, reps: 10, weightKg: 5, completedSets: 1 },
  { id: 'ex3', name: 'Pompki na uchwytach z deficytem', sets: 3, reps: 15, weightKg: 0, completedSets: 0 },
  { id: 'ex4', name: 'Wznosy nóg do drążka (brzuch)', sets: 3, reps: 12, weightKg: 0, completedSets: 0 }
];

export const SEED_HABITS: HabitItem[] = [
  { id: 'h1', title: 'Woda minimum 2.5 Litra', streakDays: 14, completedToday: true },
  { id: 'h2', title: 'Fiszki językowe (15 minut)', streakDays: 9, completedToday: false },
  { id: 'h3', title: 'Git commit i praca nad kodem', streakDays: 32, completedToday: true },
  { id: 'h4', title: 'Czytanie dokumentacji / książki (20 min)', streakDays: 6, completedToday: false }
];

export const SEED_RECORDS: PersonalRecord[] = [
  { exercise: 'Podciąganie na drążku (nachwyt)', record: '14 powtórzeń', date: '18 paź 2026', extra: 'Czysta forma bez bujania' },
  { exercise: 'Dipy na poręczach (kalistenika)', record: '22 powtórzenia', date: '22 paź 2026', extra: 'Masa ciała + głębokie zejście' },
  { exercise: 'Dipy z obciążeniem zewnętrznym', record: '+15 kg x 6 powt.', date: '14 paź 2026', extra: 'Pas obciążeniowy' },
  { exercise: 'Wznosy prostych nóg do drążka', record: '16 powtórzeń', date: '26 paź 2026', extra: 'Dotknięcie stóp do drążka' }
];

export const SEED_TRAFFIC_CAMERAS: TrafficCamera[] = [
  { id: 'c1', location: 'Węzeł Miejski Północ (Kamera 01)', road: 'DK / Obwodnica', status: 'online', speedLimitKmh: 50, lastUpdated: '1 min temu' },
  { id: 'c2', location: 'Węzeł Wschodni (Wjazd A1)', road: 'Autostrada A1 / DW', status: 'online', speedLimitKmh: 90, lastUpdated: '2 min temu' },
  { id: 'c3', location: 'Węzeł Tranzytowy Południe', road: 'DK / A1', status: 'warning', speedLimitKmh: 70, lastUpdated: 'Prace drogowe' },
  { id: 'c4', location: 'Odcinkowy Pomiar Zachód', road: 'DK / Trasa Główna', status: 'online', speedLimitKmh: 50, lastUpdated: '5 min temu' }
];

export const SEED_SPEED_RADARS: SpeedRadar[] = [
  { id: 'r1', road: 'DK / Obwodnica', location: 'Strefa Miejska (Aleja Główna)', type: 'stacjonarny', speedLimit: 50, deviceModel: 'Mesta Fusion RN', active: true },
  { id: 'r2', road: 'DK22 / Region', location: 'Odcinek Leśny / Trasa Regionalna', type: 'odcinkowy', speedLimit: 70, deviceModel: 'CANARD OPP v3', active: true },
  { id: 'r3', road: 'Autostrada A1', location: 'Węzeł Autostradowy Wschód', type: 'stacjonarny', speedLimit: 140, deviceModel: 'TraffiStar SR520', active: true },
  { id: 'r4', road: 'DK / DW', location: 'Skrzyżowanie Tranzytowe Obwodnicy', type: 'czerwone_swiatlo', speedLimit: 50, deviceModel: 'RedLight Camera', active: true }
];

// Full lessons for days 1-5 verified 1:1 against Librus Synergia
export const SEED_TIMETABLE: Record<number, LessonItem[]> = {
  1: [
    { id: 'mon_2', order: 2, timeRange: '08:50 - 09:35', subject: 'Informatyka', teacher: 'Becker Adam (2 TI gr.2)', classroom: 's. 04' },
    { id: 'mon_3', order: 3, timeRange: '09:40 - 10:25', subject: 'Informatyka', teacher: 'Becker Adam (2 TI gr.2)', classroom: 's. 04' },
    { id: 'mon_4', order: 4, timeRange: '10:40 - 11:25', subject: 'Biznes i zarządzanie', teacher: 'Sokół Paweł', classroom: 's. 0.2' },
    { id: 'mon_5', order: 5, timeRange: '11:30 - 12:15', subject: 'Lokalne sieci komputerowe', teacher: 'Wojnarowski Przemysław', classroom: 's. 0.2' },
    { id: 'mon_6', order: 6, timeRange: '12:20 - 13:05', subject: 'Język polski', teacher: 'Negowska Alicja', classroom: 's. 34' }
  ],
  2: [
    { id: 'tue_1', order: 1, timeRange: '08:00 - 08:45', subject: 'Pracownia urządzeń techniki komputerowej', teacher: 'Wojnarowski Przemysław (2TI-gr1)', classroom: 's. 0.1' },
    { id: 'tue_2', order: 2, timeRange: '08:50 - 09:35', subject: 'Pracownia urządzeń techniki komputerowej', teacher: 'Wojnarowski Przemysław (2TI-gr1)', classroom: 's. 0.1' },
    { id: 'tue_3', order: 3, timeRange: '09:40 - 10:25', subject: 'Zajęcia z wychowawcą', teacher: 'Ziemba Joanna', classroom: 's. 31' },
    { id: 'tue_4', order: 4, timeRange: '10:40 - 11:25', subject: 'Wychowanie fizyczne', teacher: 'Łysakowski Grzegorz (Klasa 2 TI)', classroom: 'Sala gimnastyczna' },
    { id: 'tue_5', order: 5, timeRange: '11:30 - 12:15', subject: 'Wychowanie fizyczne', teacher: 'Łysakowski Grzegorz (Klasa 2 TI)', classroom: 'Sala gimnastyczna' },
    { id: 'tue_6', order: 6, timeRange: '12:20 - 13:05', subject: 'Pracownia systemów operacyjnych', teacher: 'Reszka Sławomir (2 TI gr1 PSO)', classroom: 's. 1.15' },
    { id: 'tue_7', order: 7, timeRange: '13:15 - 14:00', subject: 'Pracownia systemów operacyjnych', teacher: 'Reszka Sławomir (2 TI gr1 PSO)', classroom: 's. 1.15' },
    { id: 'tue_8', order: 8, timeRange: '14:05 - 14:50', subject: 'Edukacja zdrowotna', teacher: 'Spych Monika', classroom: 's. 38' },
    { id: 'tue_9', order: 9, timeRange: '14:55 - 15:40', subject: 'Matematyka', teacher: 'Bahr Zbigniew', classroom: 's. 26' }
  ],
  3: [
    { id: 'wed_1', order: 1, timeRange: '08:00 - 08:45', subject: 'Biologia', teacher: 'Łukaszczyk-Wulgaris Joanna', classroom: 's. 06' },
    { id: 'wed_2', order: 2, timeRange: '08:50 - 09:35', subject: 'Biologia', teacher: 'Łukaszczyk-Wulgaris Joanna', classroom: 's. 06' },
    { id: 'wed_3', order: 3, timeRange: '09:40 - 10:25', subject: 'Systemy operacyjne', teacher: 'Wojnarowski Przemysław', classroom: 's. 1.2' },
    { id: 'wed_4', order: 4, timeRange: '10:40 - 11:25', subject: 'Systemy operacyjne', teacher: 'Wojnarowski Przemysław', classroom: 's. 1.2' },
    { id: 'wed_5', order: 5, timeRange: '11:30 - 12:15', subject: 'Urządzenia techniki komputerowej', teacher: 'Gembiak Bartosz', classroom: 's. 1.2' },
    { id: 'wed_6', order: 6, timeRange: '12:20 - 13:05', subject: 'Urządzenia techniki komputerowej', teacher: 'Gembiak Bartosz', classroom: 's. 1.2' },
    { id: 'wed_7', order: 7, timeRange: '13:15 - 14:00', subject: 'Chemia', teacher: 'Kolasińska Paulina', classroom: 's. 08' },
    { id: 'wed_8', order: 8, timeRange: '14:05 - 14:50', subject: 'Historia', teacher: 'Wardyn Wojciech', classroom: 's. 06' },
    { id: 'wed_9', order: 9, timeRange: '14:55 - 15:40', subject: 'Matematyka', teacher: 'Bahr Zbigniew', classroom: 's. 26' }
  ],
  4: [
    { id: 'thu_2', order: 2, timeRange: '08:50 - 09:35', subject: 'Język angielski', teacher: 'Ziemba Joanna (j.ang 2 TI gr 1)', classroom: 's. 22' },
    { id: 'thu_3', order: 3, timeRange: '09:40 - 10:25', subject: 'Język angielski', teacher: 'Ziemba Joanna (j.ang 2 TI gr 1)', classroom: 's. 22' },
    { id: 'thu_4', order: 4, timeRange: '10:40 - 11:25', subject: 'Pracownia lokalnych sieci komputerowych', teacher: 'Kryla Łukasz', classroom: 's. 1.16' },
    { id: 'thu_5', order: 5, timeRange: '11:30 - 12:15', subject: 'Pracownia lokalnych sieci komputerowych', teacher: 'Kryla Łukasz', classroom: 's. 1.16' },
    { id: 'thu_6', order: 6, timeRange: '12:20 - 13:05', subject: 'Matematyka', teacher: 'Bahr Zbigniew', classroom: 's. 05' },
    { id: 'thu_7', order: 7, timeRange: '13:15 - 14:00', subject: 'Matematyka', teacher: 'Bahr Zbigniew', classroom: 's. 05' },
    { id: 'thu_8', order: 8, timeRange: '14:05 - 14:50', subject: 'Język angielski zawodowy', teacher: 'Ziemba Joanna (j. ang zaw. 2 TI gr 1)', classroom: 's. 22' }
  ],
  5: [
    { id: 'fri_1', order: 1, timeRange: '08:00 - 08:45', subject: 'Edukacja obywatelska', teacher: 'Czarna Alicja', classroom: 's. 09' },
    { id: 'fri_2', order: 2, timeRange: '08:50 - 09:35', subject: 'Wychowanie fizyczne', teacher: 'Łysakowski Grzegorz (Klasa 2 TI)', classroom: 'Sala gimnastyczna' },
    { id: 'fri_3', order: 3, timeRange: '09:40 - 10:25', subject: 'Język niemiecki', teacher: 'Chyła Beata (2TI/1)', classroom: 's. 21' },
    { id: 'fri_4', order: 4, timeRange: '10:40 - 11:25', subject: 'Język niemiecki', teacher: 'Chyła Beata (2TI/1)', classroom: 's. 21' },
    { id: 'fri_5', order: 5, timeRange: '11:30 - 12:15', subject: 'Chemia', teacher: 'Kolasińska Paulina', classroom: 's. 19' },
    { id: 'fri_6', order: 6, timeRange: '12:20 - 13:05', subject: 'Język polski', teacher: 'Negowska Alicja', classroom: 's. 34' },
    { id: 'fri_7', order: 7, timeRange: '13:15 - 14:00', subject: 'Język polski', teacher: 'Negowska Alicja', classroom: 's. 34' }
  ]
};

// Real 16 graded subjects with exact teacher names & grades from legacy api/librus.js
export const SEED_GRADES: GradeItem[] = [
  { id: 'gr1', subject: 'Informatyka', grade: 6, weight: 3, description: 'Sprawdzian Praktyczny Linux', date: '28-10-2026', teacher: 'Becker Adam' },
  { id: 'gr2', subject: 'Systemy operacyjne', grade: 5, weight: 3, description: 'Zarządzanie procesami i Docker', date: '26-10-2026', teacher: 'Wojnarowski Przemysław' },
  { id: 'gr3', subject: 'Lokalne sieci komputerowe', grade: 5, weight: 3, description: 'Konfiguracja tras i VLAN', date: '24-10-2026', teacher: 'Wojnarowski Przemysław' },
  { id: 'gr4', subject: 'Pracownia LSK', grade: 5, weight: 2, description: 'Ćwiczenia switch i trunking', date: '22-10-2026', teacher: 'Kryla Łukasz' },
  { id: 'gr5', subject: 'Pracownia UTK', grade: 5, weight: 2, description: 'Montaż i diagnostyka podzespołów', date: '20-10-2026', teacher: 'Wojnarowski Przemysław' },
  { id: 'gr6', subject: 'Język angielski zawodowy', grade: 5, weight: 2, description: 'Słownictwo techniczne IT', date: '19-10-2026', teacher: 'Ziemba Joanna' },
  { id: 'gr7', subject: 'Edukacja obywatelska', grade: 5, weight: 1, description: 'Struktura organów państwa', date: '18-10-2026', teacher: 'Czarna Alicja' },
  { id: 'gr8', subject: 'Biznes i zarządzanie', grade: 5, weight: 2, description: 'Biznesplan startupu', date: '16-10-2026', teacher: 'Sokół Paweł' },
  { id: 'gr9', subject: 'Chemia', grade: 5, weight: 2, description: 'Reakcje utleniania i redukcji', date: '15-10-2026', teacher: 'Kolasińska Paulina' },
  { id: 'gr10', subject: 'Język angielski', grade: 5, weight: 3, description: 'Czytanie i esej zaawansowany', date: '14-10-2026', teacher: 'Ziemba Joanna' },
  { id: 'gr11', subject: 'Historia', grade: 4, weight: 2, description: 'Okres międzywojenny w Europie', date: '12-10-2026', teacher: 'Wardyn Wojciech' },
  { id: 'gr12', subject: 'Biologia', grade: 4, weight: 2, description: 'Genetyka molekularna', date: '10-10-2026', teacher: 'Łukaszczyk-Wulgaris Joanna' },
  { id: 'gr13', subject: 'Matematyka', grade: 4, weight: 3, description: 'Wielomiany i funkcje kwadratowe', date: '08-10-2026', teacher: 'Bahr Zbigniew' },
  { id: 'gr14', subject: 'Język niemiecki', grade: 4, weight: 2, description: 'Czasy przeszłe Präteritum', date: '06-10-2026', teacher: 'Chyła Beata' },
  { id: 'gr15', subject: 'Język polski', grade: 4, weight: 3, description: 'Analiza tekstu literackiego', date: '04-10-2026', teacher: 'Negowska Alicja' },
  { id: 'gr16', subject: 'Urządzenia techniki komputerowej', grade: 3, weight: 2, description: 'Architektura magistrali PCIe', date: '02-10-2026', teacher: 'Gembiak Bartosz' }
];

export const SEED_EVENTS: SchoolEvent[] = [
  { id: 'ev1', date: '2026-10-19', type: 'absence', category: 'Nieobecność nauczyciela', title: 'Nieobecność: Prabucki Andrzej', teacher: 'Prabucki Andrzej' },
  { id: 'ev2', date: '2026-10-19', type: 'kartkowka', category: 'Kartkówka', title: 'Kartkówka: Biznes i zarządzanie', teacher: 'Sokół Paweł' },
  { id: 'ev3', date: '2026-10-21', type: 'kartkowka', category: 'Kartkówka', title: 'Kartkówka: Biologia', teacher: 'Łukaszczyk-Wulgaris Joanna' },
  { id: 'ev4', date: '2026-10-21', type: 'sprawdzian', category: 'Sprawdzian', title: 'Sprawdzian: Biologia', teacher: 'Łukaszczyk-Wulgaris Joanna' },
  { id: 'ev5', date: '2026-10-28', type: 'kartkowka', category: 'Kartkówka', title: 'Kartkówka: Chemia', teacher: 'Kolasińska Paulina' },
  { id: 'ev6', date: '2026-10-29', type: 'sprawdzian', category: 'Sprawdzian', title: 'Sprawdzian: Język niemiecki', teacher: 'Chyła Beata' }
];

export const SEED_ROUTINES: RoutineItem[] = [
  { id: 'rt1', timeOfDay: 'morning', title: 'Szklanka wody 500ml i elektrolity', detail: 'Nawodnienie komórkowe zaraz po przebudzeniu', completed: true },
  { id: 'rt2', timeOfDay: 'morning', title: 'Światło dzienne / spacer 10 minut', detail: 'Regulacja rytmu dobowego i kortyzolu', completed: true },
  { id: 'rt3', timeOfDay: 'morning', title: 'Medytacja / sesja skupienia 10 min', detail: 'Wyciszenie przed blokiem pracy inżynieryjnej', completed: false },
  { id: 'rt4', timeOfDay: 'evening', title: 'Wyłączenie ekranów OLED 45 min przed snem', detail: 'Ochrona melatoniny i higiena wzroku', completed: false },
  { id: 'rt5', timeOfDay: 'evening', title: 'Magnez chelatowany + Cynk', detail: 'Wsparcie regeneracji układu nerwowego', completed: true },
  { id: 'rt6', timeOfDay: 'evening', title: 'Wietrzenie sypialni i temperatura 18°C', detail: 'Optymalizacja faz snu głębokiego NREM', completed: false }
];

export const SEED_PERSONAL_GOALS: PersonalGoalItem[] = [
  { id: 'pg1', category: 'Edukacja & IT', title: 'Certyfikat AWS Solutions Architect', current: 70, target: 100, unit: '%', deadline: '15 gru 2026' },
  { id: 'pg2', category: 'Kondycja & Ciało', title: '15 czystych podciągnięć nachwytem', current: 12, target: 15, unit: 'powt.', deadline: '31 gru 2026' },
  { id: 'pg3', category: 'Rozwój Intelektualny', title: 'Przeczytanie 12 książek inżynieryjnych', current: 8, target: 12, unit: 'książek', deadline: '31 gru 2026' }
];

export const SEED_JOURNAL: JournalEntry[] = [
  { id: 'j1', title: 'Wdrożenie v4.0.0 Monorepo i Refaktoryzacja UI', content: 'Ukończono całkowitą reorganizację aplikacji w architekturę modularną. Eliminacja zbędnego długu i zoptymalizowanie layoutu.', category: 'Inżynieria', date: '30 paź 2026' },
  { id: 'j2', title: 'Refleksja: Głębokie skupienie i higiena cyfrowa', content: 'Zastosowanie bloków 90-minutowych bez rozpraszaczy znacząco zwiększyło przepustowość mentalną i jakość kodu.', category: 'Produktywność', date: '29 paź 2026' }
];
