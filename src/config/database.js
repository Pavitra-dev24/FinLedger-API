const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs   = require('fs');

const DB_PATH = process.env.DB_PATH || './data/finledger.db';

let db;

if (DB_PATH === ':memory:') {
  db = new DatabaseSync(':memory:');
} else {
  const dbDir = path.dirname(path.resolve(DB_PATH));
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  db = new DatabaseSync(path.resolve(DB_PATH));
}

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    password    TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'viewer'
                     CHECK(role IN ('viewer','analyst','admin')),
    status      TEXT NOT NULL DEFAULT 'active'
                     CHECK(status IN ('active','inactive')),
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id          TEXT PRIMARY KEY,
    amount      REAL NOT NULL CHECK(amount > 0),
    type        TEXT NOT NULL CHECK(type IN ('income','expense')),
    category    TEXT NOT NULL,
    date        TEXT NOT NULL,
    notes       TEXT,
    created_by  TEXT NOT NULL REFERENCES users(id),
    is_deleted  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_date       ON transactions(date);
  CREATE INDEX IF NOT EXISTS idx_transactions_type       ON transactions(type);
  CREATE INDEX IF NOT EXISTS idx_transactions_category   ON transactions(category);
  CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON transactions(created_by);
  CREATE INDEX IF NOT EXISTS idx_users_email             ON users(email);
`);

module.exports = db;
