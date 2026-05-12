const { getDb } = require('../config/db');

function getFeed(req, res) {
  try {
    const db = getDb();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const posts = db.all(`
      SELECT p.*, 
             u.full_name as author_name, u.profile_pic as author_pic, u.academic_status,
             un.name as university_name, un.acronym as university_acronym,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
             (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count,
             EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) as liked_by_me
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN universities un ON u.university_id = un.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, req.user.id, limit, offset);

    const totalRow = db.get('SELECT COUNT(*) as total FROM posts');
    const total = totalRow ? totalRow.total : 0;

    res.json({ posts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Feed error:', err);
    res.status(500).json({ error: 'Error al cargar el feed.' });
  }
}

function createPost(req, res) {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'El contenido del post es obligatorio.' });
    }

    const db = getDb();
    const result = db.run('INSERT INTO posts (user_id, content) VALUES (?, ?)', req.user.id, content.trim());

    const post = db.get(`
      SELECT p.*, u.full_name as author_name, u.profile_pic as author_pic, u.academic_status,
             un.name as university_name, un.acronym as university_acronym
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN universities un ON u.university_id = un.id
      WHERE p.id = ?
    `, result.lastInsertRowid);

    post.comments_count = 0;
    post.like_count = 0;
    post.liked_by_me = 0;

    res.status(201).json({ post });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ error: 'Error al crear el post.' });
  }
}

function getPostComments(req, res) {
  try {
    const db = getDb();
    const comments = db.all(`
      SELECT c.*, u.full_name as author_name, u.profile_pic as author_pic,
             un.acronym as university_acronym
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN universities un ON u.university_id = un.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `, req.params.postId);

    res.json({ comments });
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ error: 'Error al cargar comentarios.' });
  }
}

function addComment(req, res) {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'El comentario no puede estar vacío.' });
    }

    const db = getDb();
    const result = db.run('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      req.params.postId, req.user.id, content.trim());

    const comment = db.get(`
      SELECT c.*, u.full_name as author_name, u.profile_pic as author_pic,
             un.acronym as university_acronym
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN universities un ON u.university_id = un.id
      WHERE c.id = ?
    `, result.lastInsertRowid);

    res.status(201).json({ comment });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Error al agregar comentario.' });
  }
}

function toggleLike(req, res) {
  try {
    const db = getDb();
    const postId = req.params.postId;
    const userId = req.user.id;

    const existing = db.get('SELECT 1 as found FROM post_likes WHERE user_id = ? AND post_id = ?', userId, postId);

    if (existing) {
      db.run('DELETE FROM post_likes WHERE user_id = ? AND post_id = ?', userId, postId);
    } else {
      db.run('INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)', userId, postId);
    }

    const countRow = db.get('SELECT COUNT(*) as count FROM post_likes WHERE post_id = ?', postId);

    res.json({ liked: !existing, likeCount: countRow ? countRow.count : 0 });
  } catch (err) {
    console.error('Toggle like error:', err);
    res.status(500).json({ error: 'Error al procesar me gusta.' });
  }
}

function deletePost(req, res) {
  try {
    const db = getDb();
    const post = db.get('SELECT * FROM posts WHERE id = ? AND user_id = ?', req.params.id, req.user.id);
    if (!post) return res.status(404).json({ error: 'Post no encontrado.' });

    db.run('DELETE FROM posts WHERE id = ?', req.params.id);
    res.json({ message: 'Post eliminado.' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ error: 'Error al eliminar post.' });
  }
}

module.exports = { getFeed, createPost, getPostComments, addComment, toggleLike, deletePost };
