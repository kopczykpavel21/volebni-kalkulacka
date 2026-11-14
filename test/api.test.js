// End-to-end API tests against a real Postgres. Usage:
//   DATABASE_URL=postgresql://postgres@127.0.0.1:5433/vk npm test
// The tests delete all rows in the three tables: never point them at the live database.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

if (!process.env.DATABASE_URL || !/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL)) {
  console.log('skipped: set DATABASE_URL to a LOCAL test database'); process.exit(0);
}
process.env.ADMIN_TOKEN = 'test-token-0123456789abcdef';
process.env.MIN_PUBLIC_N = '3';
const { server } = await import('../scripts/dev-server.js');
const { db, closeDb } = await import('../lib/db.js');
let base;
const call = async (path, opt = {}) => {
  const r = await fetch(base + path, { ...opt, headers: { 'Content-Type': 'application/json', ...(opt.headers || {}) }, body: opt.body ? JSON.stringify(opt.body) : undefined });
  return { status: r.status, body: await r.json().catch(() => null) };
};
before(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = 'http://127.0.0.1:' + server.address().port;
  await (await db()).query('TRUNCATE respondents CASCADE');
});
after(async () => { server.close(); await closeDb(); });

const calc = (respondent, a = 2) => ({ consent: true, respondent, lang: 'cs', record_weight: 70, answers: { 1: { a, imp: true }, 2: { a: -1 }, 99: { a: 1 }, 3: { a: 7 } } });
const surv = respondent => ({ consent: true, respondent, answers: { 1: { choice: 'change', dir: 1, why: '<b>x</b>' }, 2: { choice: 'keep', dir: 2 }, 13: { picks: [0, 1, 2, 3, 99] }, 24: { picks: [2, 1] }, 25: { texts: ['a', 'b', 'c'] }, 77: { choice: 'keep' } }, background: { age: 1, region: 99 } });

test('rejects missing consent, bad id, empty answers, wrong method', async () => {
  assert.equal((await call('/api/calculator', { method: 'POST', body: { respondent: randomUUID(), answers: { 1: { a: 1 } } } })).status, 400);
  assert.equal((await call('/api/calculator', { method: 'POST', body: { consent: true, respondent: 'abc', answers: { 1: { a: 1 } } } })).status, 400);
  assert.equal((await call('/api/survey', { method: 'POST', body: { consent: true, respondent: randomUUID(), answers: { 1: { choice: 'bogus' } } } })).status, 400);
  assert.equal((await call('/api/calculator')).status, 405);
  assert.equal((await call('/api/calculator', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: undefined })).status, 400);
});

test('stores both questionnaires, linked by respondent, and cleans the input', async () => {
  const ids = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
  for (const id of ids) assert.equal((await call('/api/calculator', { method: 'POST', body: calc(id) })).status, 200);
  assert.equal((await call('/api/calculator', { method: 'POST', body: calc(ids[0], -2) })).status, 200);   // repeat visit
  for (const id of ids.slice(0, 3)) assert.equal((await call('/api/survey', { method: 'POST', body: surv(id) })).status, 200);
  const only = randomUUID();
  assert.equal((await call('/api/survey', { method: 'POST', body: surv(only) })).status, 200);            // survey without calculator

  const pool = await db();
  const row = (await pool.query('SELECT answers, record_weight FROM calculator_responses WHERE respondent_id=$1 ORDER BY id LIMIT 1', [ids[1]])).rows[0];
  assert.deepEqual(row.answers, { 1: { a: 2, imp: true }, 2: { a: -1, imp: false } });
  assert.equal(row.record_weight, 70);
  const s = (await pool.query('SELECT answers, background FROM survey_responses WHERE respondent_id=$1', [ids[1]])).rows[0];
  assert.deepEqual(s.answers, { 1: { choice: 'change', dir: 1, why: '<b>x</b>' }, 2: { choice: 'keep' }, 13: { picks: [0, 1, 2] }, 24: { picks: [2] }, 25: { texts: ['a', 'b'] } });
  assert.deepEqual(s.background, { age: 1 });

  const r = (await call('/api/results')).body;
  assert.equal(r.calculator.n, 4);            // repeat visit counted once
  assert.equal(r.survey.n, 4);
  assert.equal(r.linked, 3);
  assert.deepEqual(r.calculator.answers['1'], { '2': 3, '-2': 1 });
  assert.equal(r.survey.answers['1'].choice.change, 4);
  assert.equal(r.survey.answers['1'].texts, 4);
  assert.ok(!JSON.stringify(r).includes('<b>x</b>'), 'free text must not be public');
});

test('admin endpoint needs the token and returns everything, linked', async () => {
  assert.equal((await call('/api/admin/responses')).status, 401);
  assert.equal((await call('/api/admin/responses', { headers: { Authorization: 'Bearer wrong-token-0123456789abcd' } })).status, 401);
  const r = await call('/api/admin/responses', { headers: { Authorization: 'Bearer ' + process.env.ADMIN_TOKEN } });
  assert.equal(r.status, 200);
  assert.equal(r.body.respondents.length, 5);
  const two = r.body.respondents.find(x => x.calculator.length === 2);
  assert.equal(two.survey.length, 1);
  assert.equal(two.survey[0].answers['1'].why, '<b>x</b>');
  assert.match(two.day, /^\d{4}-\d{2}-\d{2}$/);
});

test('results stay hidden below the minimum, and a respondent can delete their data', async () => {
  const pool = await db();
  const ids = (await pool.query('SELECT id FROM respondents')).rows.map(r => r.id);
  for (const id of ids.slice(0, 3)) assert.equal((await call('/api/respondent?id=' + id, { method: 'DELETE' })).body.deleted, 1);
  assert.equal((await call('/api/respondent?id=nope', { method: 'DELETE' })).status, 400);
  const r = (await call('/api/results')).body;
  assert.equal(r.calculator.answers, undefined);
  assert.ok(r.calculator.n < 3);
  assert.equal((await pool.query('SELECT count(*)::int AS n FROM calculator_responses')).rows[0].n + (await pool.query('SELECT count(*)::int AS n FROM survey_responses')).rows[0].n < 6, true);
});

test('analysis views work on real Postgres', async () => {
  const { readFileSync } = await import('node:fs');
  const pool = await db();
  await pool.query(readFileSync(new URL('../db/views.sql', import.meta.url), 'utf8'));
  const id = randomUUID();
  await call('/api/calculator', { method: 'POST', body: calc(id) });
  await call('/api/survey', { method: 'POST', body: surv(id) });
  const a = (await pool.query('SELECT statement_id, answer, important FROM calculator_answers WHERE respondent_id=$1 ORDER BY 1', [id])).rows;
  assert.deepEqual(a, [{ statement_id: 1, answer: 2, important: true }, { statement_id: 2, answer: -1, important: false }]);
  const l = (await pool.query('SELECT count(*)::int AS n FROM linked_answers WHERE respondent_id=$1', [id])).rows[0].n;
  assert.equal(l, 2 * 5);
});

test('static pages and health', async () => {
  for (const p of ['/', '/pruzkum', '/vysledky', '/metoda', '/admin', '/data/parties.json', '/js/common.js']) assert.equal((await fetch(base + p)).status, 200, p);
  assert.equal((await fetch(base + '/../package.json')).status, 404);
  assert.equal((await fetch(base + '/api/../lib/db')).status, 404);
  assert.equal((await call('/api/health')).body.ok, true);
});
