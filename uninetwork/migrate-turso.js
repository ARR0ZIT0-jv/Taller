const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

const TURSO_URL = 'libsql://uninetwork-arr0zit0-jv.aws-us-east-2.turso.io';
const TURSO_AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE4MTAyNDU0MDMsImlhdCI6MTc3ODcwOTQwMywiaWQiOiIwMTllMWExMy1kZjAxLTdlYjAtYTVmNi1lOTljNzE1YmYyNGYiLCJyaWQiOiI1YTMzNDMxYi1hYmEwLTQwNjQtOGZhZC1mYTI3NTExNGUxMDIifQ.KUa-RZ41CvQHa8wRodnXBD6NszmgwWrvqCs2F2Hqga4906VzLRecobjtrdODuHZRNT3QeXVeURdErN8JruAQBA';

async function migrateTurso() {
  console.log('🔄 Conectando a Turso...');
  const client = createClient({
    url: TURSO_URL,
    authToken: TURSO_AUTH_TOKEN,
  });

  try {
    // 1. Ejecutar Schema
    console.log('📄 Leyendo schema.sql...');
    const schemaSql = fs.readFileSync(path.join(process.cwd(), 'schema.sql'), 'utf-8');
    
    // LibSQL requiere ejecutar las sentencias DDL una por una o en un batch
    const schemaStatements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log('🏗️ Creando tablas...');
    for (const stmt of schemaStatements) {
      await client.execute(stmt);
    }
    console.log('✅ Tablas creadas correctamente.');

    // 2. Ejecutar Seed
    console.log('📄 Leyendo seed.sql...');
    const seedSql = fs.readFileSync(path.join(process.cwd(), 'seed.sql'), 'utf-8');
    
    const seedStatements = seedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log('🌱 Insertando datos iniciales (esto puede tomar unos segundos)...');
    
    await client.batch(seedStatements, 'write');
    
    console.log('✅ Datos iniciales insertados correctamente.');
    console.log('🎉 ¡Migración a Turso completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error.message || error);
  } finally {
    client.close();
  }
}

migrateTurso();
