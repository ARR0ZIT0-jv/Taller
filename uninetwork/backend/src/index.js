const express = require('express');
const cors = require('cors');
const path = require('path');

const { initDb } = require('./config/db');
const { initializeDatabase } = require('./models/schema');
const authRoutes = require('./routes/auth');
const careerRoutes = require('./routes/careers');
const universityRoutes = require('./routes/universities');
const postRoutes = require('./routes/posts');
const profileRoutes = require('./routes/profile');
const vocationalRoutes = require('./routes/vocational');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/vocational', vocationalRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'UniNetwork API', version: '1.0.0' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

// Initialize DB then start server
async function start() {
  await initDb();
  initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`\n🎓 UniNetwork API running on http://localhost:${PORT}`);
    console.log(`📚 API Health: http://localhost:${PORT}/api/health\n`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
