const fs = require('fs');

let code = fs.readFileSync('c:/Users/Usuario/.gemini/antigravity/scratch/facebook-univ/uninetwork/functions/api/[[route]].js', 'utf8');

code = code.replace(/import \{ Hono \} from 'hono';/, 
`import { Hono } from 'hono';
import { handle } from 'hono/netlify';
import { createClient } from '@libsql/client/web';`);

code = code.replace(/const db = \{[\s\S]*?\};/, 
`let _client;
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
};`);

code = code.replace(/c\.env\.JWT_SECRET/g, 'process.env.JWT_SECRET');

code = code.replace(/export const onRequest = app\.fetch;/, 'export const handler = handle(app);');

fs.writeFileSync('c:/Users/Usuario/.gemini/antigravity/scratch/facebook-univ/uninetwork/frontend/netlify/functions/api.js', code);
console.log('Conversion successful!');
