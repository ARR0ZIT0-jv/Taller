import { createClient } from '@libsql/client/web';
import fs from 'fs';
import path from 'path';

const url = "libsql://uninetwork-arr0zit0-jv.aws-us-east-2.turso.io";
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!authToken) {
  console.error("❌ ERROR: Falta el token de Turso.");
  console.error("Por favor, ejecuta el script de la siguiente manera:");
  console.error("set TURSO_AUTH_TOKEN=AQUI_TU_TOKEN_LARGO && node seed-turso.mjs");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function run() {
  try {
    console.log('📖 Leyendo schema.sql...');
    const schema = fs.readFileSync('uninetwork/schema.sql', 'utf8');
    
    console.log('📖 Leyendo seed.sql...');
    const seed = fs.readFileSync('uninetwork/seed.sql', 'utf8');

    console.log('⚙️  Ejecutando schema en Turso...');
    await client.executeMultiple(schema);
    console.log('✅ Schema aplicado.');
    
    console.log('⚙️  Inyectando datos semilla en Turso...');
    await client.executeMultiple(seed);
    console.log('✅ Datos inyectados con éxito.');

    console.log('🎉 ¡Base de datos Turso lista para producción!');
  } catch (err) {
    console.error('❌ Error ejecutando SQL en Turso:', err);
  }
}

run();
