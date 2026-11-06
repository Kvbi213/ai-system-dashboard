const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export interface ApiFetchOptions extends RequestInit {
  token?: string;
}

export async function apiFetch<T>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = options.token || localStorage.getItem('omnidash_auth_token') || 'dev-operator-token';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    'x-dev-bypass': 'true',
    ...(options.headers as Record<string, string> || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`API Error [${response.status}]: ${response.statusText}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    console.warn(`[!] API Gateway unreachable at ${url}, using offline fallback:`, error);
    throw error;
  }
}

// Tasks Domain
export const tasksApi = {
  getAll: () => apiFetch<{ tasks: any[] }>('/tasks'),
  create: (data: { title: string; priority: string; category?: string }) =>
    apiFetch<{ task: any }>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  toggle: (id: string) =>
    apiFetch<{ task: any }>(`/tasks/${id}/toggle`, { method: 'PATCH' }),
  delete: (id: string) =>
    apiFetch<{ success: boolean; id: string }>(`/tasks/${id}`, { method: 'DELETE' })
};

// Finance Domain
export const financeApi = {
  getOverview: () => apiFetch<any>('/finance/overview'),
  getTransactions: () => apiFetch<{ transactions: any[] }>('/finance/transactions'),
  addTransaction: (data: { title: string; amount: number; envelope: string; category?: string; type?: 'EXPENSE' | 'INCOME'; date?: string }) =>
    apiFetch<{ transaction: any }>('/finance/transactions', { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id: string, data: Partial<{ title: string; amount: number; envelope: string; category: string; type: string; date: string }>) =>
    apiFetch<{ transaction: any }>(`/finance/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTransaction: (id: string) =>
    apiFetch<{ success: boolean }>(`/finance/transactions/${id}`, { method: 'DELETE' }),
  resetFinances: (params?: { initialBalance?: number; needsRatio?: number; wantsRatio?: number; savingsRatio?: number }) =>
    apiFetch<{ success: boolean; clearedCount: number; message: string; newBalances?: any }>('/finance/reset', {
      method: 'POST',
      body: params ? JSON.stringify(params) : undefined
    }),
  getEnvelopes: () =>
    apiFetch<{ envelopes: any }>('/finance/envelopes'),
  updateEnvelopes: (data: Partial<{ needsBalance: number; wantsBalance: number; savingsBalance: number; needsTarget: number; wantsTarget: number; savingsTarget: number; monthlyIncome: number }>) =>
    apiFetch<{ success: boolean; envelopes: any }>('/finance/envelopes', { method: 'PUT', body: JSON.stringify(data) }),
  getSubscriptions: () => apiFetch<{ subscriptions: any[] }>('/finance/subscriptions'),
  addSubscription: (data: { name: string; category?: string; costPln: number; renewalDay?: number }) =>
    apiFetch<{ subscription: any }>('/finance/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
  toggleSubscription: (id: string) =>
    apiFetch<{ subscription: any }>(`/finance/subscriptions/${id}/toggle`, { method: 'PATCH' }),
  deleteSubscription: (id: string) =>
    apiFetch<{ success: boolean }>(`/finance/subscriptions/${id}`, { method: 'DELETE' }),
  getGoals: () => apiFetch<{ goals: any[] }>('/finance/goals'),
  addGoal: (data: { name: string; currentPln?: number; targetPln: number; deadline?: string }) =>
    apiFetch<{ goal: any }>('/finance/goals', { method: 'POST', body: JSON.stringify(data) }),
  depositGoal: (id: string, amount: number) =>
    apiFetch<{ goal: any }>(`/finance/goals/${id}/deposit`, { method: 'POST', body: JSON.stringify({ amount }) }),
  deleteGoal: (id: string) =>
    apiFetch<{ success: boolean }>(`/finance/goals/${id}`, { method: 'DELETE' })
};

// Workouts Domain
export const workoutsApi = {
  getExercises: () => apiFetch<{ exercises: any[] }>('/workouts/exercises'),
  addExercise: (data: { name: string; sets: number; reps: number; weightKg: number }) =>
    apiFetch<{ exercise: any }>('/workouts/exercises', { method: 'POST', body: JSON.stringify(data) }),
  incrementSet: (id: string) =>
    apiFetch<{ exercise: any; restTimerSeconds: number }>(`/workouts/exercises/${id}/increment`, { method: 'POST' }),
  resetExercise: (id: string) =>
    apiFetch<{ exercise: any }>(`/workouts/exercises/${id}/reset`, { method: 'POST' }),
  deleteExercise: (id: string) =>
    apiFetch<{ success: boolean }>(`/workouts/exercises/${id}`, { method: 'DELETE' }),
  getHabits: () => apiFetch<{ habits: any[] }>('/workouts/habits'),
  addHabit: (title: string) =>
    apiFetch<{ habit: any }>('/workouts/habits', { method: 'POST', body: JSON.stringify({ title }) }),
  toggleHabit: (id: string) =>
    apiFetch<{ habit: any }>(`/workouts/habits/${id}/toggle`, { method: 'POST' }),
  deleteHabit: (id: string) =>
    apiFetch<{ success: boolean }>(`/workouts/habits/${id}`, { method: 'DELETE' }),
  getRecords: () => apiFetch<{ records: any[] }>('/workouts/records'),
  addRecord: (data: { exercise: string; record: string; extra?: string }) =>
    apiFetch<{ record: any }>('/workouts/records', { method: 'POST', body: JSON.stringify(data) }),
  deleteRecord: (exercise: string) =>
    apiFetch<{ success: boolean }>(`/workouts/records/${encodeURIComponent(exercise)}`, { method: 'DELETE' })
};

// School Domain
export const schoolApi = {
  getTimetable: (day = 1) => apiFetch<{ day: number; lessons: any[]; substitutionsCount?: number; meta: any }>(`/school/timetable?day=${day}`),
  getSubstitutions: (day?: number) => apiFetch<{ substitutions: any[]; count: number; day: number | null; meta: any }>(`/school/substitutions${day ? `?day=${day}` : ''}`),
  getAllWeekTimetable: () => apiFetch<any>('/school/read-all'),
  getGrades: () => apiFetch<{ grades: any[]; subjects: any[]; stats: any }>('/school/grades'),
  getAttendance: () => apiFetch<any>('/school/attendance'),
  getEvents: () => apiFetch<{ events: any[] }>('/school/events'),
  syncLibrus: () => apiFetch<{ success: boolean; message: string; stats?: any }>('/school/sync', { method: 'POST' })
};

// Private Hub Domain
export const privateApi = {
  getRoutines: () => apiFetch<{ routines: any[] }>('/private/routines'),
  addRoutine: (data: { title: string; detail?: string; timeOfDay: 'morning' | 'evening' }) =>
    apiFetch<{ routine: any }>('/private/routines', { method: 'POST', body: JSON.stringify(data) }),
  toggleRoutine: (id: string) =>
    apiFetch<{ routine: any }>(`/private/routines/${id}/toggle`, { method: 'PATCH' }),
  deleteRoutine: (id: string) =>
    apiFetch<{ success: boolean }>(`/private/routines/${id}`, { method: 'DELETE' }),
  getGoals: () => apiFetch<{ goals: any[] }>('/private/goals'),
  addGoal: (data: { title: string; category?: string; current?: number; target: number; unit?: string; deadline?: string }) =>
    apiFetch<{ goal: any }>('/private/goals', { method: 'POST', body: JSON.stringify(data) }),
  updateGoalProgress: (id: string, delta: number) =>
    apiFetch<{ goal: any }>(`/private/goals/${id}/progress`, { method: 'PATCH', body: JSON.stringify({ delta }) }),
  deleteGoal: (id: string) =>
    apiFetch<{ success: boolean }>(`/private/goals/${id}`, { method: 'DELETE' }),
  getJournal: () => apiFetch<{ entries: any[] }>('/private/journal'),
  addJournalEntry: (data: { title: string; content: string; category?: string }) =>
    apiFetch<{ entry: any }>('/private/journal', { method: 'POST', body: JSON.stringify(data) }),
  deleteJournalEntry: (id: string) =>
    apiFetch<{ success: boolean }>(`/private/journal/${id}`, { method: 'DELETE' }),
  getHabits: () => apiFetch<{ habits: any[] }>('/private/habits'),
  addHabit: (title: string) =>
    apiFetch<{ habit: any }>('/private/habits', { method: 'POST', body: JSON.stringify({ title }) }),
  toggleHabit: (id: string) =>
    apiFetch<{ habit: any; completedToday?: boolean; streak?: number }>(`/private/habits/${id}/toggle`, { method: 'POST' }),
  deleteHabit: (id: string) =>
    apiFetch<{ success: boolean }>(`/private/habits/${id}`, { method: 'DELETE' })
};

// Traffic Domain
export const trafficApi = {
  getCameras: () => apiFetch<{ cameras: any[] }>('/traffic/cameras'),
  getRadars: () => apiFetch<{ radars: any[] }>('/traffic/radars'),
  getAlerts: () => apiFetch<any>('/traffic/alerts')
};

// System Domain
export const systemApi = {
  getHealth: () => apiFetch<any>('/system/health'),
  getStatus: () => apiFetch<any>('/system/status'),
  getTelemetry: () => apiFetch<any>('/system/telemetry'),
  getSetupStatus: () => apiFetch<{ isConfigured: boolean; config: any }>('/system/setup-status'),
  setupInitialize: (data: { operatorName?: string; schoolClass?: string; pushbulletKey?: string; monthlyIncome?: number; startingBalance?: number; theme?: string; timetableHtml?: string }) =>
    apiFetch<{ success: boolean; message: string; config: any }>('/system/setup-initialize', { method: 'POST', body: JSON.stringify(data) }),
  getExportUrl: () => `${API_BASE_URL}/system/export`
};

// News Domain
export const newsApi = {
  getTicker: () => apiFetch<{ news: any[] }>('/news/ticker')
};

// AI Domain
export const aiApi = {
  getModels: () => apiFetch<{ models: any[]; activeModel: string }>('/ai/models'),
  sendMessage: (message: string) =>
    apiFetch<{ reply: string; toolCall?: any; widgets?: string[]; timestamp: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    })
};

