const { getDb } = require('../config/db');

function getAllUniversities(req, res) {
  try {
    const { country, type, search } = req.query;
    const db = getDb();

    let sql = `SELECT * FROM universities WHERE 1=1`;
    const params = [];

    if (country) {
      sql += ` AND country = ?`;
      params.push(country);
    }
    if (type) {
      sql += ` AND type = ?`;
      params.push(type);
    }
    if (search) {
      sql += ` AND (name LIKE ? OR acronym LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY country, name`;
    const universities = db.all(sql, ...params);

    res.json({ universities });
  } catch (err) {
    console.error('Get universities error:', err);
    res.status(500).json({ error: 'Error al cargar universidades.' });
  }
}

function getUniversityById(req, res) {
  try {
    const db = getDb();
    const university = db.get('SELECT * FROM universities WHERE id = ?', req.params.id);
    if (!university) return res.status(404).json({ error: 'Universidad no encontrada.' });

    const careers = db.all('SELECT * FROM careers WHERE university_id = ? ORDER BY faculty, name', req.params.id);
    const studentCountRow = db.get('SELECT COUNT(*) as count FROM users WHERE university_id = ?', req.params.id);

    res.json({ university, careers, studentCount: studentCountRow ? studentCountRow.count : 0 });
  } catch (err) {
    console.error('Get university error:', err);
    res.status(500).json({ error: 'Error al cargar universidad.' });
  }
}

module.exports = { getAllUniversities, getUniversityById };
