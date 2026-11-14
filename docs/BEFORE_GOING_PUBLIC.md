# Before making the site public

The code runs. These points are about data and law, and code cannot settle them.

## 1. Party positions are placeholder data

- 22 of 25 statements use the parties' answers to the 2025 Volební kalkulačka questionnaire
  (KohoVolit.eu). That data carries no licence for republication. Either get written permission
  (ahoj@volebnikalkulacka.cz) or replace it with independent coding from programmes and votes.
- Editors, not the parties, filled in ANO and Stačilo! in that source.
- Only 8 lists are covered. SPOLU is one list; SOCDEM and Zelení are missing.
- Only 19 positions have a documented "acted" record, so the slider moves little yet.

## 2. Political opinions are sensitive personal data

Answers reveal political opinions, a special category under the GDPR. The design keeps them
pseudonymous (random id, no IP address, no e-mail), which reduces risk but does not remove the duty to:

- name who runs the site and how to contact them: a draft notice is at `/soukromi`; fill in
  `CONTROLLER` at the top of `public/js/privacy.js` and have the text reviewed;
- keep the database in an EU region on Railway, so answers do not leave the EU;
- collect explicit consent (the checkbox does this) and allow deletion (the "Smazat" button does this);
- get ethics approval if the data is used for university research;
- have a data protection officer or lawyer confirm the setup.

Free-text answers can contain names or insults. They are shown only on the admin page; read them
before quoting any.

## 3. Election rules

A tool that compares parties, and shows what they did against what they said, may count as
campaigning under Czech election law during a campaign period. Ask a lawyer before an election.

## 4. Abuse

There is no rate limiting or bot protection. Anyone can submit many times with new ids.
Before a public launch add a rate limit or a challenge, and watch the totals for sudden jumps.

## 5. Facts go out of date

The "More information" notes and the party records were checked on 14 November 2026.
