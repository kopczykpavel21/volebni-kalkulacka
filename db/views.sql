-- Optional views for analysis. Run once in the Railway "Data" tab or with psql.
-- They flatten the JSON answers into one row per respondent and item.

CREATE OR REPLACE VIEW latest_calculator AS
SELECT DISTINCT ON (respondent_id) * FROM calculator_responses ORDER BY respondent_id, id DESC;

CREATE OR REPLACE VIEW latest_survey AS
SELECT DISTINCT ON (respondent_id) * FROM survey_responses ORDER BY respondent_id, id DESC;

-- One row per respondent and statement: answer from -2 (strongly disagree) to 2 (strongly agree).
CREATE OR REPLACE VIEW calculator_answers AS
SELECT c.respondent_id, c.created_day, c.record_weight,
       (e.key)::int AS statement_id, (e.value->>'a')::int AS answer, (e.value->>'imp')::boolean AS important
FROM latest_calculator c, jsonb_each(c.answers) AS e;

-- One row per respondent and survey question.
CREATE OR REPLACE VIEW survey_answers AS
SELECT s.respondent_id, s.created_day, (e.key)::int AS question_id,
       e.value->>'choice' AS choice, (e.value->>'dir')::int AS direction,
       e.value->'picks' AS picks, e.value->>'why' AS why, e.value->'texts' AS texts
FROM latest_survey s, jsonb_each(s.answers) AS e;

-- Both questionnaires side by side for respondents who answered both.
CREATE OR REPLACE VIEW linked_answers AS
SELECT ca.respondent_id, ca.statement_id, ca.answer, sa.question_id, sa.choice, sa.direction
FROM calculator_answers ca JOIN survey_answers sa USING (respondent_id);
