export interface TaskItem {
  id: string;
  userId: string;
  title: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  completed: boolean;
  category: string;
  createdAt: string;
}

export interface TransactionItem {
  id: string;
  userId: string;
  title: string;
  amount: number;
  envelope: 'NEEDS' | 'WANTS' | 'SAVINGS';
  category: string;
  date: string;
  type: 'EXPENSE' | 'INCOME';
}

export interface SubscriptionItem {
  id: string;
  name: string;
  category: string;
  costPln: number;
  renewalDay: number;
  status: 'active' | 'pending';
}

export interface SavingsGoal {
  id: string;
  name: string;
  currentPln: number;
  targetPln: number;
  deadline: string;
}

export interface ExerciseItem {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weightKg: number;
  completedSets: number;
}

export interface HabitItem {
  id: string;
  title: string;
  streakDays: number;
  completedToday: boolean;
}

export interface PersonalRecord {
  exercise: string;
  record: string;
  date: string;
  extra: string;
}

export interface TrafficCamera {
  id: string;
  location: string;
  road: string;
  status: 'online' | 'warning' | 'offline';
  speedLimitKmh: number;
  lastUpdated: string;
}

export interface SpeedRadar {
  id: string;
  road: string;
  location: string;
  type: 'stacjonarny' | 'odcinkowy' | 'czerwone_swiatlo';
  speedLimit: number;
  deviceModel: string;
  active: boolean;
}

export interface LessonItem {
  id: string;
  order: number;
  timeRange: string;
  subject: string;
  teacher: string;
  classroom: string;
  isSubstitution?: boolean;
  substitutionNote?: string;
  hasExam?: boolean;
}

export interface GradeItem {
  id: string;
  subject: string;
  grade: number;
  weight: number;
  description: string;
  date: string;
}

class DatabaseStore {
  private tasks: TaskItem[] = [];
  private transactions: TransactionItem[] = [];
  private subscriptions: SubscriptionItem[] = [];
  private savingsGoals: SavingsGoal[] = [];
  private exercises: ExerciseItem[] = [];
  private habits: HabitItem[] = [];
  private records: PersonalRecord[] = [];
  private trafficCameras: TrafficCamera[] = [];
  private speedRadars: SpeedRadar[] = [];
  private timetable: Record<number, LessonItem[]> = {};
  private grades: GradeItem[] = [];

  constructor() {
    this.seed();
  }

