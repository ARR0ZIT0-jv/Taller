const bcrypt = require('bcryptjs');
const { getDb } = require('../config/db');
const { validateCI, normalizeCI } = require('../utils/ciValidator');
const { generateToken } = require('../utils/jwt');

async function register(req, res) {
  try {
    const { full_name, email, password, ci, ci_country, academic_status, university_id, career_id, interests, graduation_year } = req.body;

    if (!full_name || !email || !password || !ci || !academic_status) {
      return res.status(400).json({ error: 'Todos los campos obligatorios deben ser completados.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const ciValidation = validateCI(ci, ci_country || 'Bolivia');
    if (!ciValidation.valid) {
      return res.status(400).json({ error: ciValidation.error });
    }

    if (academic_status === 'university' && !university_id) {
      return res.status(400).json({ error: 'Los estudiantes universitarios deben seleccionar su universidad.' });
    }

    const db = getDb();

    const existingEmail = db.get('SELECT id FROM users WHERE email = ?', email);
    if (existingEmail) {
      return res.status(409).json({ error: 'Este correo electrónico ya está registrado.' });
    }

    const normalizedCI = normalizeCI(ci);
    const ciHash = bcrypt.hashSync(normalizedCI, 10);
    const passwordHash = bcrypt.hashSync(password, 10);

    const result = db.run(
      `INSERT INTO users (full_name, email, password_hash, ci_hash, ci_country, academic_status, university_id, career_id, interests, graduation_year)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      full_name, email, passwordHash, ciHash,
      ci_country || 'Bolivia', academic_status,
      university_id || null, career_id || null,
      interests || '', graduation_year || null
    );

    const user = db.get('SELECT id, full_name, email, academic_status, university_id, profile_pic FROM users WHERE id = ?', result.lastInsertRowid);
    const token = generateToken(user);

    res.status(201).json({ message: 'Registro exitoso. ¡Bienvenido a UniNetwork!', token, user });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Esta Cédula de Identidad ya está registrada.' });
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
    }

    const db = getDb();
    const user = db.get(`
      SELECT u.*, un.name as university_name, un.acronym as university_acronym
      FROM users u
      LEFT JOIN universities un ON u.university_id = un.id
      WHERE u.email = ?
    `, email);

    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    const token = generateToken(user);
    const { password_hash, ci_hash, ...safeUser } = user;

    res.json({ message: 'Inicio de sesión exitoso.', token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

function getMe(req, res) {
  const db = getDb();
  const user = db.get(`
    SELECT u.id, u.full_name, u.email, u.academic_status, u.university_id, u.career_id,
           u.bio, u.profile_pic, u.cover_pic, u.interests, u.graduation_year, u.created_at,
           un.name as university_name, un.acronym as university_acronym,
           c.name as career_name
    FROM users u
    LEFT JOIN universities un ON u.university_id = un.id
    LEFT JOIN careers c ON u.career_id = c.id
    WHERE u.id = ?
  `, req.user.id);

  if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
  res.json({ user });
}

module.exports = { register, login, getMe };
