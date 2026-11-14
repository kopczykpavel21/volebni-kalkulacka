import { db } from '../lib/db.js';
import { handler, readJson, send } from '../lib/http.js';
import { cleanCalculator } from '../lib/validate.js';

export default handler(['POST'], async (req, res) => {
  const c = cleanCalculator(await readJson(req));
  const pool = await db();
  await pool.query('INSERT INTO respondents (id, lang) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING', [c.respondent, c.lang]);
  await pool.query('INSERT INTO calculator_responses (respondent_id, record_weight, answers) VALUES ($1, $2, $3)',
    [c.respondent, c.record_weight, JSON.stringify(c.answers)]);
  send(res, 200, { ok: true });
});