  public seed(): void {
    this.tasks = [
      { id: 't1', userId: 'operator-system-core', title: 'Wdrożyć architekturę monorepo v4.0.0', priority: 'HIGH', completed: true, category: 'Architektura', createdAt: '2026-10-30T09:00:00Z' },
      { id: 't2', userId: 'operator-system-core', title: 'Skonfigurować bezpieczny CORS whitelist bez *', priority: 'HIGH', completed: true, category: 'Bezpieczeństwo', createdAt: '2026-10-30T09:30:00Z' },
      { id: 't3', userId: 'operator-system-core', title: 'Podłączyć silnik agenta AI ze streamingiem SSE', priority: 'HIGH', completed: false, category: 'AI Engine', createdAt: '2026-10-30T10:00:00Z' }
    ];

    this.transactions = [
      { id: 'tx1', userId: 'operator-system-core', title: 'Artykuły biurowe i książka techniczna', amount: 84.50, envelope: 'WANTS', category: 'Rozwój', date: 'Dzisiaj, 09:15', type: 'EXPENSE' },
      { id: 'tx2', userId: 'operator-system-core', title: 'Abonament serwerowy VPS LXC', amount: 65.00, envelope: 'NEEDS', category: 'Infrastruktura', date: 'Wczoraj, 14:20', type: 'EXPENSE' },
      { id: 'tx3', userId: 'operator-system-core', title: 'Wpłata na fundusz awaryjny', amount: 200.00, envelope: 'SAVINGS', category: 'Oszczędności', date: '28 paź 2026', type: 'EXPENSE' }
    ];

    this.subscriptions = [
      { id: 's1', name: 'Hosting Chmurowy VPS (LXC)', category: 'Infrastruktura', costPln: 65.0, renewalDay: 28, status: 'active' },
      { id: 's2', name: 'Bilet Okresowy / Transport', category: 'Mobilność i Dojazdy', costPln: 160.0, renewalDay: 1, status: 'active' },
      { id: 's3', name: 'Narzędzia Asystenta Dev / AI', category: 'Narzędzia IT', costPln: 45.0, renewalDay: 15, status: 'active' },
      { id: 's4', name: 'Łącze Światłowodowe / Internet', category: 'Rachunki Stałe', costPln: 79.0, renewalDay: 10, status: 'active' }
    ];

    this.savingsGoals = [
      { id: 'g1', name: 'Fundusz Awaryjny (Poduszka 3m)', currentPln: 3200, targetPln: 5000, deadline: '31 gru 2026' },
      { id: 'g2', name: 'Nowy Hardware Stacji Roboczej', currentPln: 1450, targetPln: 4000, deadline: '30 cze 2027' }
    ];

    this.exercises = [
      { id: 'ex1', name: 'Podciąganie na drążku (nachwyt)', sets: 4, reps: 8, weightKg: 0, completedSets: 2 },
      { id: 'ex2', name: 'Dipy na poręczach (kalistenika)', sets: 4, reps: 10, weightKg: 5, completedSets: 1 },
      { id: 'ex3', name: 'Pompki na uchwytach z deficytem', sets: 3, reps: 15, weightKg: 0, completedSets: 0 },
      { id: 'ex4', name: 'Wznosy nóg do drążka (brzuch)', sets: 3, reps: 12, weightKg: 0, completedSets: 0 }
    ];

    this.habits = [
      { id: 'h1', title: 'Woda minimum 2.5 Litra', streakDays: 14, completedToday: true },
      { id: 'h2', title: 'Fiszki językowe (15 minut)', streakDays: 9, completedToday: false },
      { id: 'h3', title: 'Git commit i praca nad kodem', streakDays: 32, completedToday: true },
      { id: 'h4', title: 'Czytanie dokumentacji / książki (20 min)', streakDays: 6, completedToday: false }
    ];

    this.records = [
      { exercise: 'Podciąganie na drążku (nachwyt)', record: '14 powtórzeń', date: '18 paź 2026', extra: 'Czysta forma bez bujania' },
      { exercise: 'Dipy na poręczach (kalistenika)', record: '22 powtórzenia', date: '22 paź 2026', extra: 'Masa ciała + głębokie zejście' },
      { exercise: 'Dipy z obciążeniem zewnętrznym', record: '+15 kg x 6 powt.', date: '14 paź 2026', extra: 'Pas obciążeniowy' },
      { exercise: 'Wznosy prostych nóg do drążka', record: '16 powtórzeń', date: '26 paź 2026', extra: 'Dotknięcie stóp do drążka' }
    ];

    this.trafficCameras = [
      { id: 'c1', location: 'Węzeł Miejski Północ (Kamera 01)', road: 'DK / Obwodnica', status: 'online', speedLimitKmh: 50, lastUpdated: '1 min temu' },
      { id: 'c2', location: 'Węzeł Wschodni (Wjazd A1)', road: 'Autostrada A1 / DW', status: 'online', speedLimitKmh: 90, lastUpdated: '2 min temu' },
      { id: 'c3', location: 'Węzeł Tranzytowy Południe', road: 'DK / A1', status: 'warning', speedLimitKmh: 70, lastUpdated: 'Prace drogowe' },
      { id: 'c4', location: 'Odcinkowy Pomiar Zachód', road: 'DK / Trasa Główna', status: 'online', speedLimitKmh: 50, lastUpdated: '5 min temu' }
    ];

    this.speedRadars = [
      { id: 'r1', road: 'DK / Obwodnica', location: 'Strefa Miejska (Aleja Główna)', type: 'stacjonarny', speedLimit: 50, deviceModel: 'Mesta Fusion RN', active: true },
      { id: 'r2', road: 'DK22 / Region', location: 'Odcinek Leśny / Trasa Regionalna', type: 'odcinkowy', speedLimit: 70, deviceModel: 'CANARD OPP v3', active: true },
      { id: 'r3', road: 'Autostrada A1', location: 'Węzeł Autostradowy Wschód', type: 'stacjonarny', speedLimit: 140, deviceModel: 'TraffiStar SR520', active: true },
      { id: 'r4', road: 'DK / DW', location: 'Skrzyżowanie Tranzytowe Obwodnicy', type: 'czerwone_swiatlo', speedLimit: 50, deviceModel: 'RedLight Camera', active: true }
    ];

    this.timetable = {
      1: [
        { id: '1', order: 1, timeRange: '08:00 - 08:45', subject: 'Matematyka', teacher: 'mgr A. Nowak', classroom: 'Sala 105' },
        { id: '2', order: 2, timeRange: '08:55 - 09:40', subject: 'Język Polski', teacher: 'mgr B. Kowalska', classroom: 'Sala 210' },
        { id: '3', order: 3, timeRange: '09:50 - 10:35', subject: 'Systemy Operacyjne', teacher: 'inż. K. Wiśniewski', classroom: 'Pracownia A-204' },
        { id: '4', order: 4, timeRange: '10:45 - 11:30', subject: 'Projektowanie Oprogramowania', teacher: 'inż. K. Wiśniewski', classroom: 'Pracownia A-204' },
        { id: '5', order: 5, timeRange: '11:40 - 12:25', subject: 'Język Obcy Zawodowy', teacher: 'mgr E. Lis', classroom: 'Sala 102' }
      ],
      2: [
        { id: '6', order: 1, timeRange: '08:00 - 08:45', subject: 'Bazy Danych SQL', teacher: 'inż. M. Kamiński', classroom: 'Pracownia 202', hasExam: true },
        { id: '7', order: 2, timeRange: '08:55 - 09:40', subject: 'Bazy Danych SQL', teacher: 'inż. M. Kamiński', classroom: 'Pracownia 202' }
      ]
    };

    this.grades = [
      { id: 'g1', subject: 'Projektowanie Oprogramowania', grade: 5, weight: 3, description: 'Projekt Monorepo v4.0', date: '28-10-2026' },
      { id: 'g2', subject: 'Bazy Danych SQL', grade: 4, weight: 2, description: 'Relacje i indeksy', date: '24-10-2026' },
      { id: 'g3', subject: 'Systemy Operacyjne', grade: 5, weight: 2, description: 'Konteneryzacja Docker', date: '21-10-2026' },
      { id: 'g4', subject: 'Matematyka', grade: 4, weight: 3, description: 'Rachunek prawdopodobieństwa', date: '18-10-2026' }
    ];
  }

