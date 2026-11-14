import pg from 'pg';
import { SCHEMA } from './schema.js';

let pool;
let ready;

export function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    const local = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url) || url.includes('host=/');
    const ssl = local || process.env.PGSSL === 'off' ? false : { rejectUnauthorized: false };
    // Serverless functions are short-lived: keep the pool small.
    pool = new pg.Pool({ connectionString: url, ssl, max: 3, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 8_000 });
  }
  return pool;
}

/** Returns the pool after making sure the tables exist (once per process). */
export async function db() {
  const p = getPool();
  if (!ready) ready = p.query(SCHEMA).catch(e => { ready = null; throw e; });
  await ready;
  return p;
}

export async function closeDb() {
  if (pool) await pool.end();
  pool = null;
  ready = null;
}
