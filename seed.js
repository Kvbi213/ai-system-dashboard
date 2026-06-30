import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, './data/tasks.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[!] ERROR: Nie można połączyć z bazą danych:', err.message);
    process.exit(1);
  }
});

db.serialize(() => {
  // Usuwanie starych zadań
  db.run('DELETE FROM tasks', (err) => {
    if (err) console.error('Błąd usuwania zadań:', err);
    else console.log('Wyczyszczono tabelę tasks.');
  });

  // Dodawanie nowych, przykładowych zadań
  const stmt = db.prepare('INSERT INTO tasks (title, status, priority, target_date, target_time) VALUES (?, ?, ?, ?, ?)');
  
  const tasks = [
    ['Zaktualizować zaporę sieciową systemu AI', 'pending', 'HIGH', '2026-06-16', '10:00'],
    ['Wypić podwójne espresso', 'completed', 'MEDIUM', '2026-06-15', '08:00'],
    ['Przeanalizować logi z Open-Meteo', 'pending', 'LOW', '2026-06-17', '18:30'],
    ['Trening kalisteniki', 'pending', 'MEDIUM', '2026-06-15', '17:00'],
    ['Zrobić Code Review nowych funkcji frontendu', 'pending', 'HIGH', '2026-06-15', '20:00']
  ];

  tasks.forEach(task => {
    stmt.run(task, (err) => {
      if (err) console.error('Błąd wstawiania:', err);
      else console.log('Dodano zadanie:', task[0]);
    });
  });

  stmt.finalize(() => {
    db.close();
  });
});
