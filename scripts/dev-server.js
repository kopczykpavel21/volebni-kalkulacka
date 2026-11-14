// Local development server: serves public/ and routes /api/* to the same handlers Vercel runs.
// Usage: DATABASE_URL=postgresql://... ADMIN_TOKEN=... npm run dev
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PUBLIC = join(ROOT, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
const isFile = async p => { try { return (await stat(p)).isFile(); } catch { return false; } };

export const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.startsWith('/api/')) {
    const file = join(ROOT, normalize(path) + '.js');
    if (!file.startsWith(join(ROOT, 'api') + sep) || !(await isFile(file))) { res.statusCode = 404; return res.end('{"error":"not found"}'); }
    const mod = await import(pathToFileURL(file).href);
    return mod.default(req, res);
  }
  let file = join(PUBLIC, normalize(path));
  if (!file.startsWith(PUBLIC)) { res.statusCode = 403; return res.end(); }
  if (path.endsWith('/')) file = join(file, 'index.html');
  else if (!extname(file) && (await isFile(file + '.html'))) file += '.html';   // cleanUrls, as on Vercel
  if (!(await isFile(file))) { res.statusCode = 404; return res.end('not found'); }
  res.setHeader('Content-Type', TYPES[extname(file)] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');
  res.end(await readFile(file));
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3000;
  server.listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}`));
}
