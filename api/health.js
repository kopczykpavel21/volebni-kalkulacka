// Database check. On failure it reports the kind of problem, never the URL or password.
import { db } from '../lib/db.js';
import { send } from '../lib/http.js';

function diagnose(e) {
  const url = process.env.DATABASE_URL || '';
  if (!url) return ['no_database_url', 'DATABASE_URL is not set for this deployment. Add it in Vercel and redeploy.'];
  if (url.includes('${{') || url.includes('}}')) return ['template_not_resolved', 'DATABASE_URL still contains ${{...}} placeholders. Paste the resolved value from Railway.'];
  if (url.includes('railway.internal')) return ['internal_host', 'DATABASE_URL uses the internal Railway host. Use the public one (proxy.rlwy.net).'];
  if (/\s/.test(url) || /^["']|["']$/.test(url)) return ['whitespace_or_quotes', 'DATABASE_URL has spaces, line breaks or quotes around it. Paste it without them.'];
  if (!/^postgres(ql)?:\/\//.test(url)) return ['not_a_postgres_url', 'DATABASE_URL must start with postgresql://'];
  const code = e.code || '';
  const map = {
    ENOTFOUND: 'The host name in DATABASE_URL does not exist. Check RAILWAY_TCP_PROXY_DOMAIN.',
    EAI_AGAIN: 'The host name could not be resolved. Check the host in DATABASE_URL.',
    ECONNREFUSED: 'The host refused the connection. Check the port (RAILWAY_TCP_PROXY_PORT) and that the TCP proxy is enabled.',
    ETIMEDOUT: 'The connection timed out. Check the port and that public networking is enabled in Railway.',
    ECONNRESET: 'The connection was reset. Check the port; it must be the TCP proxy port, not 5432.',
    '28P01': 'Wrong password or user in DATABASE_URL.',
    '28000': 'The database rejected this user. Check user and password.',
    '3D000': 'The database name at the end of DATABASE_URL does not exist (normally "railway").',
    ERR_INVALID_URL: 'DATABASE_URL is not a valid URL. A special character in the password may need encoding.'
  };
  if (map[code]) return [code, map[code]];
  if (/timeout/i.test(e.message || '')) return ['timeout', 'The connection timed out. Check host and port, and that public networking is enabled in Railway.'];
  if (/SSL|TLS/i.test(e.message || '')) return ['ssl', 'TLS problem. Set the environment variable PGSSL=off and redeploy.'];
  return [code || 'unknown', 'Unrecognised database error. Look at the function log in Vercel.'];
}

export default async function health(req, res) {
  try {
    const pool = await db();
    const r = await pool.query('SELECT (SELECT count(*) FROM respondents)::int AS respondents');
    send(res, 200, { ok: true, respondents: r.rows[0].respondents });
  } catch (e) {
    console.error(e);
    const [problem, hint] = diagnose(e);
    send(res, 500, { ok: false, problem, hint });
  }
}
