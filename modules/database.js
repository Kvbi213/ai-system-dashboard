import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../data/tasks.sqlite');

import fs from 'fs';
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[!] ERROR: Nie można połączyć z bazą danych:', err.message);
  } else {
    console.log('[+] SUCCESS: Połączono z bazą danych SQLite.');
  }
});

export const initDB = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      try {
        db.run(`
          CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            target_date TEXT,
            target_time TEXT,
            priority TEXT DEFAULT 'MEDIUM',
            category TEXT DEFAULT 'jednorazowe',
            recurrence_rule TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        db.run(`ALTER TABLE tasks ADD COLUMN category TEXT DEFAULT 'jednorazowe'`, (err) => {});
        db.run(`ALTER TABLE tasks ADD COLUMN recurrence_rule TEXT DEFAULT NULL`, (err) => {});

        db.run(`
          CREATE TABLE IF NOT EXISTS system_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS user_memory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fact TEXT NOT NULL,
            category TEXT DEFAULT 'general',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS calendar_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            event_date TEXT NOT NULL,
            event_time TEXT,
            description TEXT,
            recurrence_rule TEXT,
            reminder_minutes INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS phone_notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            app_name TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT,
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS finances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'PLN',
            category TEXT,
            bucket TEXT,
            description TEXT,
            transaction_date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        db.run("ALTER TABLE finances ADD COLUMN bucket TEXT", (err) => {});

        db.run(`
          CREATE TABLE IF NOT EXISTS finance_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            monthly_income REAL DEFAULT 0,
            needs_percent REAL DEFAULT 50,
            wants_percent REAL DEFAULT 30,
            savings_percent REAL DEFAULT 20,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS workouts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            type TEXT DEFAULT 'Inne',
            description TEXT,
            date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS timetable (
            id TEXT PRIMARY KEY,
            day TEXT NOT NULL,
            subject TEXT NOT NULL,
            time_start TEXT NOT NULL,
            time_end TEXT NOT NULL,
            room TEXT,
            teacher TEXT,
            type TEXT DEFAULT 'Wykład',
            color TEXT DEFAULT 'indigo',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS agent_jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            goal TEXT NOT NULL,
            status TEXT DEFAULT 'queued',
            priority TEXT DEFAULT 'MEDIUM',
            current_step TEXT,
            progress_percent INTEGER DEFAULT 0,
            iteration_count INTEGER DEFAULT 0,
            max_iterations INTEGER DEFAULT 10,
            milestones_notified INTEGER DEFAULT 0,
            result_summary TEXT,
            execution_log TEXT,
            notify_mode TEXT DEFAULT 'milestones',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS librus_cache (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            data TEXT NOT NULL,
            lucky_number INTEGER,
            last_sync DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'ok',
            error_message TEXT
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS librus_calendar_cache (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            data TEXT NOT NULL,
            last_sync DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'ok',
            error_message TEXT
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS librus_timetable_cache (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            data TEXT NOT NULL,
            last_sync DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'ok',
            error_message TEXT
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS gcp_budget_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            budget_display_name TEXT,
            cost_amount REAL,
            budget_amount REAL,
            currency TEXT DEFAULT 'PLN',
            alert_threshold REAL,
            raw_payload TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Tabela węzłów drzewa podmiotów (Entities & Intelligence OSINT Hub)
        db.run(`
          CREATE TABLE IF NOT EXISTS entities (
            id TEXT PRIMARY KEY,
            parent_id TEXT NULL,
            type TEXT NOT NULL,
            name TEXT NOT NULL,
            tree_path TEXT NOT NULL,
            attributes_json TEXT DEFAULT '{}',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        db.run(`CREATE INDEX IF NOT EXISTS idx_entities_parent ON entities(parent_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_entities_tree_path ON entities(tree_path)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(name)`);

        // Tabela krawędzi relacji sieciowych między podmiotami
        db.run(`
          CREATE TABLE IF NOT EXISTS entity_relations (
            id TEXT PRIMARY KEY,
            source_id TEXT NOT NULL,
            target_id TEXT NOT NULL,
            relation_type TEXT NOT NULL,
            metadata_json TEXT DEFAULT '{}',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        db.run(`CREATE INDEX IF NOT EXISTS idx_entity_relations_source ON entity_relations(source_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_entity_relations_target ON entity_relations(target_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_entity_relations_type ON entity_relations(relation_type)`, (err) => {
          if (err) {
            console.error('[!] Błąd inicjalizacji struktur DB:', err);
            return reject(err);
          }
          console.log('[+] Zapewniono istnienie struktur bazy danych.');
          resolve();
        });
      } catch (err) {
        console.error('[!] Błąd inicjalizacji DB:', err);
        reject(err);
      }
    });
  });
};

// Helpery do operacji na bazie
export const executeQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const executeRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const getDB = () => db;

export default db;
