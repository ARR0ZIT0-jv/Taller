// Script para generar hashes PBKDF2 compatibles con Cloudflare Workers
// y actualizar la base de datos D1

import { subtle, getRandomValues } from 'crypto';

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_HASH = 'SHA-256';
const PBKDF2_KEY_LEN = 32;

function bufToHex(buf) {
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password) {
  const enc = new TextEncoder();
  const saltBytes = getRandomValues(new Uint8Array(16));
  const saltHex = bufToHex(saltBytes);

  const keyMaterial = await subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const derived = await subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations: PBKDF2_ITERATIONS, hash: PBKDF2_HASH },
    keyMaterial,
    PBKDF2_KEY_LEN * 8
  );
  const hashHex = bufToHex(new Uint8Array(derived));
  return `pbkdf2$${PBKDF2_ITERATIONS}$${saltHex}$${hashHex}`;
}

// Generar hash para 'demo1234'
const hash = await hashPassword('demo1234');
console.log('Hash generado:', hash);
console.log('\nSQL para actualizar D1:');
console.log(`UPDATE users SET password_hash='${hash}';`);
console.log('\nEjecuta ese SQL con:');
console.log(`npx wrangler d1 execute uninetwork-db --remote --command="UPDATE users SET password_hash='${hash}'"`);
