import { db } from '../lib/db.js';
import { handler, readJson, send } from '../lib/http.js';
import { cleanSurvey } from '../lib/validate.js';

export default handler(['POST'], async (req, res) => {
  const c = cleanSurvey(await readJson(req));
  const pool = await db();
  await pool.query('INSERT INTO respondents (id, lang) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING', [c.respondent, c.lang]);
  await pool.query('INSERT INTO survey_responses (respondent_id, answers, background) VALUES ($1, $2, $3)',
    [c.respondent, JSON.stringify(c.answers), JSON.stringify(c.background)]);
  send(res, 200, { ok: true });
});
