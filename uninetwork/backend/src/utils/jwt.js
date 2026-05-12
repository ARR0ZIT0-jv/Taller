const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'uninetwork_secret_key_2026_dev';
const JWT_EXPIRES_IN = '7d';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, academic_status: user.academic_status },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { generateToken, verifyToken, JWT_SECRET };
