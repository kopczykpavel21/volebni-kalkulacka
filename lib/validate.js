// Keeps only expected fields and bounded values. Nothing else reaches the database.
import { statementIds, questions, optionCount, survey } from './content.js';
import { fail } from './http.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_TEXT = 300;
const text = v => (typeof v === 'string' ? v.trim().slice(0, MAX_TEXT) : '');
export const isUuid = v => typeof v === 'string' && UUID.test(v);

function base(p) {
  if (!p || typeof p !== 'object' || p.consent !== true) throw fail(400, 'consent required');
  if (!isUuid(p.respondent)) throw fail(400, 'invalid respondent id');
  return { respondent: p.respondent.toLowerCase(), lang: p.lang === 'en' ? 'en' : 'cs' };
}

export function cleanCalculator(p) {
  const out = { ...base(p), answers: {}, record_weight: 50 };
  for (const [sid, a] of Object.entries(p.answers || {})) {
    if (statementIds.has(String(sid)) && a && [-2, -1, 0, 1, 2].includes(a.a)) {
      out.answers[String(sid)] = { a: a.a, imp: a.imp === true };
    }
  }
  if (!Object.keys(out.answers).length) throw fail(400, 'no answers');
  if (Number.isInteger(p.record_weight) && p.record_weight >= 0 && p.record_weight <= 100) out.record_weight = p.record_weight;
  return out;
}

export function cleanSurvey(p) {
  const out = { ...base(p), answers: {}, background: {} };
  for (const [qid, a] of Object.entries(p.answers || {})) {
    const q = questions.get(String(qid));
    if (!q || !a || typeof a !== 'object') continue;
    const r = {};
    if (q.type === 'kc') {
      if (!['keep', 'change', 'unsure'].includes(a.choice)) continue;
      r.choice = a.choice;
      if (a.choice === 'change' && Number.isInteger(a.dir) && a.dir >= 0 && a.dir < optionCount(q)) r.dir = a.dir;
      if (text(a.why)) r.why = text(a.why);
    } else if (q.type === 'pick' || q.type === 'single') {
      const n = optionCount(q);
      const picks = [...new Set((Array.isArray(a.picks) ? a.picks : []).filter(x => Number.isInteger(x) && x >= 0 && x < n))].slice(0, q.max || 1);
      if (!picks.length) continue;
      r.picks = picks;
    } else if (q.type === 'open') {
      const texts = (Array.isArray(a.texts) ? a.texts : []).slice(0, 2).map(text);
      if (!texts.some(Boolean)) continue;
      r.texts = texts;
    }
    out.answers[String(q.id)] = r;
  }
  for (const b of survey.background) {
    const v = (p.background || {})[b.id];
    if (Number.isInteger(v) && v >= 0 && v < b.cs.o.length) out.background[b.id] = v;
  }
  if (!Object.keys(out.answers).length) throw fail(400, 'no answers');
  return out;
}