// Automation Domain
export const automationApi = {
  getTemplates: () => apiFetch<{ templates: any[] }>('/automation/templates'),
  getContextStatus: () => apiFetch<any>('/automation/context-status'),
  getScripts: () => apiFetch<{ scripts: any[] }>('/automation/scripts'),
  getScript: (id: string) => apiFetch<{ script: any }>(`/automation/scripts/${id}`),
  saveScript: (data: any) =>
    apiFetch<{ script: any }>('/automation/scripts', { method: 'POST', body: JSON.stringify(data) }),
  toggleScript: (id: string) =>
    apiFetch<{ script: any }>(`/automation/scripts/${id}/toggle`, { method: 'PATCH' }),
  deleteScript: (id: string) =>
    apiFetch<{ success: boolean }>(`/automation/scripts/${id}`, { method: 'DELETE' }),
  runScript: (id: string, simulatedDate?: string) =>
    apiFetch<{ scriptId: string; execution: any }>(`/automation/scripts/${id}/run`, {
      method: 'POST',
      body: JSON.stringify({ simulatedDate })
    }),
  previewScript: (code: string, simulatedDate?: string) =>
    apiFetch<{ execution: any }>('/automation/preview', {
      method: 'POST',
      body: JSON.stringify({ code, simulatedDate })
    })
};

