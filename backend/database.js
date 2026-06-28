const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'tracker.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_name TEXT NOT NULL,
    project_name TEXT NOT NULL,
    aws_services TEXT DEFAULT '',
    stage INTEGER NOT NULL DEFAULT 20,
    estimated_amount REAL DEFAULT 0,
    currency TEXT DEFAULT 'TWD',
    next_action TEXT DEFAULT '',
    deadline TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS daily_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_date TEXT NOT NULL UNIQUE,
    content TEXT DEFAULT '',
    key_items TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reminder_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sent_at TEXT DEFAULT (datetime('now','localtime')),
    status TEXT DEFAULT 'pending',
    content TEXT DEFAULT ''
  );
`);

const defaultSettings = [
  ['email_enabled', 'false'],
  ['email_smtp_host', ''],
  ['email_smtp_port', '587'],
  ['email_smtp_user', ''],
  ['email_smtp_pass', ''],
  ['email_to', ''],
  ['reminder_time', '09:00'],
  ['timezone', 'Asia/Taipei'],
];

const upsert = db.prepare(
  'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
);
defaultSettings.forEach(([k, v]) => upsert.run(k, v));

module.exports = db;
