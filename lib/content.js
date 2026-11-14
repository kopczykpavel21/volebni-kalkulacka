// Loads the questionnaire content that the validation and aggregation need.
// The paths are written out in full so Vercel's file tracing bundles the files.
import { readFileSync } from 'node:fs';

const read = url => JSON.parse(readFileSync(url, 'utf8'));
export const statements = read(new URL('../public/data/statements.json', import.meta.url));
export const survey = read(new URL('../public/data/survey.json', import.meta.url));
export const statementIds = new Set(statements.map(s => String(s.id)));
export const questions = new Map(survey.questions.map(q => [String(q.id), q]));
export const optionCount = q => (q.opts ? survey[q.opts].cs.length : q.cs.o.length);
