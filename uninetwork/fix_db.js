const fs = require('fs');
let content = fs.readFileSync('functions/api/[[route]].js', 'utf8');

const tursoDbCode = `import { createClient } from '@libsql/client/web';

let _client;
function getTursoClient(env) {
  if (!_client) {
    _client = createClient({
      url: env.TURSO_URL,
      authToken: env.TURSO_AUTH_TOKEN
    });
  }
  return _client;
}

const db = {
  get: async (env, sql, ...p) => { const rs = await getTursoClient(env).execute({ sql, args: p.flat() }); return rs.rows[0] || null; },
  all: async (env, sql, ...p) => { const rs = await getTursoClient(env).execute({ sql, args: p.flat() }); return rs.rows; },
  run: async (env, sql, ...p) => { const rs = await getTursoClient(env).execute({ sql, args: p.flat() }); return { meta: { last_row_id: Number(rs.lastInsertRowid) } }; }
};`;

content = content.replace(/const db = \{[\s\S]*?\n\};\n/, tursoDbCode + '\n');
content = content.replace(/c\.env\.DB/g, 'c.env');

fs.writeFileSync('functions/api/[[route]].js', content);
console.log('Done!');
