// Public, aggregated results. No free text and nothing below the minimum group size.
import { db } from '../lib/db.js';
import { handler, send } from '../lib/http.js';
import { aggregate, LATEST_CALC, LATEST_SURVEY } from '../lib/aggregate.js';

export default handler(['GET'], async (req, res) => {
  const pool = await db();
  const [calc, surv] = await Promise.all([pool.query(LATEST_CALC), pool.query(LATEST_SURVEY)]);
  const min = Math.max(1, parseInt(process.env.MIN_PUBLIC_N || '5', 10) || 5);
  const both = new Set(calc.rows.map(r => r.respondent_id));
  const linked = surv.rows.filter(r => both.has(r.respondent_id)).length;
  const R = aggregate(calc.rows, surv.rows);
  const out = { min, linked, calculator: { n: R.calculator.n }, survey: { n: R.survey.n } };
  if (R.calculator.n >= min) out.calculator = R.calculator;
  if (R.survey.n >= min) out.survey = R.survey;
  send(res, 200, out);
});
