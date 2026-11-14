// Every stored answer, linked by respondent. Requires "Authorization: Bearer <ADMIN_TOKEN>".
import { db } from '../../lib/db.js';
import { handler, send, isAdmin, fail } from '../../lib/http.js';

export default handler(['GET'], async (req, res) => {
  if (!isAdmin(req)) throw fail(401, 'unauthorized');
  const pool = await db();
  const [resp, calc, surv] = await Promise.all([
    pool.query("SELECT id, to_char(created_day, 'YYYY-MM-DD') AS day, lang FROM respondents ORDER BY created_day, id"),
    pool.query("SELECT id, respondent_id, to_char(created_day, 'YYYY-MM-DD') AS day, record_weight, answers FROM calculator_responses ORDER BY id"),
    pool.query("SELECT id, respondent_id, to_char(created_day, 'YYYY-MM-DD') AS day, answers, background FROM survey_responses ORDER BY id")
  ]);
  const by = new Map(resp.rows.map(r => [r.id, { ...r, calculator: [], survey: [] }]));
  for (const r of calc.rows) by.get(r.respondent_id)?.calculator.push({ id: Number(r.id), day: r.day, record_weight: r.record_weight, answers: r.answers });
  for (const r of surv.rows) by.get(r.respondent_id)?.survey.push({ id: Number(r.id), day: r.day, answers: r.answers, background: r.background });
  send(res, 200, { respondents: [...by.values()] });
});
