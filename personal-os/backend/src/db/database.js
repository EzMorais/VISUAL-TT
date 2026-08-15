const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config');

let db;

function getDB() {
  return db;
}

function initDB() {
  const dbDir = path.dirname(path.resolve(config.DB_PATH));
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

  db = new Database(path.resolve(config.DB_PATH));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'checking',
      balance REAL DEFAULT 0,
      color TEXT DEFAULT '#00e676',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER REFERENCES accounts(id),
      type TEXT NOT NULL CHECK(type IN ('income','expense','transfer')),
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      category TEXT DEFAULT 'outros',
      date TEXT DEFAULT (date('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      limit_amount REAL NOT NULL,
      month TEXT NOT NULL,
      UNIQUE(category, month)
    );

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      deadline TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'pending',
      due_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      remind_at TEXT NOT NULL,
      sent INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS briefings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      session_id TEXT DEFAULT 'web',
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Durable facts about the user (preferences, routine, life context) that
    -- get folded into every Claude conversation — chat, terminal, voice, briefing.
    CREATE TABLE IF NOT EXISTS memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fact TEXT NOT NULL,
      category TEXT DEFAULT 'geral',
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Errors captured from the frontend or backend, with Claude's diagnosis
    -- attached — the app's self-diagnostic log, surfaced in the Terminal tab.
    CREATE TABLE IF NOT EXISTS error_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      message TEXT NOT NULL,
      stack TEXT,
      context TEXT,
      diagnosis TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Every Claude API call recorded here — powers the "Uso" tab so you can
    -- see how much you've used today/this month, and where it went.
    CREATE TABLE IF NOT EXISTS api_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feature TEXT NOT NULL,
      model TEXT NOT NULL,
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  console.log('✅ Banco de dados inicializado');
}

module.exports = { initDB, getDB };
