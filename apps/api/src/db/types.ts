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
  teacher?: string;
}

export type EventId = string | number;
export const TEMP_EVENT_ID = '-1';

export interface SchoolEvent {
  id: EventId;
  date: string;
  type: 'absence' | 'kartkowka' | 'sprawdzian' | 'inne' | 'exam' | 'custom' | string;
  category: string;
  title: string;
  teacher?: string;
  description?: string;
  time?: string;
  subject?: string;
  info?: string;
}

export interface SingleGradeDetail {
  id: string;
  value: number;
  displayValue: string;
  weight: number;
  category: string;
  date?: string;
  teacher?: string;
  comment?: string;
  semester?: 1 | 2;
  isImprovement?: boolean;
  improvedGradeId?: string;
  improvedValue?: string;
  inAverage?: boolean;
}

export interface SubjectWithGrades {
  id: string;
  name: string;
  average: number;
  semester1Average?: number;
  semester2Average?: number;
  grades: SingleGradeDetail[];
}

export interface RoutineItem {
  id: string;
  timeOfDay: 'morning' | 'evening';
  title: string;
  detail: string;
  completed: boolean;
}

export interface PersonalGoalItem {
  id: string;
  category: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  deadline: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  date: string;
}
