// The whole database schema. Safe to run repeatedly.
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS respondents (
  id           uuid PRIMARY KEY,
  created_day  date NOT NULL DEFAULT CURRENT_DATE,
  lang         text NOT NULL DEFAULT 'cs'
);
CREATE TABLE IF NOT EXISTS calculator_responses (
  id             bigserial PRIMARY KEY,
  respondent_id  uuid NOT NULL REFERENCES respondents(id) ON DELETE CASCADE,
  created_day    date NOT NULL DEFAULT CURRENT_DATE,
  record_weight  smallint NOT NULL DEFAULT 50,
  answers        jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS survey_responses (
  id             bigserial PRIMARY KEY,
  respondent_id  uuid NOT NULL REFERENCES respondents(id) ON DELETE CASCADE,
  created_day    date NOT NULL DEFAULT CURRENT_DATE,
  answers        jsonb NOT NULL,
  background     jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS calculator_responses_respondent ON calculator_responses (respondent_id, id DESC);
CREATE INDEX IF NOT EXISTS survey_responses_respondent ON survey_responses (respondent_id, id DESC);
`;
