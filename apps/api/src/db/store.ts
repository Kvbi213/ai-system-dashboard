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

import {
  SEED_TASKS,
  SEED_TRANSACTIONS,
  SEED_SUBSCRIPTIONS,
  SEED_SAVINGS_GOALS,
  SEED_EXERCISES,
  SEED_HABITS,
  SEED_RECORDS,
  SEED_TRAFFIC_CAMERAS,
  SEED_SPEED_RADARS,
  SEED_TIMETABLE,
  SEED_GRADES,
  SEED_EVENTS,
  SEED_ROUTINES,
  SEED_PERSONAL_GOALS,
  SEED_JOURNAL
} from './seedData.js';

export * from './types.js';

export class DatabaseStore {
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
  private events: SchoolEvent[] = [];
  private routines: RoutineItem[] = [];
  private personalGoals: PersonalGoalItem[] = [];
  private journal: JournalEntry[] = [];

  constructor() {
    this.seed();
  }

  public seed(): void {
    this.tasks = JSON.parse(JSON.stringify(SEED_TASKS));
    this.transactions = JSON.parse(JSON.stringify(SEED_TRANSACTIONS));
    this.subscriptions = JSON.parse(JSON.stringify(SEED_SUBSCRIPTIONS));
    this.savingsGoals = JSON.parse(JSON.stringify(SEED_SAVINGS_GOALS));
    this.exercises = JSON.parse(JSON.stringify(SEED_EXERCISES));
    this.habits = JSON.parse(JSON.stringify(SEED_HABITS));
    this.records = JSON.parse(JSON.stringify(SEED_RECORDS));
    this.trafficCameras = JSON.parse(JSON.stringify(SEED_TRAFFIC_CAMERAS));
    this.speedRadars = JSON.parse(JSON.stringify(SEED_SPEED_RADARS));
    this.timetable = JSON.parse(JSON.stringify(SEED_TIMETABLE));
    this.grades = JSON.parse(JSON.stringify(SEED_GRADES));
    this.events = JSON.parse(JSON.stringify(SEED_EVENTS));
    this.routines = JSON.parse(JSON.stringify(SEED_ROUTINES));
    this.personalGoals = JSON.parse(JSON.stringify(SEED_PERSONAL_GOALS));
    this.journal = JSON.parse(JSON.stringify(SEED_JOURNAL));
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

  public updateTask(userId: string, id: string, updates: Partial<Pick<TaskItem, 'title' | 'priority' | 'category' | 'completed'>>): TaskItem | null {
    const task = this.tasks.find((t) => t.id === id && t.userId === userId);
    if (!task) return null;
    if (updates.title !== undefined) task.title = updates.title;
    if (updates.priority !== undefined) task.priority = updates.priority;
    if (updates.category !== undefined) task.category = updates.category;
    if (updates.completed !== undefined) task.completed = updates.completed;
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

  public deleteTransaction(userId: string, id: string): boolean {
    const len = this.transactions.length;
    this.transactions = this.transactions.filter((t) => !(t.id === id && t.userId === userId));
    return this.transactions.length < len;
  }

  public transferFunds(
    userId: string,
    fromEnvelope: 'NEEDS' | 'WANTS' | 'SAVINGS',
    toEnvelope: 'NEEDS' | 'WANTS' | 'SAVINGS',
    amount: number,
    note?: string
  ): { expenseTx: TransactionItem; incomeTx: TransactionItem } {
    if (
      typeof amount !== 'number' ||
      !Number.isFinite(amount) ||
      isNaN(amount) ||
      amount <= 0
    ) {
      throw new Error('Kwota transferu musi być poprawną skończoną liczbą dodatnią większą od zera.');
    }
    if (fromEnvelope === toEnvelope) {
      throw new Error('Koperta źródłowa i docelowa transferu muszą być różne.');
    }
    const reason = note || `Przesunięcie środków: ${fromEnvelope} -> ${toEnvelope}`;
    const expenseTx = this.addTransaction(userId, {
      title: `Transfer wychodzący: ${reason}`,
      amount,
      envelope: fromEnvelope,
      category: 'Transfer',
      type: 'EXPENSE'
    });

    try {
      const incomeTx = this.addTransaction(userId, {
        title: `Transfer przychodzący: ${reason}`,
        amount,
        envelope: toEnvelope,
        category: 'Transfer',
        type: 'INCOME'
      });
      return { expenseTx, incomeTx };
    } catch (err) {
      // Atomic compensation / rollback of the first leg
      try {
        this.deleteTransaction(expenseTx.id);
      } catch (rollbackErr) {
        console.error('[!] Błąd rollbacku transakcji transferu:', rollbackErr);
      }
      throw err;
    }
  }

  // Subscriptions CRUD
  public getSubscriptions(): SubscriptionItem[] {
    return this.subscriptions;
  }

  public addSubscription(sub: Omit<SubscriptionItem, 'id'>): SubscriptionItem {
    const newSub: SubscriptionItem = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...sub
    };
    this.subscriptions.push(newSub);
    return newSub;
  }

  public deleteSubscription(id: string): boolean {
    const len = this.subscriptions.length;
    this.subscriptions = this.subscriptions.filter((s) => s.id !== id);
    return this.subscriptions.length < len;
  }

  public toggleSubscription(id: string): SubscriptionItem | null {
    const sub = this.subscriptions.find((s) => s.id === id);
    if (!sub) return null;
    sub.status = sub.status === 'active' ? 'pending' : 'active';
    return sub;
  }

  // Savings Goals CRUD
  public getSavingsGoals(): SavingsGoal[] {
    return this.savingsGoals;
  }

  public addSavingsGoal(goal: Omit<SavingsGoal, 'id'>): SavingsGoal {
    const newGoal: SavingsGoal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...goal
    };
    this.savingsGoals.push(newGoal);
    return newGoal;
  }