// Memory Domain (Lab-Zero Semantic Recall)
export const memoryApi = {
  recall: (query: string, limit = 4, minScore = 0.2) =>
    apiFetch<{ query: string; results: { content: string; category: string; score: number }[]; latencyMs: number }>(
      '/memory/recall',
      { method: 'POST', body: JSON.stringify({ query, limit, minScore }) }
    ),
  getFacts: () => apiFetch<{ count: number; facts: any[] }>('/memory/facts'),
  getStatus: () => apiFetch<any>('/memory/status')
};

// OSINT Domain
export const osintApi = {
  lookup: (target: string) => apiFetch<any>(`/osint/lookup?target=${encodeURIComponent(target)}`)
};

// Pushbullet Domain
export const pushbulletApi = {
  send: (data: { title: string; body: string; priority?: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW'; tokenOverride?: string }) =>
    apiFetch<{ success: boolean; iden?: string; simulated?: boolean; message?: string }>('/pushbullet/send', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  testToken: (token?: string) =>
    apiFetch<{ success?: boolean; valid?: boolean; user?: { name: string; email: string; iden: string }; error?: string }>('/pushbullet/test', {
      method: 'POST',
      body: JSON.stringify({ token })
    }),
  getHistory: () => apiFetch<{ history: any[] }>('/pushbullet/history')
};

// Calendar Domain
export const calendarApi = {
  getEvents: () => apiFetch<{ events: any[]; total?: number }>('/calendar/events'),
  addEvent: (data: { title: string; date: string; category?: string; description?: string }) =>
    apiFetch<{ success: boolean; event: any }>('/calendar/events', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deleteEvent: (eventId: string | number) =>
    apiFetch<{ success: boolean }>(`/calendar/events/${eventId}`, {
      method: 'DELETE'
    })
};
