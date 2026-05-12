const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'uninetwork.db');

let db = null;

/**
 * Wrapper around sql.js to provide a simpler API similar to better-sqlite3
 */
class DbWrapper {
  constructor(sqlDb) {
    this._db = sqlDb;
  }

  run(sql, ...params) {
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    this._db.run(sql, flatParams);
    // sql.js doesn't provide lastInsertRowid from run(), so we query it
    const result = this._db.exec('SELECT last_insert_rowid() as id');
    const lastId = result.length > 0 ? result[0].values[0][0] : 0;
    return { lastInsertRowid: lastId, changes: this._db.getRowsModified() };
  }

  get(sql, ...params) {
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const stmt = this._db.prepare(sql);
    stmt.bind(flatParams);
    if (stmt.step()) {
      const cols = stmt.getColumnNames();
      const vals = stmt.get();
      stmt.free();
      const row = {};
      cols.forEach((c, i) => { row[c] = vals[i]; });
      return row;
    }
    stmt.free();
    return undefined;
  }

  all(sql, ...params) {
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const stmt = this._db.prepare(sql);
    stmt.bind(flatParams);
    const rows = [];
    let cols = null;
    while (stmt.step()) {
      if (!cols) cols = stmt.getColumnNames();
      const vals = stmt.get();
      const row = {};
      cols.forEach((c, i) => { row[c] = vals[i]; });
      rows.push(row);
    }
    stmt.free();
    return rows;
  }

  exec(sql) {
    this._db.run(sql);
  }

  save() {
    const data = this._db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

async function initDb() {
  const SQL = await initSqlJs();

  let rawDb;
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    rawDb = new SQL.Database(buffer);
  } else {
    rawDb = new SQL.Database();
  }

  db = new DbWrapper(rawDb);
  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

function saveDb() {
  if (db) db.save();
}

// Auto-save every 5 seconds
setInterval(() => saveDb(), 5000);
process.on('exit', saveDb);
process.on('SIGINT', () => { saveDb(); process.exit(); });

module.exports = { initDb, getDb, saveDb };
