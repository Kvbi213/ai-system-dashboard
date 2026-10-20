/**
 * Default fallback and initial seed datasets for OmniDash
 * Decoupled from pages to ensure clean Vite lazy chunk splitting.
 */

export const INITIAL_FINANCE_TRANSACTIONS = [
  {
    id: 'tx_init_1',
    type: 'income',
    amount: 5200,
    category: 'Wynagrodzenie',
    bucket: 'needs',
    splitMode: 'split',
    description: 'Wynagrodzenie zasadnicze (Rozbicie 50/30/20)',
    transaction_date: '2026-10-01'
  },
  {
    id: 'tx_init_2',
    type: 'expense',
    amount: 2100,
    category: 'Mieszkanie',
    bucket: 'needs',
    description: 'Czynsz i opłaty eksploatacyjne',
    transaction_date: '2026-10-02'
  },
  {
    id: 'tx_init_3',
    type: 'expense',
    amount: 620,
    category: 'Wyżywienie',
    bucket: 'needs',
    description: 'Zakupy spożywcze dyskont',
    transaction_date: '2026-10-08'
  },
  {
    id: 'tx_init_4',
    type: 'expense',
    amount: 149,
    category: 'Rozrywka',
    bucket: 'wants',
    description: 'Karnet siłownia / Strych & treningi',
    transaction_date: '2026-10-10'
  },
  {
    id: 'tx_init_5',
    type: 'expense',
    amount: 180,
    category: 'Subskrypcje',
    bucket: 'wants',
    description: 'Subskrypcja API Groq LPU & Cloud',
    transaction_date: '2026-10-12'
  },
  {
    id: 'tx_init_6',
    type: 'expense',
    amount: 1040,
    category: 'Oszczędności',
    bucket: 'savings',
    description: 'Przelew na konto oszczędnościowe / poduszka',
    transaction_date: '2026-10-05'
  }
];

export const DEFAULT_WORKOUT_HISTORY = [
  {
    id: 'w_hist_1',
    title: 'Full Body Workout (FBW) — Split Strych (Poniedziałek)',
    type: 'Siłowy',
    duration_minutes: 52,
    completed_sets: 12,
    total_sets: 12,
    weight_kg: 78.4,
    date: '2026-10-19',
    description: 'Progresja ciężaru w OHP (+1kg). Bardzo dobra dynamika podciągania, pełny zakres ruchu.'
  },
  {
    id: 'w_hist_2',
    title: 'Full Body Workout (FBW) — Split Strych (Piątek)',
    type: 'Siłowy',
    duration_minutes: 48,
    completed_sets: 12,
    total_sets: 12,
    weight_kg: 78.2,
    date: '2026-10-16',
    description: 'Goblet Squat 26kg x 12 powtórzeń. Wiosłowanie hantlem stabilne, RPE 8.'
  }
];
