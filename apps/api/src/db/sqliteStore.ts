import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');

import {
  HabitItem,
  TransactionItem,
  TaskItem,
  AutomationScriptItem
} from './types.js';
import {
  SEED_HABITS,
  SEED_TASKS,
  SEED_TRANSACTIONS
} from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface SqliteHabitRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  frequency: string;
  streak: number;
  best_streak: number;
  last_completed_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SqliteTransactionRow {
  id: string;
  type: string;
  amount: number;
  currency: string;
  category: string;
  envelope: string;
  description: string;
  transaction_date: string;
  created_at: string;
}

export interface SqliteFinanceEnvelopesRow {
  id: string;
  needs_balance: number;
  wants_balance: number;
  savings_balance: number;
  needs_target_percent: number;
  wants_target_percent: number;
  savings_target_percent: number;
  monthly_income: number;
  updated_at: string;
}

export interface SqliteTaskRow {
  id: string;
  title: string;
  completed: number;
  priority: string;
  category: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SqliteAutomationScriptRow {
  id: string;
  name: string;
  description: string | null;
  template_id: string | null;
  trigger_type: string;
  cron_expression: string | null;
  code: string;
  enabled: number;
  last_run: string | null;
  last_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface SqliteSystemConfigRow {
  key: string;
  value: string;
  updated_at: string;
}

export interface EveningDigestRecord {
  id: string;
  date: string;
  summaryText: string;
  provider: string;
  model: string;
  sentToPushbullet: boolean;
  rawPayloadJson?: string;
  createdAt: string;
}

export interface SqliteEveningDigestRow {
  id: string;
  date: string;
  summary_text: string;
  provider: string;
  model: string;
  sent_to_pushbullet: number;
  raw_payload_json: string | null;
  created_at: string;
}

export class SqliteStore {
  private db: any;
  private readonly dbPath: string;

  constructor(customPath?: string) {
    if (customPath) {
      this.dbPath = customPath;
    } else {
      const dataDir = path.resolve(__dirname, '../../data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      this.dbPath = path.join(dataDir, 'omnidash.sqlite');
    }

    this.db = new DatabaseSync(this.dbPath);
    this.initSchema();
  }

  private initSchema(): void {
    // 1. Tabela konfiguracji systemu & stanu onboardingu
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS system_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // 2. Tabela nawyków i rutyn dobowych z licznikiem streaków
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL DEFAULT 'zdrowie',
        frequency TEXT NOT NULL DEFAULT 'daily',
        streak INTEGER NOT NULL DEFAULT 0,
        best_streak INTEGER NOT NULL DEFAULT 0,
        last_completed_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // 3. Tabela historii wykonań nawyków (każdy dzień to unikalny rekord)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS habit_completions (
        id TEXT PRIMARY KEY,
        habit_id TEXT NOT NULL,
        completed_date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(habit_id, completed_date),
        FOREIGN KEY(habit_id) REFERENCES habits(id) ON DELETE CASCADE
      );
    `);

    // 4. Tabela transakcji finansowych (wydatki i przychody)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS finance_transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'PLN',
        category TEXT NOT NULL,
        envelope TEXT NOT NULL,
        description TEXT NOT NULL,
        transaction_date TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    // 5. Tabela salda kopert 50/30/20
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS finance_envelopes (
        id TEXT PRIMARY KEY,
        needs_balance REAL NOT NULL DEFAULT 0,
        wants_balance REAL NOT NULL DEFAULT 0,
        savings_balance REAL NOT NULL DEFAULT 0,
        needs_target_percent REAL NOT NULL DEFAULT 50,
        wants_target_percent REAL NOT NULL DEFAULT 30,
        savings_target_percent REAL NOT NULL DEFAULT 20,
        monthly_income REAL NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );
    `);

    // 6. Tabela zadań (Task Tracker)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        priority TEXT NOT NULL DEFAULT 'NORMAL',
        category TEXT,
        due_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // 7. Tabela skryptów automatyzacji
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS automation_scripts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        template_id TEXT,
        trigger_type TEXT NOT NULL DEFAULT 'lesson_bell',
        cron_expression TEXT,
        code TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        last_run TEXT,
        last_status TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // 8. Tabela wieczornych podsumowań AI (Evening Digests)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS evening_digests (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        summary_text TEXT NOT NULL,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        sent_to_pushbullet INTEGER NOT NULL DEFAULT 0,
        raw_payload_json TEXT,
        created_at TEXT NOT NULL
      );
    `);

    // Domyślny rekord kopert jeśli brak
    const envStmt = this.db.prepare('SELECT id FROM finance_envelopes WHERE id = ?');
    const existingEnv = envStmt.get('primary');
    if (!existingEnv) {
      const nowIso = new Date().toISOString();
      const insertEnv = this.db.prepare(`
        INSERT INTO finance_envelopes (
          id, needs_balance, wants_balance, savings_balance,
          needs_target_percent, wants_target_percent, savings_target_percent,
          monthly_income, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertEnv.run('primary', 0, 0, 0, 50, 30, 20, 0, nowIso);
    }
  }

