/**
 * lib/auth.js — JWT + password hashing for Cloudflare Workers (Web Crypto API)
 * Replaces: jsonwebtoken + bcryptjs (Node-only)
 */

// ── PBKDF2-based password hashing (Web Crypto, no bcrypt) ──────────────────
// We use PBKDF2-SHA256 with a random 16-byte salt, 100k iterations.
// Format stored: "pbkdf2$<iterations>$<saltHex>$<hashHex>"

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_HASH = 'SHA-256';
const PBKDF2_KEY_LEN = 32; // bytes

async function hashPassword(password) {
  const enc = new TextEncoder();
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = bufToHex(saltBytes);

  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: PBKDF2_ITERATIONS, hash: PBKDF2_HASH },
    keyMaterial,
    PBKDF2_KEY_LEN * 8
  );
  const hashHex = bufToHex(new Uint8Array(derived));
  return `pbkdf2$${PBKDF2_ITERATIONS}$${saltHex}$${hashHex}`;
}

async function verifyPassword(password, stored) {
  // Support legacy bcrypt hashes from the old backend (starts with $2a$)
  // Those won't match — users will need to re-register, or we skip CI uniqueness check.
  if (!stored || !stored.startsWith('pbkdf2$')) return false;

  const parts = stored.split('$');
  if (parts.length !== 4) return false;

  const [, iters, saltHex, expectedHex] = parts;
  const enc = new TextEncoder();
  const saltBytes = hexToBuf(saltHex);

  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: parseInt(iters), hash: PBKDF2_HASH },
    keyMaterial,
    PBKDF2_KEY_LEN * 8
  );
  const actualHex = bufToHex(new Uint8Array(derived));

  // Constant-time comparison
  return timingSafeEqual(actualHex, expectedHex);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function bufToHex(buf) {
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}
function hexToBuf(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// ── JWT (HS256 via Web Crypto) ──────────────────────────────────────────────
const JWT_EXPIRES_SECONDS = 7 * 24 * 60 * 60; // 7 days

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function b64urlDecode(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

async function getJwtKey(secret) {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
  );
}

async function generateToken(user, secret) {
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payload = b64url(new TextEncoder().encode(JSON.stringify({
    id: user.id,
    email: user.email,
    academic_status: user.academic_status,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + JWT_EXPIRES_SECONDS,
  })));
  const data = `${header}.${payload}`;
  const key = await getJwtKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return `${data}.${b64url(sig)}`;
}

async function verifyToken(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');
  const [header, payload, sig] = parts;
  const key = await getJwtKey(secret);
  const valid = await crypto.subtle.verify(
    'HMAC', key,
    b64urlDecode(sig),
    new TextEncoder().encode(`${header}.${payload}`)
  );
  if (!valid) throw new Error('Invalid signature');
  const decoded = JSON.parse(new TextDecoder().decode(b64urlDecode(payload)));
  if (decoded.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');
  return decoded;
}

export { hashPassword, verifyPassword, generateToken, verifyToken };
