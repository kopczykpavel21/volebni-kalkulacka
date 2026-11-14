// Database check. On failure it reports the kind of problem, never the URL or password.
import { db } from '../lib/db.js';
import { send } from '../lib/http.js';

// Describes the shape of the URL without revealing any part of it.
export function shape(url) {
  const rest = url.replace(/^postgres(ql)?:\/\//, '');
  const slash = rest.indexOf('/');
  const authority = slash < 0 ? rest : rest.slice(0, slash);
  const at = authority.lastIndexOf('@');
  const hostport = at < 0 ? authority : authority.slice(at + 1);
  const colon = hostport.lastIndexOf(':');
  const host = colon < 0 ? hostport : hostport.slice(0, colon);
  const port = colon < 0 ? '' : hostport.slice(colon + 1);
  return {
    has_user_and_password: at >= 0 && authority.slice(0, at).includes(':'),
    host: !host ? 'empty' : /\.rlwy\.net$/.test(host) ? 'railway_public' : /^[a-z0-9.-]+$/i.test(host) ? 'other' : 'invalid_characters',
    port: !port ? 'empty' : /^\d+$/.test(port) ? (Number(port) <= 65535 ? 'number' : 'too_large') : 'not_a_number',
    has_database_name: slash >= 0 && rest.length > slash + 1,
    scheme_repeated: /postgres(ql)?:\/\//.test(rest)
  };
}

function shapeHint(url) {
  const s = shape(url);
  if (s.scheme_repeated) return 'DATABASE_URL contains postgresql:// twice. Paste the value only once.';
  if (s.host === 'empty') return 'The host in DATABASE_URL is empty. Railway has no public address for this database yet: enable the TCP proxy in the Postgres service under Settings, Networking, then copy DATABASE_PUBLIC_URL again.';
  if (s.host === 'invalid_characters') return 'The host in DATABASE_URL contains characters that are not allowed. It should look like name.proxy.rlwy.net.';
  if (s.port === 'not_a_number' || s.port === 'too_large') return 'The port in DATABASE_URL is not a valid number. Use the TCP proxy port from Railway.';
  return 'DATABASE_URL is not a valid URL. Copy DATABASE_PUBLIC_URL from Railway again.';
}

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
    ERR_INVALID_URL: 'DATABASE_URL is not a valid URL.'
  };
  if (code === 'ERR_INVALID_URL') return [code, shapeHint(url)];
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
    const url = process.env.DATABASE_URL || '';
    send(res, 500, { ok: false, problem, hint, shape: url ? shape(url) : null });
  }
}
