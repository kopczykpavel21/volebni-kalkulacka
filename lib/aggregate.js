// Turns stored rows into counts. Free text never leaves through this module.
const inc = (o, k) => { o[k] = (o[k] || 0) + 1; };

export function aggregate(calcRows, surveyRows) {
  const R = { calculator: { n: calcRows.length, answers: {}, important: {} }, survey: { n: surveyRows.length, answers: {}, background: {} } };
  for (const r of calcRows) {
    for (const [sid, a] of Object.entries(r.answers)) {
      inc(R.calculator.answers[sid] || (R.calculator.answers[sid] = {}), String(a.a));
      if (a.imp) inc(R.calculator.important, sid);
    }
  }
  for (const r of surveyRows) {
    for (const [qid, a] of Object.entries(r.answers)) {
      const e = R.survey.answers[qid] || (R.survey.answers[qid] = { n: 0, choice: {}, dir: {}, picks: {}, texts: 0 });
      e.n++;
      if (a.choice) inc(e.choice, a.choice);
      if (a.dir != null) inc(e.dir, String(a.dir));
      for (const p of a.picks || []) inc(e.picks, String(p));
      if (a.why || (a.texts || []).some(Boolean)) e.texts++;
    }
    for (const [k, v] of Object.entries(r.background || {})) inc(R.survey.background[k] || (R.survey.background[k] = {}), String(v));
  }
  return R;
}

// The latest submission of each respondent, so a repeat visit does not count twice.
export const LATEST_CALC = `SELECT DISTINCT ON (respondent_id) respondent_id, id, created_day, record_weight, answers
  FROM calculator_responses ORDER BY respondent_id, id DESC`;
export const LATEST_SURVEY = `SELECT DISTINCT ON (respondent_id) respondent_id, id, created_day, answers, background
  FROM survey_responses ORDER BY respondent_id, id DESC`;
