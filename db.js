'use strict';

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'mentacut.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS urls (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    code      TEXT    NOT NULL UNIQUE,
    original  TEXT    NOT NULL UNIQUE,
    clicks    INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT (datetime('now'))
  );
`);

const stmts = {
  insert: db.prepare('INSERT OR IGNORE INTO urls (code, original) VALUES (?, ?)'),
  findByCode: db.prepare('SELECT * FROM urls WHERE code = ?'),
  findByOriginal: db.prepare('SELECT * FROM urls WHERE original = ? LIMIT 1'),
  incrementClicks: db.prepare('UPDATE urls SET clicks = clicks + 1 WHERE code = ?'),
  stats: db.prepare('SELECT COUNT(*) as total_urls, SUM(clicks) as total_clicks FROM urls'),
};

module.exports = { db, stmts };
