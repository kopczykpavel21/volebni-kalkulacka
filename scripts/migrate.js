// Creates the tables and, with --views, the analysis views. Usage: DATABASE_URL=... npm run db:schema -- --views
import { readFileSync } from 'node:fs';
import { db, closeDb } from '../lib/db.js';

const pool = await db();
if (process.argv.includes('--views')) await pool.query(readFileSync(new URL('../db/views.sql', import.meta.url), 'utf8'));
console.log('schema ready' + (process.argv.includes('--views') ? ', views created' : ''));
await closeDb();
