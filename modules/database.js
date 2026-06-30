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

// Inicjalizacja schematu bazy danych
db.serialize(() => {
  // Tabela zadań (To-Do)
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'pending', -- pending, completed
      target_date TEXT,
      target_time TEXT,
      priority TEXT DEFAULT 'MEDIUM',
      category TEXT DEFAULT 'jednorazowe',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bezpieczna migracja: kolumna 'category'
  db.run(`ALTER TABLE tasks ADD COLUMN category TEXT DEFAULT 'jednorazowe'`, (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.error("[!] Błąd migracji DB:", err.message);
    }
  });

  // Bezpieczna migracja: kolumna 'recurrence_rule' dla schedulera
  db.run(`ALTER TABLE tasks ADD COLUMN recurrence_rule TEXT DEFAULT NULL`, (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.error("[!] Błąd migracji DB:", err.message);
    }
  });

  // Tabela logów systemowych / aktualności (od agenta)
  db.run(`
    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- np. 'weather', 'news', 'agent_summary'
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela pamięci długoterminowej (Baza wiedzy o operatorze)
  db.run(`
    CREATE TABLE IF NOT EXISTS user_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fact TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela Kalendarza
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

  // Tabela Powiadomień z Telefonu (Webhook)
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
});

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

export default db;