  public reset(): void {
    this.seed();
  }

  // Tasks
  public getTasks(userId: string): TaskItem[] {
    return this.tasks.filter((t) => t.userId === userId);
  }

  public addTask(userId: string, data: Omit<TaskItem, 'id' | 'userId' | 'completed' | 'createdAt'>): TaskItem {
    const newTask: TaskItem = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      title: data.title,
      priority: data.priority,
      category: data.category,
      completed: false,
      createdAt: new Date().toISOString()
    };
    this.tasks.push(newTask);
    return newTask;
  }

  public toggleTask(userId: string, id: string): TaskItem | null {
    const task = this.tasks.find((t) => t.id === id && t.userId === userId);
    if (!task) return null;
    task.completed = !task.completed;
    return task;
  }

  public deleteTask(userId: string, id: string): boolean {
    const initialLen = this.tasks.length;
    this.tasks = this.tasks.filter((t) => !(t.id === id && t.userId === userId));
    return this.tasks.length < initialLen;
  }

  // Transactions
  public getTransactions(userId: string): TransactionItem[] {
    return this.transactions.filter((t) => t.userId === userId);
  }

  public addTransaction(userId: string, data: Omit<TransactionItem, 'id' | 'userId' | 'date'>): TransactionItem {
    const newTx: TransactionItem = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      title: data.title,
      amount: data.amount,
      envelope: data.envelope,
      category: data.category,
      type: data.type,
      date: 'Przed chwilą'
    };
    this.transactions.unshift(newTx);
    return newTx;
  }

  public getSubscriptions(): SubscriptionItem[] {
    return this.subscriptions;
  }

  public getSavingsGoals(): SavingsGoal[] {
    return this.savingsGoals;
  }

  // Workouts
  public getExercises(): ExerciseItem[] {
    return this.exercises;
  }

  public incrementWorkoutSet(id: string): ExerciseItem | null {
    const ex = this.exercises.find((e) => e.id === id);
    if (!ex) return null;
    if (ex.completedSets < ex.sets) {
      ex.completedSets += 1;
    }
    return ex;
  }

  public getHabits(): HabitItem[] {
    return this.habits;
  }

  public toggleHabit(id: string): HabitItem | null {
    const habit = this.habits.find((h) => h.id === id);
    if (!habit) return null;
    habit.completedToday = !habit.completedToday;
    if (habit.completedToday) {
      habit.streakDays += 1;
    } else if (habit.streakDays > 0) {
      habit.streakDays -= 1;
    }
    return habit;
  }

  public getRecords(): PersonalRecord[] {
    return this.records;
  }

  // Traffic
  public getTrafficCameras(): TrafficCamera[] {
    return this.trafficCameras;
  }

  public getSpeedRadars(): SpeedRadar[] {
    return this.speedRadars;
  }

  // School
  public getTimetable(day: number): LessonItem[] {
    return this.timetable[day] || [];
  }

  public getGrades(): GradeItem[] {
    return this.grades;
  }

  public calculateGpa(): number {
    let sumProduct = 0;
    let sumWeight = 0;
    for (const g of this.grades) {
      if (g.weight > 0) {
        sumProduct += g.grade * g.weight;
        sumWeight += g.weight;
      }
    }
    return sumWeight > 0 ? Number((sumProduct / sumWeight).toFixed(2)) : 0;
  }
}

export const dbStore = new DatabaseStore();
