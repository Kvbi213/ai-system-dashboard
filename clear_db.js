import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'data/tasks.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Connection error:', err);
    process.exit(1);
  }
});

db.serialize(() => {
  db.run('DELETE FROM tasks');
  db.run('DELETE FROM system_logs');
  db.run('DELETE FROM user_memory');
  db.run('DELETE FROM calendar_events');
  db.run('DELETE FROM phone_notifications');
});

db.close((err) => {
  if (err) {
    console.error('Close error:', err);
    process.exit(1);
  }
  console.log('Database cleared successfully.');
});
