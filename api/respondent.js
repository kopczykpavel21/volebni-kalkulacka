// Lets a respondent delete everything stored under their random id.
import { db } from '../lib/db.js';
import { handler, send, query, fail } from '../lib/http.js';
import { isUuid } from '../lib/validate.js';

export default handler(['DELETE'], async (req, res) => {
  const id = query(req).get('id');
  if (!isUuid(id)) throw fail(400, 'invalid respondent id');
  const pool = await db();
  const r = await pool.query('DELETE FROM respondents WHERE id = $1', [id.toLowerCase()]);
  send(res, 200, { ok: true, deleted: r.rowCount });
});