  public deleteSavingsGoal(id: string): boolean {
    const len = this.savingsGoals.length;
    this.savingsGoals = this.savingsGoals.filter((g) => g.id !== id);
    return this.savingsGoals.length < len;
  }

  public depositSavingsGoal(id: string, amount: number): SavingsGoal | null {
    const goal = this.savingsGoals.find((g) => g.id === id);
    if (!goal) return null;
    goal.currentPln += amount;
    return goal;
  }

  // Workouts CRUD
  public getExercises(): ExerciseItem[] {
    return this.exercises;
  }

  public addExercise(ex: Omit<ExerciseItem, 'id' | 'completedSets'>): ExerciseItem {
    const newEx: ExerciseItem = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      completedSets: 0,
      ...ex
    };
    this.exercises.push(newEx);
    return newEx;
  }

  public deleteExercise(id: string): boolean {
    const len = this.exercises.length;
    this.exercises = this.exercises.filter((e) => e.id !== id);
    return this.exercises.length < len;
  }

  public resetExercise(id: string): ExerciseItem | null {
    const ex = this.exercises.find((e) => e.id === id);
    if (!ex) return null;
    ex.completedSets = 0;
    return ex;
  }

  public incrementWorkoutSet(id: string): ExerciseItem | null {
    const ex = this.exercises.find((e) => e.id === id);
    if (!ex) return null;
    if (ex.completedSets < ex.sets) {
      ex.completedSets += 1;
    }
    return ex;
  }

  // Habits CRUD
  public getHabits(): HabitItem[] {
    return this.habits;
  }

  public addHabit(title: string): HabitItem {
    const newHabit: HabitItem = {
      id: `habit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      streakDays: 0,
      completedToday: false
    };
    this.habits.push(newHabit);
    return newHabit;
  }

  public deleteHabit(id: string): boolean {
    const len = this.habits.length;
    this.habits = this.habits.filter((h) => h.id !== id);
    return this.habits.length < len;
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

  // Records CRUD
  public getRecords(): PersonalRecord[] {
    return this.records;
  }

  public addRecord(record: PersonalRecord): PersonalRecord {
    const existingIndex = this.records.findIndex((r) => r.exercise.toLowerCase() === record.exercise.toLowerCase());
    if (existingIndex >= 0) {
      this.records[existingIndex] = record;
    } else {
      this.records.unshift(record);
    }
    return record;
  }

  public deleteRecord(exercise: string): boolean {
    const len = this.records.length;
    this.records = this.records.filter((r) => r.exercise.toLowerCase() !== exercise.toLowerCase());
    return this.records.length < len;
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

  public getAllTimetable(): Record<number, LessonItem[]> {
    return this.timetable;
  }

  public getGrades(): GradeItem[] {
    return this.grades;
  }

  public getEvents(): SchoolEvent[] {
    return this.events;
  }

  public addSchoolEvent(event: Omit<SchoolEvent, 'id'>): SchoolEvent {
    const newEvent: SchoolEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...event
    };
    this.events.unshift(newEvent);
    return newEvent;
  }

  public deleteSchoolEvent(id: string | number): boolean {
    const len = this.events.length;
    this.events = this.events.filter((e) => String(e.id) !== String(id));
    return this.events.length < len;
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

  // Private Hub (Routines, Goals, Journal)
  public getRoutines(): RoutineItem[] {
    return this.routines;
  }

  public toggleRoutine(id: string): RoutineItem | null {
    const rt = this.routines.find((r) => r.id === id);
    if (!rt) return null;
    rt.completed = !rt.completed;
    return rt;
  }

  public addRoutine(routine: Omit<RoutineItem, 'id' | 'completed'>): RoutineItem {
    const newRt: RoutineItem = {
      id: `rt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      completed: false,
      ...routine
    };
    this.routines.push(newRt);
    return newRt;
  }

  public deleteRoutine(id: string): boolean {
    const len = this.routines.length;
    this.routines = this.routines.filter((r) => r.id !== id);
    return this.routines.length < len;
  }

  public getPersonalGoals(): PersonalGoalItem[] {
    return this.personalGoals;
  }

  public addPersonalGoal(goal: Omit<PersonalGoalItem, 'id'>): PersonalGoalItem {
    const newGoal: PersonalGoalItem = {
      id: `pg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...goal
    };
    this.personalGoals.push(newGoal);
    return newGoal;
  }

  public updateGoalProgress(id: string, delta: number): PersonalGoalItem | null {
    const goal = this.personalGoals.find((g) => g.id === id);
    if (!goal) return null;
    goal.current = Math.min(goal.target, Math.max(0, goal.current + delta));
    return goal;
  }

  public deletePersonalGoal(id: string): boolean {
    const len = this.personalGoals.length;
    this.personalGoals = this.personalGoals.filter((g) => g.id !== id);
    return this.personalGoals.length < len;
  }

  public getJournalEntries(): JournalEntry[] {
    return this.journal;
  }

  public addJournalEntry(entry: Omit<JournalEntry, 'id' | 'date'>): JournalEntry {
    const newEntry: JournalEntry = {
      id: `j_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: 'Dzisiaj, ' + new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      ...entry
    };
    this.journal.unshift(newEntry);
    return newEntry;
  }

  public deleteJournalEntry(id: string): boolean {
    const len = this.journal.length;
    this.journal = this.journal.filter((j) => j.id !== id);
    return this.journal.length < len;
  }
}

export const dbStore = new DatabaseStore();
