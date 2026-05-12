import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_EXPIRES_SECONDS = 7 * 24 * 60 * 60; // 7 days

async function hashPassword(password) {
  // We use 10 salt rounds
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password, stored) {
  if (!stored) return false;
  return bcrypt.compare(password, stored);
}

async function generateToken(user, secret) {
  const payload = {
    id: user.id,
    email: user.email,
    academic_status: user.academic_status,
  };
  return jwt.sign(payload, secret, { expiresIn: JWT_EXPIRES_SECONDS });
}

async function verifyToken(token, secret) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}

export { hashPassword, verifyPassword, generateToken, verifyToken };
