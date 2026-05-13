import { Hono } from 'hono';
import { handle } from 'hono/netlify';
import { createClient } from '@libsql/client/web';
import { cors } from 'hono/cors';
import { hashPassword, verifyPassword, generateToken, verifyToken } from './lib/auth.js';
import { validateCI, normalizeCI } from './lib/ciValidator.js';
import { calculateScores, generateProfileLabel, matchCareers, CATEGORIES, CATEGORY_LABELS, CATEGORY_DESCRIPTIONS } from './lib/riasecEngine.js';

const app = new Hono();

app.use('*', cors({ origin: '*', allowMethods: ['GET','POST','PUT','DELETE','OPTIONS'], allowHeaders: ['Content-Type','Authorization'] }));

// ── Auth middleware ──────────────────────────────────────────────────────────
async function auth(c, next) {
  const h = c.req.header('Authorization') || '';
  if (!h.startsWith('Bearer ')) return c.json({ error: 'Token requerido.' }, 401);
  try {
    const secret = process.env.JWT_SECRET || 'uninetwork_secret_key_2026_dev';
    c.set('user', await verifyToken(h.slice(7), secret));
    await next();
  } catch { return c.json({ error: 'Token inválido o expirado.' }, 401); }
}

// ── D1 helpers ───────────────────────────────────────────────────────────────
let _client;
function getTursoClient() {
  if (!_client) {
    _client = createClient({
      url: process.env.TURSO_URL,
      authToken: process.env.TURSO_AUTH_TOKEN
    });
  }
  return _client;
}

const db = {
  get: async (D, sql, ...p) => { const rs = await getTursoClient().execute({ sql, args: p.flat() }); return rs.rows[0] || null; },
  all: async (D, sql, ...p) => { const rs = await getTursoClient().execute({ sql, args: p.flat() }); return rs.rows; },
  run: async (D, sql, ...p) => { const rs = await getTursoClient().execute({ sql, args: p.flat() }); return { meta: { last_row_id: Number(rs.lastInsertRowid) } }; }
};

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', c => c.json({ status: 'ok', name: 'UniNetwork API', version: '2.0.0' }));

