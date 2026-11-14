import { timingSafeEqual } from 'node:crypto';

const MAX_BODY = 60_000;

export function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

/** Vercel parses JSON bodies itself; the local dev server and tests do not. */
export async function readJson(req) {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
    return req.body;
  }
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > MAX_BODY) { const e = new Error('body too large'); e.status = 413; throw e; }
    chunks.push(c);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

/** Wraps a handler: method check, JSON errors, no stack traces to the client. */
export function handler(methods, fn) {
  return async (req, res) => {
    if (!methods.includes(req.method)) {
      res.setHeader('Allow', methods.join(', '));
      return send(res, 405, { error: 'method not allowed' });
    }
    try {
      await fn(req, res);
    } catch (e) {
      if (e instanceof SyntaxError) return send(res, 400, { error: 'invalid JSON' });
      if (e.status) return send(res, e.status, { error: e.message });
      console.error(e);
      send(res, 500, { error: 'server error' });
    }
  };
}

export function fail(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

export function isAdmin(req) {
  const token = process.env.ADMIN_TOKEN || '';
  const given = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (token.length < 16 || given.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(token));
}

export const query = req => new URL(req.url, 'http://x').searchParams;
