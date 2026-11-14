import { db } from '../lib/db.js';
import { handler, send } from '../lib/http.js';

export default handler(['GET'], async (req, res) => {
  const pool = await db();
  const r = await pool.query('SELECT (SELECT count(*) FROM respondents)::int AS respondents');
  send(res, 200, { ok: true, respondents: r.rows[0].respondents });
});
