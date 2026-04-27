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
        sent_at DATETIME,
        created_at DATETIME DEFAULT (datetime('now', 'localtime')),
        address TEXT,
        map_url TEXT
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
  const migrations = {
      leads: {
          sent_at: 'DATETIME',
          created_at: 'DATETIME',
          address: 'TEXT',
          map_url: 'TEXT',
      },
      activity_log: {
          lead_id: 'INTEGER',
      },
  };

  for (const [table, columns] of Object.entries(migrations)) {
      for (const [column, type] of Object.entries(columns)) {
          try {
              db.prepare(`SELECT ${column} FROM ${table} LIMIT 1`).get();
          } catch (e) {
              console.log(`Adding missing column ${column} to ${table}...`);
              db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type};`);
          }
      }
  }

  // Backfill created_at for any rows that pre-date the migration (idempotent)
  db.exec(`UPDATE leads SET created_at = datetime('now', 'localtime') WHERE created_at IS NULL`);

  // One-time cleanup: strip URLs from any names that contain them (legacy CSV imports)
  const dirty = db.prepare("SELECT id, name FROM leads WHERE name LIKE '%http%'").all();
  if (dirty.length) {
      const update = db.prepare("UPDATE leads SET name = ? WHERE id = ?");
      const cleanTx = db.transaction((rows) => {
          for (const row of rows) {
              const cleaned = String(row.name)
                  .replace(/https?:\/\/\S+/gi, '')
                  .replace(/\s+/g, ' ')
                  .trim();
              if (cleaned && cleaned !== row.name) update.run(cleaned, row.id);
          }
      });
      cleanTx(dirty);
      console.log(`Cleaned URLs from ${dirty.length} lead name(s).`);
  }

  // 3. Seed initial template
  const insert = db.prepare('INSERT OR IGNORE INTO templates (language, kind, body) VALUES (?, ?, ?)');
  insert.run('en', 'first', 'Hi {shop_name}, I saw your salon in {area} and wanted to reach out from Rezzy!');
}

module.exports = { db, initDb };