// ── AUTH ROUTES ───────────────────────────────────────────────────────────────
app.post('/api/auth/register', async c => {
  const { full_name, email, password, ci, ci_country, academic_status, university_id, career_id, interests, graduation_year } = await c.req.json();
  if (!full_name || !email || !password || !ci || !academic_status)
    return c.json({ error: 'Todos los campos obligatorios deben ser completados.' }, 400);
  if (password.length < 6) return c.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, 400);
  const ciVal = validateCI(ci, ci_country || 'Bolivia');
  if (!ciVal.valid) return c.json({ error: ciVal.error }, 400);
  if (academic_status === 'university' && !university_id)
    return c.json({ error: 'Los estudiantes universitarios deben seleccionar su universidad.' }, 400);
  const D = null;
  const existing = await db.get(D, 'SELECT id FROM users WHERE email = ?', email);
  if (existing) return c.json({ error: 'Este correo electrónico ya está registrado.' }, 409);
  const passwordHash = await hashPassword(password);
  const ciHash = await hashPassword(normalizeCI(ci));
  try {
    const r = await db.run(D,
      `INSERT INTO users (full_name,email,password_hash,ci_hash,ci_country,academic_status,university_id,career_id,interests,graduation_year) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      full_name, email, passwordHash, ciHash, ci_country || 'Bolivia', academic_status,
      university_id || null, career_id || null, interests || '', graduation_year || null
    );
    const user = await db.get(D, 'SELECT id,full_name,email,academic_status,university_id,profile_pic FROM users WHERE rowid = ?', r.meta.last_row_id);
    const token = await generateToken(user, process.env.JWT_SECRET || 'uninetwork_secret_key_2026_dev');
    return c.json({ message: 'Registro exitoso. ¡Bienvenido a UniNetwork!', token, user }, 201);
  } catch (e) {
    console.error("Register Error:", e);
    if (e.message?.includes('UNIQUE')) return c.json({ error: 'Esta Cédula de Identidad ya está registrada.' }, 409);
    return c.json({ error: 'Error interno: ' + (e.message || String(e)) }, 500);
  }
});

app.post('/api/auth/login', async c => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) return c.json({ error: 'Email y contraseña son obligatorios.' }, 400);
    const D = null;
    const user = await db.get(D, `SELECT u.*,un.name as university_name,un.acronym as university_acronym FROM users u LEFT JOIN universities un ON u.university_id=un.id WHERE u.email=?`, email);
    if (!user) return c.json({ error: 'Credenciales incorrectas.' }, 401);
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return c.json({ error: 'Credenciales incorrectas.' }, 401);
    const token = await generateToken(user, process.env.JWT_SECRET || 'uninetwork_secret_key_2026_dev');
    const { password_hash, ci_hash, ...safeUser } = user;
    return c.json({ message: 'Inicio de sesión exitoso.', token, user: safeUser });
  } catch (e) {
    console.error("Login Error:", e);
    return c.json({ error: 'Error interno: ' + (e.message || String(e)) }, 500);
  }
});

app.get('/api/auth/me', auth, async c => {
  const D = null;
  const user = await db.get(D, `SELECT u.id,u.full_name,u.email,u.academic_status,u.university_id,u.career_id,u.bio,u.profile_pic,u.cover_pic,u.interests,u.graduation_year,u.created_at,un.name as university_name,un.acronym as university_acronym,ca.name as career_name FROM users u LEFT JOIN universities un ON u.university_id=un.id LEFT JOIN careers ca ON u.career_id=ca.id WHERE u.id=?`, c.get('user').id);
  if (!user) return c.json({ error: 'Usuario no encontrado.' }, 404);
  return c.json({ user });
});

// ── UNIVERSITIES ──────────────────────────────────────────────────────────────
app.get('/api/universities', async c => {
  const { country, type, search } = c.req.query();
  const D = null;
  let sql = 'SELECT * FROM universities WHERE 1=1';
  const p = [];
  if (country) { sql += ' AND country=?'; p.push(country); }
  if (type)    { sql += ' AND type=?';    p.push(type); }
  if (search)  { sql += ' AND (name LIKE ? OR acronym LIKE ?)'; p.push(`%${search}%`, `%${search}%`); }
  sql += ' ORDER BY country,name';
  const universities = await db.all(D, sql, ...p);
  return c.json({ universities });
});

app.get('/api/universities/:id', async c => {
  const D = null;
  const university = await db.get(D, 'SELECT * FROM universities WHERE id=?', c.req.param('id'));
  if (!university) return c.json({ error: 'Universidad no encontrada.' }, 404);
  const careers = await db.all(D, 'SELECT * FROM careers WHERE university_id=? ORDER BY faculty,name', c.req.param('id'));
  const r = await db.get(D, 'SELECT COUNT(*) as count FROM users WHERE university_id=?', c.req.param('id'));
  return c.json({ university, careers, studentCount: r?.count || 0 });
});

// ── CAREERS ───────────────────────────────────────────────────────────────────
app.get('/api/careers', async c => {
  const { query, faculty, country, type, page = 1, limit = 20 } = c.req.query();
  const D = null;
  const all = await db.all(D, `SELECT c.id,c.name,c.faculty,c.duration_years,c.degree_title,c.curriculum_summary,u.id as university_id,u.name as university_name,u.acronym as university_acronym,u.country,u.city,u.type as university_type,u.website FROM careers c JOIN universities u ON c.university_id=u.id ORDER BY c.name ASC`);
  const norm = s => s?.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase() || '';
  let filtered = all;
  if (query) { const q = norm(query); filtered = filtered.filter(c => norm(c.name).includes(q) || norm(c.faculty).includes(q) || norm(c.curriculum_summary).includes(q)); }
  if (faculty) { const f = norm(faculty); filtered = filtered.filter(c => norm(c.faculty).includes(f)); }
  if (country) filtered = filtered.filter(c => c.country === country);
  if (type)    filtered = filtered.filter(c => c.university_type === type);
  const total = filtered.length, offset = (parseInt(page)-1)*parseInt(limit);
  return c.json({ results: filtered.slice(offset, offset+parseInt(limit)), pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total/parseInt(limit)) } });
});

app.get('/api/careers/faculties', async c => {
  const f = await db.all(null, 'SELECT DISTINCT faculty FROM careers ORDER BY faculty');
  return c.json({ faculties: f.map(r => r.faculty) });
});

app.get('/api/careers/countries', async c => {
  const r = await db.all(null, 'SELECT DISTINCT country FROM universities ORDER BY country');
  return c.json({ countries: r.map(x => x.country) });
});

app.get('/api/careers/:id', async c => {
  const career = await db.get(null, `SELECT c.*,u.name as university_name,u.acronym as university_acronym,u.country,u.city,u.type as university_type,u.website,u.description as university_description FROM careers c JOIN universities u ON c.university_id=u.id WHERE c.id=?`, c.req.param('id'));
  if (!career) return c.json({ error: 'Carrera no encontrada.' }, 404);
  return c.json({ career });
});

// ── POSTS ─────────────────────────────────────────────────────────────────────
app.get('/api/posts/feed', auth, async c => {
  const D = null; const { page=1, limit=20 } = c.req.query();
  const offset = (parseInt(page)-1)*parseInt(limit);
  const posts = await db.all(D, `SELECT p.*,u.full_name as author_name,u.profile_pic as author_pic,u.academic_status,un.name as university_name,un.acronym as university_acronym,(SELECT COUNT(*) FROM comments WHERE post_id=p.id) as comments_count,(SELECT COUNT(*) FROM post_likes WHERE post_id=p.id) as like_count,(SELECT COUNT(*) FROM post_likes WHERE post_id=p.id AND user_id=?) as liked_by_me FROM posts p JOIN users u ON p.user_id=u.id LEFT JOIN universities un ON u.university_id=un.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?`, c.get('user').id, parseInt(limit), offset);
  const t = await db.get(D, 'SELECT COUNT(*) as total FROM posts');
  return c.json({ posts, pagination: { page: parseInt(page), limit: parseInt(limit), total: t?.total||0, totalPages: Math.ceil((t?.total||0)/parseInt(limit)) } });
});

app.post('/api/posts', auth, async c => {
  const { content } = await c.req.json();
  if (!content?.trim()) return c.json({ error: 'El contenido del post es obligatorio.' }, 400);
  const D = null;
  const r = await db.run(D, 'INSERT INTO posts (user_id,content) VALUES (?,?)', c.get('user').id, content.trim());
  const post = await db.get(D, `SELECT p.*,u.full_name as author_name,u.profile_pic as author_pic,u.academic_status,un.name as university_name,un.acronym as university_acronym FROM posts p JOIN users u ON p.user_id=u.id LEFT JOIN universities un ON u.university_id=un.id WHERE p.id=?`, r.meta.last_row_id);
  return c.json({ post: { ...post, comments_count:0, like_count:0, liked_by_me:0 } }, 201);
});

app.get('/api/posts/:postId/comments', auth, async c => {
  const comments = await db.all(null, `SELECT co.*,u.full_name as author_name,u.profile_pic as author_pic,un.acronym as university_acronym FROM comments co JOIN users u ON co.user_id=u.id LEFT JOIN universities un ON u.university_id=un.id WHERE co.post_id=? ORDER BY co.created_at ASC`, c.req.param('postId'));
  return c.json({ comments });
});

app.post('/api/posts/:postId/comments', auth, async c => {
  const { content } = await c.req.json();
  if (!content?.trim()) return c.json({ error: 'El comentario no puede estar vacío.' }, 400);
  const D = null;
  const r = await db.run(D, 'INSERT INTO comments (post_id,user_id,content) VALUES (?,?,?)', c.req.param('postId'), c.get('user').id, content.trim());
  const comment = await db.get(D, `SELECT co.*,u.full_name as author_name,u.profile_pic as author_pic,un.acronym as university_acronym FROM comments co JOIN users u ON co.user_id=u.id LEFT JOIN universities un ON u.university_id=un.id WHERE co.id=?`, r.meta.last_row_id);
  return c.json({ comment }, 201);
});

app.post('/api/posts/:postId/like', auth, async c => {
  const D = null; const { id: userId } = c.get('user'); const postId = c.req.param('postId');
  const existing = await db.get(D, 'SELECT 1 FROM post_likes WHERE user_id=? AND post_id=?', userId, postId);
  if (existing) { await db.run(D, 'DELETE FROM post_likes WHERE user_id=? AND post_id=?', userId, postId); }
  else          { await db.run(D, 'INSERT INTO post_likes (user_id,post_id) VALUES (?,?)', userId, postId); }
  const cnt = await db.get(D, 'SELECT COUNT(*) as count FROM post_likes WHERE post_id=?', postId);
  return c.json({ liked: !existing, likeCount: cnt?.count||0 });
});

app.delete('/api/posts/:id', auth, async c => {
  const D = null;
  const post = await db.get(D, 'SELECT * FROM posts WHERE id=? AND user_id=?', c.req.param('id'), c.get('user').id);
  if (!post) return c.json({ error: 'Post no encontrado.' }, 404);
  await db.run(D, 'DELETE FROM posts WHERE id=?', c.req.param('id'));
  return c.json({ message: 'Post eliminado.' });
});

// ── PROFILE ───────────────────────────────────────────────────────────────────
app.get('/api/profile/:userId', auth, async c => {
  const D = null; const userId = c.req.param('userId');
  const user = await db.get(D, `SELECT u.id,u.full_name,u.email,u.academic_status,u.university_id,u.career_id,u.bio,u.profile_pic,u.cover_pic,u.interests,u.graduation_year,u.created_at,un.name as university_name,un.acronym as university_acronym,un.city as university_city,ca.name as career_name,ca.faculty FROM users u LEFT JOIN universities un ON u.university_id=un.id LEFT JOIN careers ca ON u.career_id=ca.id WHERE u.id=?`, userId);
  if (!user) return c.json({ error: 'Usuario no encontrado.' }, 404);
  const posts = await db.all(D, `SELECT p.*,(SELECT COUNT(*) FROM comments WHERE post_id=p.id) as comments_count,(SELECT COUNT(*) FROM post_likes WHERE post_id=p.id) as like_count,(SELECT COUNT(*) FROM post_likes WHERE post_id=p.id AND user_id=?) as liked_by_me FROM posts p WHERE p.user_id=? ORDER BY p.created_at DESC`, c.get('user').id, userId);
  const cc = await db.get(D, `SELECT COUNT(*) as count FROM connections WHERE (requester_id=? OR receiver_id=?) AND status='accepted'`, userId, userId);
  let connectionStatus = null;
  if (parseInt(userId) !== c.get('user').id) {
    const conn = await db.get(D, `SELECT * FROM connections WHERE (requester_id=? AND receiver_id=?) OR (requester_id=? AND receiver_id=?)`, c.get('user').id, userId, userId, c.get('user').id);
    connectionStatus = conn?.status || null;
  }
  return c.json({ user, posts, connectionCount: cc?.count||0, connectionStatus });
});

app.get('/api/profile', auth, async c => {
  const D = null;
  const user = await db.get(D, `SELECT u.id,u.full_name,u.email,u.academic_status,u.university_id,u.career_id,u.bio,u.profile_pic,u.cover_pic,u.interests,u.graduation_year,u.created_at,un.name as university_name,un.acronym as university_acronym,ca.name as career_name,ca.faculty FROM users u LEFT JOIN universities un ON u.university_id=un.id LEFT JOIN careers ca ON u.career_id=ca.id WHERE u.id=?`, c.get('user').id);
  if (!user) return c.json({ error: 'Usuario no encontrado.' }, 404);
  const posts = await db.all(D, `SELECT p.*,(SELECT COUNT(*) FROM comments WHERE post_id=p.id) as comments_count,(SELECT COUNT(*) FROM post_likes WHERE post_id=p.id) as like_count,0 as liked_by_me FROM posts p WHERE p.user_id=? ORDER BY p.created_at DESC`, c.get('user').id);
  const cc = await db.get(D, `SELECT COUNT(*) as count FROM connections WHERE (requester_id=? OR receiver_id=?) AND status='accepted'`, c.get('user').id, c.get('user').id);
  return c.json({ user, posts, connectionCount: cc?.count||0, connectionStatus: null });
});

app.put('/api/profile', auth, async c => {
  const { bio, interests, profile_pic, cover_pic } = await c.req.json();
  const D = null;
  await db.run(D, `UPDATE users SET bio=COALESCE(?,bio),interests=COALESCE(?,interests),profile_pic=COALESCE(?,profile_pic),cover_pic=COALESCE(?,cover_pic) WHERE id=?`, bio, interests, profile_pic, cover_pic, c.get('user').id);
  const user = await db.get(D, 'SELECT id,full_name,email,academic_status,bio,profile_pic,cover_pic,interests FROM users WHERE id=?', c.get('user').id);
  return c.json({ user, message: 'Perfil actualizado.' });
});

app.post('/api/profile/:userId/connect', auth, async c => {
  const D = null; const receiverId = parseInt(c.req.param('userId'));
  if (receiverId === c.get('user').id) return c.json({ error: 'No puedes conectarte contigo mismo.' }, 400);
  const existing = await db.get(D, `SELECT * FROM connections WHERE (requester_id=? AND receiver_id=?) OR (requester_id=? AND receiver_id=?)`, c.get('user').id, receiverId, receiverId, c.get('user').id);
  if (existing) return c.json({ error: 'Ya existe una solicitud de conexión.', status: existing.status }, 409);
  await db.run(D, 'INSERT INTO connections (requester_id,receiver_id) VALUES (?,?)', c.get('user').id, receiverId);
  return c.json({ message: 'Solicitud de conexión enviada.' }, 201);
});

app.put('/api/profile/connections/:connectionId', auth, async c => {
  const { action } = await c.req.json();
  const D = null;
  const conn = await db.get(D, `SELECT * FROM connections WHERE id=? AND receiver_id=? AND status='pending'`, c.req.param('connectionId'), c.get('user').id);
  if (!conn) return c.json({ error: 'Solicitud no encontrada.' }, 404);
  const newStatus = action === 'accept' ? 'accepted' : 'rejected';
  await db.run(D, 'UPDATE connections SET status=? WHERE id=?', newStatus, conn.id);
  return c.json({ message: action === 'accept' ? 'Conexión aceptada.' : 'Solicitud rechazada.' });
});

app.get('/api/profile/connections', auth, async c => {
  const D = null; const uid = c.get('user').id;
  const connections = await db.all(D, `SELECT u.id,u.full_name,u.profile_pic,u.academic_status,u.bio,un.name as university_name,un.acronym as university_acronym FROM connections co JOIN users u ON (CASE WHEN co.requester_id=? THEN co.receiver_id ELSE co.requester_id END)=u.id LEFT JOIN universities un ON u.university_id=un.id WHERE (co.requester_id=? OR co.receiver_id=?) AND co.status='accepted'`, uid, uid, uid);
  return c.json({ connections });
});

app.get('/api/profile/suggestions', auth, async c => {
  const D = null; const uid = c.get('user').id;
  const user = await db.get(D, 'SELECT * FROM users WHERE id=?', uid);
  if (!user) return c.json({ error: 'Usuario no encontrado.' }, 404);
  if (user.academic_status === 'high_school' && user.interests) {
    const terms = user.interests.split(',').map(i => i.trim().toLowerCase());
    const careers = await db.all(D, `SELECT c.*,u.name as university_name,u.acronym as university_acronym,u.country,u.city,u.type as university_type FROM careers c JOIN universities u ON c.university_id=u.id`);
    const scored = careers.map(career => {
      const txt = `${career.name} ${career.faculty} ${career.curriculum_summary||''}`.toLowerCase();
      const score = terms.reduce((s,t) => s + (txt.includes(t)?10:0), 0);
      return { ...career, relevanceScore: score };
    }).filter(c => c.relevanceScore > 0).sort((a,b) => b.relevanceScore-a.relevanceScore).slice(0,10);
    return c.json({ suggestions: scored, type: 'career_recommendations' });
  }
  const people = await db.all(D, `SELECT u.id,u.full_name,u.profile_pic,u.bio,u.academic_status,un.name as university_name,un.acronym as university_acronym FROM users u LEFT JOIN universities un ON u.university_id=un.id WHERE u.id!=? AND u.id NOT IN (SELECT CASE WHEN requester_id=? THEN receiver_id ELSE requester_id END FROM connections WHERE requester_id=? OR receiver_id=?) ORDER BY CASE WHEN u.university_id=? THEN 0 ELSE 1 END LIMIT 10`, uid, uid, uid, uid, user.university_id);
  return c.json({ suggestions: people, type: 'people_suggestions' });
});

// ── VOCATIONAL ────────────────────────────────────────────────────────────────
app.get('/api/vocational/questions', async c => {
  const questions = await db.all(null, 'SELECT id,text,category,weight,order_num FROM vocational_questions ORDER BY order_num ASC');
  const grouped = {};
  for (const cat of CATEGORIES) {
    grouped[cat] = { code: cat, label: CATEGORY_LABELS[cat], description: CATEGORY_DESCRIPTIONS[cat], questions: questions.filter(q => q.category === cat) };
  }
  return c.json({ total: questions.length, categories: CATEGORIES.map(cat => grouped[cat]), questions });
});

app.post('/api/vocational/submit', auth, async c => {
  const { answers } = await c.req.json();
  if (!answers || !Array.isArray(answers) || answers.length === 0)
    return c.json({ error: 'Respuestas requeridas.' }, 400);
  const D = null;
  const questions = await db.all(D, 'SELECT id,category,weight FROM vocational_questions');
  const qMap = Object.fromEntries(questions.map(q => [q.id, q]));
  const enriched = answers.map(a => ({ questionId: a.questionId, answer: Math.min(5,Math.max(1,parseInt(a.answer)||3)), category: qMap[a.questionId]?.category||'R', weight: qMap[a.questionId]?.weight||1 }));
  const scores = calculateScores(enriched);
  const profileLabel = generateProfileLabel(scores);
  const careerVectors = await db.all(D, `SELECT cr.*,c.name as career_name,c.faculty,c.duration_years,c.degree_title,u.name as university_name,u.acronym as university_acronym,u.country,u.city FROM career_riasec cr JOIN careers c ON cr.career_id=c.id JOIN universities u ON c.university_id=u.id`);
  const ranked = matchCareers(scores, careerVectors);
  const top5 = ranked.slice(0,5);
  await db.run(D, `INSERT INTO vocational_results (user_id,r_score,i_score,a_score,s_score,e_score,c_score,profile_label,recommended_careers) VALUES (?,?,?,?,?,?,?,?,?)`, c.get('user').id, scores.R, scores.I, scores.A, scores.S, scores.E, scores.C, profileLabel, JSON.stringify(top5.map(c => c.career_id)));
  return c.json({ scores, profileLabel, categoryDescriptions: CATEGORY_DESCRIPTIONS, categoryLabels: CATEGORY_LABELS, topCareers: top5, allRanked: ranked });
});

app.get('/api/vocational/results', auth, async c => {
  const results = await db.all(null, 'SELECT * FROM vocational_results WHERE user_id=? ORDER BY created_at DESC', c.get('user').id);
  return c.json({ results });
});

app.get('/api/vocational/results/latest', auth, async c => {
  const D = null;
  const result = await db.get(D, 'SELECT * FROM vocational_results WHERE user_id=? ORDER BY created_at DESC LIMIT 1', c.get('user').id);
  if (!result) return c.json({ result: null });
  const careerIds = JSON.parse(result.recommended_careers || '[]');
  let topCareers = [];
  if (careerIds.length > 0) {
    const all = await db.all(D, `SELECT cr.*,c.id as career_id,c.name as career_name,c.faculty,c.duration_years,c.degree_title,u.name as university_name,u.acronym as university_acronym,u.country,u.city FROM career_riasec cr JOIN careers c ON cr.career_id=c.id JOIN universities u ON c.university_id=u.id`);
    topCareers = careerIds.map(id => all.find(c => c.career_id === id)).filter(Boolean);
  }
  return c.json({ result: { ...result, scores: { R: result.r_score, I: result.i_score, A: result.a_score, S: result.s_score, E: result.e_score, C: result.c_score } }, topCareers, categoryLabels: CATEGORY_LABELS, categoryDescriptions: CATEGORY_DESCRIPTIONS });
});

export const handler = handle(app);
