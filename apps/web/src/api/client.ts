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

// Domain API Callers
export const tasksApi = {
  getAll: () => apiFetch<{ tasks: any[] }>('/tasks'),
  create: (data: { title: string; priority: string; category?: string }) =>
    apiFetch<{ task: any }>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  toggle: (id: string) =>
    apiFetch<{ task: any }>(`/tasks/${id}/toggle`, { method: 'PATCH' }),
  delete: (id: string) =>
    apiFetch<{ success: boolean; id: string }>(`/tasks/${id}`, { method: 'DELETE' })
};

export const financeApi = {
  getOverview: () => apiFetch<any>('/finance/overview'),
  getTransactions: () => apiFetch<{ transactions: any[] }>('/finance/transactions'),
  addTransaction: (data: { title: string; amount: number; envelope: string; category: string }) =>
    apiFetch<{ transaction: any }>('/finance/transactions', { method: 'POST', body: JSON.stringify(data) })
};

export const workoutsApi = {
  getExercises: () => apiFetch<{ exercises: any[] }>('/workouts/exercises'),
  incrementSet: (id: string) =>
    apiFetch<{ exercise: any; restTimerSeconds: number }>(`/workouts/exercises/${id}/increment`, { method: 'POST' }),
  getHabits: () => apiFetch<{ habits: any[] }>('/workouts/habits'),
  toggleHabit: (id: string) =>
    apiFetch<{ habit: any }>(`/workouts/habits/${id}/toggle`, { method: 'POST' }),
  getRecords: () => apiFetch<{ records: any[] }>('/workouts/records')
};

export const schoolApi = {
  getTimetable: (day = 1) => apiFetch<{ day: number; lessons: any[]; meta: any }>(`/school/timetable?day=${day}`),
  getGrades: () => apiFetch<{ grades: any[]; stats: any }>('/school/grades'),
  getAttendance: () => apiFetch<any>('/school/attendance')
};

export const trafficApi = {
  getCameras: () => apiFetch<{ cameras: any[] }>('/traffic/cameras'),
  getRadars: () => apiFetch<{ radars: any[] }>('/traffic/radars'),
  getAlerts: () => apiFetch<any>('/traffic/alerts')
};

export const systemApi = {
  getHealth: () => apiFetch<any>('/system/health'),
  getStatus: () => apiFetch<any>('/system/status'),
  getExportUrl: () => `${API_BASE_URL}/system/export`
};

export const newsApi = {
  getTicker: () => apiFetch<{ news: any[] }>('/news/ticker')
};

export const aiApi = {
  getModels: () => apiFetch<{ models: any[]; activeModel: string }>('/ai/models'),
  sendMessage: (message: string) =>
    apiFetch<{ reply: string; toolCall?: any; timestamp: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    })
};

export const osintApi = {
  lookup: (target: string) => apiFetch<any>(`/osint/lookup?target=${encodeURIComponent(target)}`)
};