  // --- SEKCJA: KONFIGURACJA I SETUP WIZARD ---

  public isConfigured(): boolean {
    const stmt = this.db.prepare("SELECT value FROM system_config WHERE key = 'is_configured'");
    const row = stmt.get() as { value: string } | undefined;
    if (!row) return false;
    return row.value === 'true' || row.value === '1';
  }

  public setConfigured(status: boolean, details?: Record<string, string>): void {
    const nowIso = new Date().toISOString();
    const upsert = this.db.prepare(`
      INSERT INTO system_config (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    upsert.run('is_configured', status ? 'true' : 'false', nowIso);

    if (details) {
      for (const [k, v] of Object.entries(details)) {
        upsert.run(k, String(v), nowIso);
      }
    }
  }

  public getConfig(key: string): string | null {
    const stmt = this.db.prepare('SELECT value FROM system_config WHERE key = ?');
    const row = stmt.get(key) as { value: string } | undefined;
    return row ? row.value : null;
  }

  public setConfig(key: string, value: string): void {
    const nowIso = new Date().toISOString();
    const upsert = this.db.prepare(`
      INSERT INTO system_config (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);
    upsert.run(key, value, nowIso);
  }

  public getAllConfig(): Record<string, string> {
    const stmt = this.db.prepare('SELECT key, value FROM system_config');
    const rows = stmt.all() as { key: string; value: string }[];
    const result: Record<string, string> = {};
    for (const r of rows) {
      result[r.key] = r.value;
    }
    return result;
  }

  // --- SEKCJA: NAWYKI & STREAKI (HABIT TRACKING ENGINE) ---

  public getHabits(): HabitItem[] {
    const stmt = this.db.prepare('SELECT * FROM habits ORDER BY created_at ASC');
    const rows = stmt.all() as SqliteHabitRow[];

    if (rows.length === 0) {
      const isInit = this.getConfig('habits_initialized');
      if (!isInit) {
        this.setConfig('habits_initialized', 'true');
        return this.seedInitialHabits();
      }
      return [];
    }

    const todayIso = new Date().toISOString().split('T')[0];

    return rows.map((r) => {
      // Sprawdź czy ukończono dzisiaj w tabeli habit_completions
      const compStmt = this.db.prepare('SELECT id FROM habit_completions WHERE habit_id = ? AND completed_date = ?');
      const isCompletedToday = Boolean(compStmt.get(r.id, todayIso));

      return {
        id: r.id,
        title: r.title,
        name: r.title,
        streakDays: r.streak,
        streak: r.streak,
        bestStreak: r.best_streak,
        completedToday: isCompletedToday,
        lastCompletedDate: r.last_completed_date || undefined,
        category: r.category as any,
        frequency: r.frequency as any
      };
    });
  }

  private seedInitialHabits(): HabitItem[] {
    const nowIso = new Date().toISOString();
    const insert = this.db.prepare(`
      INSERT INTO habits (id, title, category, frequency, streak, best_streak, last_completed_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result: HabitItem[] = [];
    for (const h of SEED_HABITS) {
      const title = h.title || h.name || 'Nawyk';
      const streak = h.streakDays ?? h.streak ?? 0;
      insert.run(
        h.id,
        title,
        h.category || 'zdrowie',
        'daily',
        streak,
        Math.max(streak, 7),
        null,
        nowIso,
        nowIso
      );
      result.push({
        id: h.id,
        title,
        name: title,
        streakDays: streak,
        streak,
        bestStreak: Math.max(streak, 7),
        completedToday: Boolean(h.completedToday),
        category: (h.category as any) || 'zdrowie',
        frequency: 'daily'
      });
    }
    return result;
  }

  /**
   * Przełącza stan wykonania nawyku na dany dzień i deterministycznie przelicza streak.
   */
  public toggleHabit(habitId: string, customDate?: string): { habit: HabitItem; completedToday: boolean; streak: number } {
    const targetDate = customDate || new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    const habitStmt = this.db.prepare('SELECT * FROM habits WHERE id = ?');
    const habit = habitStmt.get(habitId) as SqliteHabitRow | undefined;
    if (!habit) {
      throw new Error(`Nawyk o ID ${habitId} nie istnieje w bazie SQLite.`);
    }

    const checkStmt = this.db.prepare('SELECT id FROM habit_completions WHERE habit_id = ? AND completed_date = ?');
    const existing = checkStmt.get(habitId, targetDate) as { id: string } | undefined;

    let newStreak = habit.streak;
    let newBestStreak = habit.best_streak;
    let completed = false;

    if (existing) {
      // Odznaczenie wykonania (un-toggle)
      const delStmt = this.db.prepare('DELETE FROM habit_completions WHERE id = ?');
      delStmt.run(existing.id);

      newStreak = Math.max(0, habit.streak - 1);
      completed = false;

      // Szukaj ostatniej poprzedniej daty ukończenia
      const prevStmt = this.db.prepare('SELECT completed_date FROM habit_completions WHERE habit_id = ? ORDER BY completed_date DESC LIMIT 1');
      const prevRow = prevStmt.get(habitId) as { completed_date: string } | undefined;
      const lastDate = prevRow ? prevRow.completed_date : null;

      const updateStmt = this.db.prepare(`
        UPDATE habits SET streak = ?, last_completed_date = ?, updated_at = ? WHERE id = ?
      `);
      updateStmt.run(newStreak, lastDate, nowIso, habitId);

      return {
        habit: {
          id: habit.id,
          title: habit.title,
          name: habit.title,
          streakDays: newStreak,
          streak: newStreak,
          bestStreak: newBestStreak,
          completedToday: false,
          lastCompletedDate: lastDate || undefined,
          category: habit.category as any,
          frequency: habit.frequency as any
        },
        completedToday: false,
        streak: newStreak
      };
    } else {
      // Zaznaczenie wykonania nawyku
      const compId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const insComp = this.db.prepare('INSERT INTO habit_completions (id, habit_id, completed_date, created_at) VALUES (?, ?, ?, ?)');
      insComp.run(compId, habitId, targetDate, nowIso);

      completed = true;

      // Oblicz ciągłość (streak)
      const lastDateStr = habit.last_completed_date;
      if (!lastDateStr) {
        newStreak = 1;
      } else {
        const lastDate = new Date(lastDateStr);
        const currDate = new Date(targetDate);
        const diffMs = currDate.getTime() - lastDate.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Kontynuacja bez przerwy: wczoraj i dzisiaj
          newStreak = habit.streak + 1;
        } else if (diffDays === 0) {
          // Ten sam dzień
          newStreak = habit.streak;
        } else {
          // Nastąpiła przerwa > 1 dzień: reset do 1
          newStreak = 1;
        }
      }

      if (newStreak > newBestStreak) {
        newBestStreak = newStreak;
      }

      const updateStmt = this.db.prepare(`
        UPDATE habits SET streak = ?, best_streak = ?, last_completed_date = ?, updated_at = ? WHERE id = ?
      `);
      updateStmt.run(newStreak, newBestStreak, targetDate, nowIso, habitId);

      return {
        habit: {
          id: habit.id,
          title: habit.title,
          name: habit.title,
          streakDays: newStreak,
          streak: newStreak,
          bestStreak: newBestStreak,
          completedToday: true,
          lastCompletedDate: targetDate,
          category: habit.category as any,
          frequency: habit.frequency as any
        },
        completedToday: true,
        streak: newStreak
      };
    }
  }

  public saveHabit(data: Partial<HabitItem> & { name?: string; title?: string }): HabitItem {
    const habitTitle = data.title || data.name || 'Nowy Nawyk';
    const id = data.id || `habit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const existingStmt = this.db.prepare('SELECT id, streak, best_streak FROM habits WHERE id = ?');
    const existing = existingStmt.get(id) as { id: string; streak: number; best_streak: number } | undefined;

    if (existing) {
      const update = this.db.prepare(`
        UPDATE habits SET title = ?, category = ?, frequency = ?, updated_at = ? WHERE id = ?
      `);
      update.run(habitTitle, data.category || 'zdrowie', data.frequency || 'daily', nowIso, id);
      return {
        id,
        title: habitTitle,
        name: habitTitle,
        streakDays: existing.streak,
        streak: existing.streak,
        bestStreak: existing.best_streak,
        completedToday: Boolean(data.completedToday),
        category: (data.category as any) || 'zdrowie',
        frequency: (data.frequency as any) || 'daily'
      };
    } else {
      const insert = this.db.prepare(`
        INSERT INTO habits (id, title, category, frequency, streak, best_streak, last_completed_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insert.run(id, habitTitle, data.category || 'zdrowie', data.frequency || 'daily', 0, 0, null, nowIso, nowIso);
      return {
        id,
        title: habitTitle,
        name: habitTitle,
        streakDays: 0,
        streak: 0,
        bestStreak: 0,
        completedToday: false,
        category: (data.category as any) || 'zdrowie',
        frequency: (data.frequency as any) || 'daily'
      };
    }
  }

  public deleteHabit(habitId: string): boolean {
    const stmt = this.db.prepare('DELETE FROM habits WHERE id = ?');
    stmt.run(habitId);
    return true;
  }

  // --- SEKCJA: FINANSE & KOPERTY 50/30/20 ---

  public getTransactions(filter?: { type?: string; envelope?: string; category?: string }): TransactionItem[] {
    let sql = 'SELECT * FROM finance_transactions';
    const params: any[] = [];
    const clauses: string[] = [];

    if (filter?.type) {
      clauses.push('type = ?');
      params.push(filter.type.toLowerCase());
    }
    if (filter?.envelope) {
      clauses.push('envelope = ?');
      params.push(filter.envelope.toLowerCase());
    }
    if (filter?.category) {
      clauses.push('category = ?');
      params.push(filter.category);
    }

    if (clauses.length > 0) {
      sql += ' WHERE ' + clauses.join(' AND ');
    }
    sql += ' ORDER BY transaction_date DESC, created_at DESC';

    const stmt = this.db.prepare(sql);
    const rows = (params.length > 0 ? stmt.all(...params) : stmt.all()) as SqliteTransactionRow[];

    if (rows.length === 0 && !filter) {
      const isInit = this.getConfig('finances_initialized');
      if (!isInit) {
        this.setConfig('finances_initialized', 'true');
        return this.seedInitialTransactions();
      }
      return [];
    }

    return rows.map((r) => ({
      id: r.id,
      userId: 'operator-system-core',
      title: r.description,
      amount: r.amount,
      type: (r.type.toUpperCase() as 'EXPENSE' | 'INCOME'),
      category: r.category,
      envelope: (r.envelope.toUpperCase() as 'NEEDS' | 'WANTS' | 'SAVINGS'),
      date: r.transaction_date
    }));
  }

  private seedInitialTransactions(): TransactionItem[] {
    const nowIso = new Date().toISOString();
    const insert = this.db.prepare(`
      INSERT INTO finance_transactions (id, type, amount, currency, category, envelope, description, transaction_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result: TransactionItem[] = [];
    for (const t of SEED_TRANSACTIONS) {
      const type = t.type.toLowerCase();
      const env = (t.envelope || 'needs').toLowerCase();
      insert.run(t.id, type, t.amount, 'PLN', t.category, env, t.title, t.date, nowIso);
      result.push(t);
    }
    this.recalculateEnvelopesFromTransactions();
    return result;
  }

  public addTransaction(tx: Omit<TransactionItem, 'id' | 'userId'> & { id?: string; userId?: string }): TransactionItem {
    const id = tx.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();
    const typeUpper = (tx.type || 'EXPENSE').toUpperCase() as 'EXPENSE' | 'INCOME';
    const type = typeUpper.toLowerCase();
    const envelopeUpper = (tx.envelope || 'NEEDS').toUpperCase() as 'NEEDS' | 'WANTS' | 'SAVINGS';
    const envelope = envelopeUpper.toLowerCase();
    const category = tx.category || 'Ogólne';
    const desc = tx.title || 'Transakcja';
    const date = tx.date || nowIso.split('T')[0];

    const insert = this.db.prepare(`
      INSERT INTO finance_transactions (id, type, amount, currency, category, envelope, description, transaction_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(id, type, Number(tx.amount), 'PLN', category, envelope, desc, date, nowIso);

    this.recalculateEnvelopesFromTransactions();

    return {
      id,
      userId: 'operator-system-core',
      title: desc,
      amount: Number(tx.amount),
      type: typeUpper,
      category,
      envelope: envelopeUpper,
      date
    };
  }

  public updateTransaction(id: string, updates: Partial<TransactionItem>): TransactionItem | null {
    const stmt = this.db.prepare('SELECT * FROM finance_transactions WHERE id = ?');
    const existing = stmt.get(id) as SqliteTransactionRow | undefined;
    if (!existing) return null;

    const newType = updates.type ? updates.type.toLowerCase() : existing.type;
    const newAmount = updates.amount !== undefined ? Number(updates.amount) : existing.amount;
    const newCategory = updates.category !== undefined ? updates.category : existing.category;
    const newEnvelope = updates.envelope !== undefined ? updates.envelope.toLowerCase() : existing.envelope;
    const newDesc = updates.title !== undefined ? updates.title : existing.description;
    const newDate = updates.date !== undefined ? updates.date : existing.transaction_date;

    const updateStmt = this.db.prepare(`
      UPDATE finance_transactions
      SET type = ?, amount = ?, category = ?, envelope = ?, description = ?, transaction_date = ?
      WHERE id = ?
    `);
    updateStmt.run(newType, newAmount, newCategory, newEnvelope, newDesc, newDate, id);

    this.recalculateEnvelopesFromTransactions();

    return {
      id,
      userId: 'operator-system-core',
      title: newDesc,
      amount: newAmount,
      type: newType.toUpperCase() as 'EXPENSE' | 'INCOME',
      category: newCategory,
      envelope: newEnvelope.toUpperCase() as 'NEEDS' | 'WANTS' | 'SAVINGS',
      date: newDate
    };
  }

  public deleteTransaction(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM finance_transactions WHERE id = ?');
    stmt.run(id);
    this.recalculateEnvelopesFromTransactions();
    return true;
  }

  public resetFinances(options?: {
    initialBalance?: number;
    needsRatio?: number;
    wantsRatio?: number;
    savingsRatio?: number;
  }): { success: boolean; clearedCount: number; newBalances: { total: number; needs: number; wants: number; savings: number } } {
    this.setConfig('finances_initialized', 'true');
    const countStmt = this.db.prepare('SELECT COUNT(*) as cnt FROM finance_transactions');
    const countRow = countStmt.get() as { cnt: number };
    const clearedCount = countRow ? countRow.cnt : 0;

    this.db.exec('DELETE FROM finance_transactions;');

    const nowIso = new Date().toISOString();
    const initBal = options?.initialBalance !== undefined ? Math.max(0, options.initialBalance) : 0;
    const nRatio = options?.needsRatio !== undefined ? options.needsRatio : 0.5;
    const wRatio = options?.wantsRatio !== undefined ? options.wantsRatio : 0.3;
    const sRatio = options?.savingsRatio !== undefined ? options.savingsRatio : 0.2;

    const needs = Number((initBal * nRatio).toFixed(2));
    const wants = Number((initBal * wRatio).toFixed(2));
    const savings = Number((initBal * sRatio).toFixed(2));

    const updateEnv = this.db.prepare(`
      UPDATE finance_envelopes
      SET needs_balance = ?, wants_balance = ?, savings_balance = ?, monthly_income = ?, updated_at = ?
      WHERE id = 'primary'
    `);
    updateEnv.run(needs, wants, savings, initBal, nowIso);

    return {
      success: true,
      clearedCount,
      newBalances: {
        total: initBal,
        needs,
        wants,
        savings
      }
    };
  }

  public getFinanceEnvelopes() {
    const stmt = this.db.prepare('SELECT * FROM finance_envelopes WHERE id = ?');
    const row = stmt.get('primary') as SqliteFinanceEnvelopesRow | undefined;

    if (!row) {
      return {
        needsBalance: 0,
        wantsBalance: 0,
        savingsBalance: 0,
        needsTarget: 50,
        wantsTarget: 30,
        savingsTarget: 20,
        totalBalance: 0,
        monthlyIncome: 0
      };
    }

    const totalBalance = Number((row.needs_balance + row.wants_balance + row.savings_balance).toFixed(2));

    return {
      needsBalance: Number(row.needs_balance.toFixed(2)),
      wantsBalance: Number(row.wants_balance.toFixed(2)),
      savingsBalance: Number(row.savings_balance.toFixed(2)),
      needsTarget: row.needs_target_percent,
      wantsTarget: row.wants_target_percent,
      savingsTarget: row.savings_target_percent,
      totalBalance,
      monthlyIncome: Number(row.monthly_income.toFixed(2))
    };
  }

  public updateFinanceEnvelopes(data: Partial<{
    needsBalance: number;
    wantsBalance: number;
    savingsBalance: number;
    needsTarget: number;
    wantsTarget: number;
    savingsTarget: number;
    monthlyIncome: number;
  }>): void {
    const current = this.getFinanceEnvelopes();
    const nowIso = new Date().toISOString();

    const needsBalance = data.needsBalance !== undefined ? data.needsBalance : current.needsBalance;
    const wantsBalance = data.wantsBalance !== undefined ? data.wantsBalance : current.wantsBalance;
    const savingsBalance = data.savingsBalance !== undefined ? data.savingsBalance : current.savingsBalance;
    const needsTarget = data.needsTarget !== undefined ? data.needsTarget : current.needsTarget;
    const wantsTarget = data.wantsTarget !== undefined ? data.wantsTarget : current.wantsTarget;
    const savingsTarget = data.savingsTarget !== undefined ? data.savingsTarget : current.savingsTarget;
    const monthlyIncome = data.monthlyIncome !== undefined ? data.monthlyIncome : current.monthlyIncome;

    const stmt = this.db.prepare(`
      UPDATE finance_envelopes
      SET needs_balance = ?, wants_balance = ?, savings_balance = ?,
          needs_target_percent = ?, wants_target_percent = ?, savings_target_percent = ?,
          monthly_income = ?, updated_at = ?
      WHERE id = 'primary'
    `);
    stmt.run(needsBalance, wantsBalance, savingsBalance, needsTarget, wantsTarget, savingsTarget, monthlyIncome, nowIso);
  }

  private recalculateEnvelopesFromTransactions(): void {
    const stmt = this.db.prepare('SELECT type, amount, envelope FROM finance_transactions');
    const rows = stmt.all() as { type: string; amount: number; envelope: string }[];

    let needs = 0;
    let wants = 0;
    let savings = 0;
    let totalIncome = 0;

    for (const r of rows) {
      const amt = Number(r.amount);
      const isIncome = r.type === 'income';
      const env = (r.envelope || 'needs').toLowerCase();

      if (isIncome) {
        totalIncome += amt;
        needs += amt * 0.5;
        wants += amt * 0.3;
        savings += amt * 0.2;
      } else {
        if (env === 'wants') {
          wants -= amt;
        } else if (env === 'savings') {
          savings -= amt;
        } else {
          needs -= amt;
        }
      }
    }

    const nowIso = new Date().toISOString();
    const updateStmt = this.db.prepare(`
      UPDATE finance_envelopes
      SET needs_balance = ?, wants_balance = ?, savings_balance = ?, monthly_income = ?, updated_at = ?
      WHERE id = 'primary'
    `);
    updateStmt.run(needs, wants, savings, totalIncome, nowIso);
  }

  // --- SEKCJA: ZADANIA (TASKS) ---

  public getTasks(): TaskItem[] {
    const stmt = this.db.prepare('SELECT * FROM tasks ORDER BY created_at DESC');
    const rows = stmt.all() as SqliteTaskRow[];

    if (rows.length === 0) {
      const isInit = this.getConfig('tasks_initialized');
      if (!isInit) {
        this.setConfig('tasks_initialized', 'true');
        return this.seedInitialTasks();
      }
      return [];
    }

    return rows.map((r) => ({
      id: r.id,
      userId: 'operator-system-core',
      title: r.title,
      completed: Boolean(r.completed),
      priority: (r.priority as any) || 'NORMAL',
      category: r.category || 'Ogólne',
      createdAt: r.created_at,
      dueDate: r.due_date || undefined
    }));
  }

  private seedInitialTasks(): TaskItem[] {
    const nowIso = new Date().toISOString();
    const insert = this.db.prepare(`
      INSERT INTO tasks (id, title, completed, priority, category, due_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result: TaskItem[] = [];
    for (const t of SEED_TASKS) {
      insert.run(t.id, t.title, t.completed ? 1 : 0, t.priority || 'NORMAL', t.category || null, t.dueDate || null, nowIso, nowIso);
      result.push(t);
    }
    return result;
  }

  public saveTask(task: Partial<TaskItem> & { title: string }): TaskItem {
    const id = task.id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const existingStmt = this.db.prepare('SELECT id FROM tasks WHERE id = ?');
    const existing = existingStmt.get(id);

    if (existing) {
      const update = this.db.prepare(`
        UPDATE tasks SET title = ?, completed = ?, priority = ?, category = ?, due_date = ?, updated_at = ?
        WHERE id = ?
      `);
      update.run(
        task.title,
        task.completed ? 1 : 0,
        task.priority || 'NORMAL',
        task.category || null,
        task.dueDate || null,
        nowIso,
        id
      );
    } else {
      const insert = this.db.prepare(`
        INSERT INTO tasks (id, title, completed, priority, category, due_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insert.run(
        id,
        task.title,
        task.completed ? 1 : 0,
        task.priority || 'NORMAL',
        task.category || null,
        task.dueDate || null,
        nowIso,
        nowIso
      );
    }

    return {
      id,
      userId: task.userId || 'operator-system-core',
      title: task.title,
      completed: Boolean(task.completed),
      priority: task.priority || 'NORMAL',
      category: task.category || 'Ogólne',
      createdAt: task.createdAt || nowIso,
      dueDate: task.dueDate
    };
  }

  public updateTask(id: string, updates: Partial<TaskItem>): TaskItem | null {
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE id = ?');
    const existing = stmt.get(id) as SqliteTaskRow | undefined;
    if (!existing) return null;

    const newTitle = updates.title !== undefined ? updates.title : existing.title;
    const newCompleted = updates.completed !== undefined ? (updates.completed ? 1 : 0) : existing.completed;
    const newPriority = updates.priority !== undefined ? updates.priority : existing.priority;
    const newCategory = updates.category !== undefined ? updates.category : existing.category;
    const newDueDate = updates.dueDate !== undefined ? updates.dueDate : existing.due_date;
    const nowIso = new Date().toISOString();

    const updateStmt = this.db.prepare(`
      UPDATE tasks SET title = ?, completed = ?, priority = ?, category = ?, due_date = ?, updated_at = ?
      WHERE id = ?
    `);
    updateStmt.run(newTitle, newCompleted, newPriority, newCategory, newDueDate, nowIso, id);

    return {
      id,
      userId: 'operator-system-core',
      title: newTitle,
      completed: Boolean(newCompleted),
      priority: (newPriority as any) || 'NORMAL',
      category: newCategory || 'Ogólne',
      createdAt: existing.created_at,
      dueDate: newDueDate || undefined
    };
  }

  public deleteTask(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM tasks WHERE id = ?');
    stmt.run(id);
    return true;
  }

  // --- SEKCJA: SKRYPTY AUTOMATYZACJI ---

  public getAutomationScripts(): AutomationScriptItem[] {
    const stmt = this.db.prepare('SELECT * FROM automation_scripts ORDER BY created_at ASC');
    const rows = stmt.all() as SqliteAutomationScriptRow[];

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description || undefined,
      templateId: r.template_id || 'template_custom_script',
      triggerType: (r.trigger_type as any) || 'lesson_bell',
      cronExpression: r.cron_expression || undefined,
      code: r.code,
      enabled: Boolean(r.enabled),
      lastRunAt: r.last_run || undefined,
      lastStatus: (r.last_status as any) || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  }

  public saveAutomationScript(script: Partial<AutomationScriptItem> & { name: string; code: string }): AutomationScriptItem {
    const id = script.id || `script_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();
    const templateId = script.templateId || 'template_custom_script';

    const existingStmt = this.db.prepare('SELECT id FROM automation_scripts WHERE id = ?');
    const existing = existingStmt.get(id);

    if (existing) {
      const update = this.db.prepare(`
        UPDATE automation_scripts
        SET name = ?, description = ?, template_id = ?, trigger_type = ?, cron_expression = ?,
            code = ?, enabled = ?, last_run = ?, last_status = ?, updated_at = ?
        WHERE id = ?
      `);
      update.run(
        script.name,
        script.description || null,
        templateId,
        script.triggerType || 'lesson_bell',
        script.cronExpression || null,
        script.code,
        script.enabled !== undefined ? (script.enabled ? 1 : 0) : 1,
        script.lastRunAt || null,
        script.lastStatus || null,
        nowIso,
        id
      );
    } else {
      const insert = this.db.prepare(`
        INSERT INTO automation_scripts (
          id, name, description, template_id, trigger_type, cron_expression, code, enabled, last_run, last_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insert.run(
        id,
        script.name,
        script.description || null,
        templateId,
        script.triggerType || 'lesson_bell',
        script.cronExpression || null,
        script.code,
        script.enabled !== undefined ? (script.enabled ? 1 : 0) : 1,
        script.lastRunAt || null,
        script.lastStatus || null,
        nowIso,
        nowIso
      );
    }

    return {
      id,
      name: script.name,
      description: script.description,
      templateId,
      triggerType: script.triggerType || 'lesson_bell',
      cronExpression: script.cronExpression,
      code: script.code,
      enabled: script.enabled !== undefined ? Boolean(script.enabled) : true,
      lastRunAt: script.lastRunAt,
      lastStatus: script.lastStatus,
      createdAt: nowIso,
      updatedAt: nowIso
    };
  }

  public deleteAutomationScript(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM automation_scripts WHERE id = ?');
    stmt.run(id);
    return true;
  }

  // --- SEKCJA: WIECZORNY DIGEST AI (EVENING DIGEST) ---

  public saveEveningDigest(digest: {
    id?: string;
    date: string;
    summaryText: string;
    provider: string;
    model: string;
    sentToPushbullet: boolean;
    rawPayloadJson?: string;
  }): EveningDigestRecord {
    const id = digest.id || `digest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const nowIso = new Date().toISOString();

    const insert = this.db.prepare(`
      INSERT INTO evening_digests (
        id, date, summary_text, provider, model, sent_to_pushbullet, raw_payload_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      id,
      digest.date,
      digest.summaryText,
      digest.provider,
      digest.model,
      digest.sentToPushbullet ? 1 : 0,
      digest.rawPayloadJson || null,
      nowIso
    );

    return {
      id,
      date: digest.date,
      summaryText: digest.summaryText,
      provider: digest.provider,
      model: digest.model,
      sentToPushbullet: digest.sentToPushbullet,
      rawPayloadJson: digest.rawPayloadJson,
      createdAt: nowIso
    };
  }

  public getLatestEveningDigest(): EveningDigestRecord | null {
    const stmt = this.db.prepare('SELECT * FROM evening_digests ORDER BY created_at DESC LIMIT 1');
    const row = stmt.get() as SqliteEveningDigestRow | undefined;
    if (!row) return null;

    return {
      id: row.id,
      date: row.date,
      summaryText: row.summary_text,
      provider: row.provider,
      model: row.model,
      sentToPushbullet: Boolean(row.sent_to_pushbullet),
      rawPayloadJson: row.raw_payload_json || undefined,
      createdAt: row.created_at
    };
  }

  public getEveningDigests(limit = 10): EveningDigestRecord[] {
    const stmt = this.db.prepare('SELECT * FROM evening_digests ORDER BY created_at DESC LIMIT ?');
    const rows = stmt.all(limit) as SqliteEveningDigestRow[];

    return rows.map((row) => ({
      id: row.id,
      date: row.date,
      summaryText: row.summary_text,
      provider: row.provider,
      model: row.model,
      sentToPushbullet: Boolean(row.sent_to_pushbullet),
      rawPayloadJson: row.raw_payload_json || undefined,
      createdAt: row.created_at
    }));
  }

  public close(): void {
    if (this.db) {
      this.db.close();
    }
  }
}

export const sqliteStore = new SqliteStore();
