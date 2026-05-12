const { getDb } = require('../config/db');

function initializeDatabase() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS universities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      acronym TEXT,
      country TEXT NOT NULL DEFAULT 'Bolivia',
      city TEXT,
      type TEXT CHECK(type IN ('publica', 'privada')) NOT NULL,
      description TEXT,
      website TEXT,
      logo_url TEXT,
      cover_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS careers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      university_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      faculty TEXT NOT NULL,
      duration_years INTEGER,
      degree_title TEXT,
      curriculum_summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (university_id) REFERENCES universities(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      ci_hash TEXT UNIQUE NOT NULL,
      ci_country TEXT NOT NULL DEFAULT 'Bolivia',
      academic_status TEXT CHECK(academic_status IN ('high_school', 'university')) NOT NULL,
      university_id INTEGER,
      career_id INTEGER,
      interests TEXT,
      bio TEXT DEFAULT '',
      profile_pic TEXT DEFAULT '',
      cover_pic TEXT DEFAULT '',
      graduation_year INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (university_id) REFERENCES universities(id),
      FOREIGN KEY (career_id) REFERENCES careers(id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      likes_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requester_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      status TEXT CHECK(status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (requester_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id),
      UNIQUE(requester_id, receiver_id)
    );

    CREATE TABLE IF NOT EXISTS post_likes (
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, post_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vocational_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      category TEXT CHECK(category IN ('R','I','A','S','E','C')) NOT NULL,
      weight REAL DEFAULT 1.0,
      order_num INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS career_riasec (
      career_id INTEGER PRIMARY KEY,
      r REAL DEFAULT 0, i REAL DEFAULT 0, a REAL DEFAULT 0,
      s REAL DEFAULT 0, e REAL DEFAULT 0, c REAL DEFAULT 0,
      FOREIGN KEY (career_id) REFERENCES careers(id)
    );

    CREATE TABLE IF NOT EXISTS vocational_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      r_score REAL DEFAULT 0, i_score REAL DEFAULT 0, a_score REAL DEFAULT 0,
      s_score REAL DEFAULT 0, e_score REAL DEFAULT 0, c_score REAL DEFAULT 0,
      profile_label TEXT,
      recommended_careers TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  console.log('✅ Database tables initialized.');
}

module.exports = { initializeDatabase };
