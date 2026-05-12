const { getDb } = require('../config/db');

function getProfile(req, res) {
  try {
    const db = getDb();
    const userId = req.params.userId || req.user.id;

    const user = db.get(`
      SELECT u.id, u.full_name, u.email, u.academic_status, u.university_id, u.career_id,
             u.bio, u.profile_pic, u.cover_pic, u.interests, u.graduation_year, u.created_at,
             un.name as university_name, un.acronym as university_acronym, un.city as university_city,
             c.name as career_name, c.faculty
      FROM users u
      LEFT JOIN universities un ON u.university_id = un.id
      LEFT JOIN careers c ON u.career_id = c.id
      WHERE u.id = ?
    `, userId);

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const posts = db.all(`
      SELECT p.*, 
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
             (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count,
             EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) as liked_by_me
      FROM posts p
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `, req.user.id, userId);

    const countRow = db.get(`
      SELECT COUNT(*) as count FROM connections 
      WHERE (requester_id = ? OR receiver_id = ?) AND status = 'accepted'
    `, userId, userId);
    const connectionCount = countRow ? countRow.count : 0;

    let connectionStatus = null;
    if (parseInt(userId) !== req.user.id) {
      const conn = db.get(`
        SELECT * FROM connections 
        WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)
      `, req.user.id, userId, userId, req.user.id);
      connectionStatus = conn ? conn.status : null;
    }

    res.json({ user, posts, connectionCount, connectionStatus });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Error al cargar perfil.' });
  }
}

function updateProfile(req, res) {
  try {
    const { bio, interests, profile_pic, cover_pic } = req.body;
    const db = getDb();

    db.run(`
      UPDATE users SET bio = COALESCE(?, bio), interests = COALESCE(?, interests),
      profile_pic = COALESCE(?, profile_pic), cover_pic = COALESCE(?, cover_pic)
      WHERE id = ?
    `, bio, interests, profile_pic, cover_pic, req.user.id);

    const user = db.get(`
      SELECT id, full_name, email, academic_status, bio, profile_pic, cover_pic, interests
      FROM users WHERE id = ?
    `, req.user.id);

    res.json({ user, message: 'Perfil actualizado.' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Error al actualizar perfil.' });
  }
}

function sendConnectionRequest(req, res) {
  try {
    const db = getDb();
    const receiverId = parseInt(req.params.userId);

    if (receiverId === req.user.id) {
      return res.status(400).json({ error: 'No puedes conectarte contigo mismo.' });
    }

    const existing = db.get(`
      SELECT * FROM connections 
      WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)
    `, req.user.id, receiverId, receiverId, req.user.id);

    if (existing) {
      return res.status(409).json({ error: 'Ya existe una solicitud de conexión.', status: existing.status });
    }

    db.run('INSERT INTO connections (requester_id, receiver_id) VALUES (?, ?)', req.user.id, receiverId);

    res.status(201).json({ message: 'Solicitud de conexión enviada.' });
  } catch (err) {
    console.error('Connection request error:', err);
    res.status(500).json({ error: 'Error al enviar solicitud.' });
  }
}

function respondToConnection(req, res) {
  try {
    const { action } = req.body;
    const db = getDb();

    const conn = db.get(`
      SELECT * FROM connections WHERE id = ? AND receiver_id = ? AND status = 'pending'
    `, req.params.connectionId, req.user.id);

    if (!conn) return res.status(404).json({ error: 'Solicitud no encontrada.' });

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    db.run('UPDATE connections SET status = ? WHERE id = ?', newStatus, conn.id);

    res.json({ message: action === 'accept' ? 'Conexión aceptada.' : 'Solicitud rechazada.' });
  } catch (err) {
    console.error('Respond connection error:', err);
    res.status(500).json({ error: 'Error al responder solicitud.' });
  }
}

function getConnections(req, res) {
  try {
    const db = getDb();
    const connections = db.all(`
      SELECT u.id, u.full_name, u.profile_pic, u.academic_status, u.bio,
             un.name as university_name, un.acronym as university_acronym
      FROM connections c
      JOIN users u ON (CASE WHEN c.requester_id = ? THEN c.receiver_id ELSE c.requester_id END) = u.id
      LEFT JOIN universities un ON u.university_id = un.id
      WHERE (c.requester_id = ? OR c.receiver_id = ?) AND c.status = 'accepted'
    `, req.user.id, req.user.id, req.user.id);

    res.json({ connections });
  } catch (err) {
    console.error('Get connections error:', err);
    res.status(500).json({ error: 'Error al cargar conexiones.' });
  }
}

function getSuggestions(req, res) {
  try {
    const db = getDb();
    const user = db.get('SELECT * FROM users WHERE id = ?', req.user.id);

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    // For high school students: suggest universities based on interests
    if (user.academic_status === 'high_school' && user.interests) {
      const interestTerms = user.interests.split(',').map(i => i.trim().toLowerCase());

      let careers = db.all(`
        SELECT c.*, u.name as university_name, u.acronym as university_acronym,
               u.country, u.city, u.type as university_type
        FROM careers c
        JOIN universities u ON c.university_id = u.id
      `);

      const scored = careers.map(career => {
        let score = 0;
        const careerText = `${career.name} ${career.faculty} ${career.curriculum_summary || ''}`.toLowerCase();
        for (const term of interestTerms) {
          if (careerText.includes(term)) score += 10;
        }
        return { ...career, relevanceScore: score };
      }).filter(c => c.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 10);

      return res.json({ suggestions: scored, type: 'career_recommendations' });
    }

    // For university students: suggest people from same university or career
    const people = db.all(`
      SELECT u.id, u.full_name, u.profile_pic, u.bio, u.academic_status,
             un.name as university_name, un.acronym as university_acronym
      FROM users u
      LEFT JOIN universities un ON u.university_id = un.id
      WHERE u.id != ? 
        AND u.id NOT IN (
          SELECT CASE WHEN requester_id = ? THEN receiver_id ELSE requester_id END
          FROM connections WHERE requester_id = ? OR receiver_id = ?
        )
      ORDER BY CASE WHEN u.university_id = ? THEN 0 ELSE 1 END, RANDOM()
      LIMIT 10
    `, req.user.id, req.user.id, req.user.id, req.user.id, user.university_id);

    res.json({ suggestions: people, type: 'people_suggestions' });
  } catch (err) {
    console.error('Suggestions error:', err);
    res.status(500).json({ error: 'Error al cargar sugerencias.' });
  }
}

module.exports = { getProfile, updateProfile, sendConnectionRequest, respondToConnection, getConnections, getSuggestions };
