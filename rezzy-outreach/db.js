const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

const dbPath = path.join(app.getPath('userData'), 'rezzy-outreach.db');
const db = new Database(dbPath);

function initDb() {
  // 1. Create the tables with ALL required columns from the start
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name TEXT, 
        area TEXT, 
        phone TEXT UNIQUE, 
        status TEXT DEFAULT 'new', 
        notes TEXT DEFAULT '',
        sent_at DATETIME
    );
    CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        language TEXT, 
        kind TEXT, 
        body TEXT, 
        UNIQUE(language, kind)
    );
    CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        lead_id INTEGER, 
        action TEXT, 
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. MIGRATION CHECK: Automatically add columns if they are missing from an old DB
  const tables = {
      leads: ['sent_at'],
      activity_log: ['lead_id']
  };

  for (const [table, columns] of Object.entries(tables)) {
      columns.forEach(column => {
          try {
              db.prepare(`SELECT ${column} FROM ${table} LIMIT 1`).get();
          } catch (e) {
              console.log(`Adding missing column ${column} to ${table}...`);
              db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${column === 'lead_id' ? 'INTEGER' : 'DATETIME'};`);
          }
      });
  }

  // 3. Seed initial template
  const insert = db.prepare('INSERT OR IGNORE INTO templates (language, kind, body) VALUES (?, ?, ?)');
  insert.run('en', 'first', 'Hi {shop_name}, I saw your salon in {area} and wanted to reach out from Rezzy!');
}

module.exports = { db, initDb };