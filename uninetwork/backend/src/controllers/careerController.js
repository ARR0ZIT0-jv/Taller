const { getDb } = require('../config/db');

function normalizeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function searchCareers(req, res) {
  try {
    const { query, faculty, country, type, page = 1, limit = 20 } = req.query;
    const db = getDb();

    // Fetch ALL careers with university info
    const allCareers = db.all(`
      SELECT c.id, c.name, c.faculty, c.duration_years, c.degree_title, c.curriculum_summary,
             u.id as university_id, u.name as university_name, u.acronym as university_acronym,
             u.country, u.city, u.type as university_type, u.website
      FROM careers c
      JOIN universities u ON c.university_id = u.id
      ORDER BY c.name ASC
    `);

    // Filter in JS for accent-insensitive search
    let filtered = allCareers;

    if (query) {
      const q = normalizeAccents(query);
      filtered = filtered.filter(c =>
        normalizeAccents(c.name).includes(q) ||
        normalizeAccents(c.faculty).includes(q) ||
        normalizeAccents(c.curriculum_summary || '').includes(q)
      );
    }

    if (faculty) {
      const f = normalizeAccents(faculty);
      filtered = filtered.filter(c => normalizeAccents(c.faculty).includes(f));
    }

    if (country) {
      filtered = filtered.filter(c => c.country === country);
    }

    if (type) {
      filtered = filtered.filter(c => c.university_type === type);
    }

    // Pagination
    const total = filtered.length;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const results = filtered.slice(offset, offset + parseInt(limit));

    res.json({
      results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Search careers error:', err);
    res.status(500).json({ error: 'Error en la búsqueda de carreras.' });
  }
}

function getCareerById(req, res) {
  try {
    const db = getDb();
    const career = db.get(`
      SELECT c.*, u.name as university_name, u.acronym as university_acronym,
             u.country, u.city, u.type as university_type, u.website, u.description as university_description
      FROM careers c
      JOIN universities u ON c.university_id = u.id
      WHERE c.id = ?
    `, req.params.id);

    if (!career) return res.status(404).json({ error: 'Carrera no encontrada.' });

    res.json({ career });
  } catch (err) {
    console.error('Get career error:', err);
    res.status(500).json({ error: 'Error al cargar carrera.' });
  }
}

function getFaculties(req, res) {
  try {
    const db = getDb();
    const faculties = db.all('SELECT DISTINCT faculty FROM careers ORDER BY faculty');
    res.json({ faculties: faculties.map(f => f.faculty) });
  } catch (err) {
    console.error('Get faculties error:', err);
    res.status(500).json({ error: 'Error al cargar facultades.' });
  }
}

function getCountries(req, res) {
  try {
    const db = getDb();
    const countries = db.all('SELECT DISTINCT country FROM universities ORDER BY country');
    res.json({ countries: countries.map(c => c.country) });
  } catch (err) {
    console.error('Get countries error:', err);
    res.status(500).json({ error: 'Error al cargar países.' });
  }
}

module.exports = { searchCareers, getCareerById, getFaculties, getCountries };
