export interface MemoryFact {
  id: string;
  category: 'HABIT' | 'WORKOUT' | 'FINANCE' | 'SCHOOL' | 'SYSTEM' | 'PREFERENCE';
  content: string;
  tags: string[];
  vector: number[];
  createdAt: string;
}

export interface RecallResult {
  fact: MemoryFact;
  score: number;
}

const VECTOR_DIMENSIONS = 128;

function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function computeDenseEmbedding(text: string): number[] {
  const vec = new Float64Array(VECTOR_DIMENSIONS);
  const normalized = text.toLowerCase().replace(/[^a-ząćęłńóśźż0-9\s]/gi, ' ');
  const words = normalized.split(/\s+/).filter(Boolean);

  for (const word of words) {
    // Word hash
    const wHash = hashString(word);
    const wIdx = wHash % VECTOR_DIMENSIONS;
    const wSign = (wHash & 1) === 0 ? 1 : -1;
    vec[wIdx] += wSign * 1.5;

    // Character 3-grams
    if (word.length >= 3) {
      for (let i = 0; i <= word.length - 3; i++) {
        const tri = word.slice(i, i + 3);
        const tHash = hashString(tri);
        const tIdx = tHash % VECTOR_DIMENSIONS;
        const tSign = (tHash & 1) === 0 ? 1 : -1;
        vec[tIdx] += tSign * 0.7;
      }
    }
  }

  // L2 Normalization
  let norm = 0;
  for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
    norm += (vec[i] ?? 0) * (vec[i] ?? 0);
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
      const val = vec[i] ?? 0;
      vec[i] = val / norm;
    }
  }

  return Array.from(vec);
}

export function cosineSimilarity(v1: number[], v2: number[]): number {
  let dot = 0;
  const len = Math.min(v1.length, v2.length);
  for (let i = 0; i < len; i++) {
    dot += (v1[i] ?? 0) * (v2[i] ?? 0);
  }
  return Math.max(0, Math.min(1, dot));
}

const SEED_MEMORY_FACTS: Omit<MemoryFact, 'vector' | 'createdAt'>[] = [
  {
    id: 'fact_habit_wakeup',
    category: 'HABIT',
    content: 'Pobudka o 06:30, poranny rozruch stawowy, szklanka wody 500ml z elektrolitami oraz 10 minut ekspozycji na światło dzienne.',
    tags: ['sen', 'poranek', 'rutyna', 'woda']
  },
  {
    id: 'fact_habit_sleep',
    category: 'HABIT',
    content: 'Higiena snu: ostatni posiłek o 20:00 (3h przed snem), wyciszenie i czytanie o 22:15, sen docelowy o 23:00.',
    tags: ['sen', 'wieczor', 'posiłek', 'regeneracja']
  },
  {
    id: 'fact_workout_fbw',
    category: 'WORKOUT',
    content: 'Trening siłowy FBW na strychu: drążek (nachwyt/chwyt neutralny), pompki na poręczach (dipy), tempo 3-0-1-0, przerwy 90-120s.',
    tags: ['trening', 'kalistenika', 'drążek', 'dipy', 'strych']
  },
  {
    id: 'fact_finance_503020',
    category: 'FINANCE',
    content: 'Reguła budżetowa 50/30/20: 50% potrzeby stałe, 30% zachcianki i kultura, 20% oszczędności i poduszka finansowa.',
    tags: ['budżet', 'finanse', 'koperty', 'oszczędności']
  },
  {
    id: 'fact_school_class',
    category: 'SCHOOL',
    content: 'Uczeń klasy 2 TI (Technik Informatyk) w ZSE, wychowawczyni Ziemba Joanna s. 31, pracownie systemów i LSK.',
    tags: ['szkoła', 'librus', 'klasa', 'informatyk']
  },
  {
    id: 'fact_system_infra',
    category: 'SYSTEM',
    content: 'Infrastruktura: Desktop Windows 11 + WSL Ubuntu, API Gateway Node/Express (5000), Web Vite (3000), serwer Mikr.us LXC.',
    tags: ['system', 'architektura', 'serwer', 'mikrus', 'docker']
  }
];

export class SemanticMemoryStore {
  private facts: MemoryFact[] = [];

  constructor() {
    this.seed();
  }

  private seed(): void {
    this.facts = SEED_MEMORY_FACTS.map((f) => ({
      ...f,
      vector: computeDenseEmbedding(f.content + ' ' + f.tags.join(' ')),
      createdAt: new Date().toISOString()
    }));
  }

  public getFacts(): MemoryFact[] {
    return this.facts;
  }

  public addFact(data: { category: MemoryFact['category']; content: string; tags: string[] }): MemoryFact {
    const newFact: MemoryFact = {
      id: `fact_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      category: data.category,
      content: data.content,
      tags: data.tags,
      vector: computeDenseEmbedding(data.content + ' ' + data.tags.join(' ')),
      createdAt: new Date().toISOString()
    };
    this.facts.push(newFact);
    return newFact;
  }

  public recall(query: string, limit = 3, minScore = 0.25): { query: string; results: RecallResult[]; latencyMs: number } {
    const t0 = performance.now();
    const queryVec = computeDenseEmbedding(query);

    const scored: RecallResult[] = this.facts.map((fact) => ({
      fact,
      score: cosineSimilarity(queryVec, fact.vector)
    }));

    scored.sort((a, b) => b.score - a.score);

    const filtered = scored.filter((r) => r.score >= minScore).slice(0, limit);
    const latencyMs = Math.round((performance.now() - t0) * 100) / 100;

    return {
      query,
      results: filtered,
      latencyMs
    };
  }
}

export const semanticMemory = new SemanticMemoryStore();
