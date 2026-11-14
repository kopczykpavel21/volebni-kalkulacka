# Volební kalkulačka: prototype

Two linked questionnaires for Czech voters, with a live database.

1. **Calculator** (`/`): 25 statements matched against party positions, with a slider between
   what parties say and what they did.
2. **Survey** (`/pruzkum`): 25 questions on how the country should be governed.
3. **Results** (`/vysledky`): public totals from everyone who saved their answers.
4. **Admin** (`/admin`): every stored answer, linked by respondent, with CSV download. Needs a secret code.

Answers from the two questionnaires are stored in separate tables and connected by a random respondent id.

## Run locally

Requires Node 20+ and a Postgres database.

    npm install
    cp .env.example .env        # then fill in DATABASE_URL and ADMIN_TOKEN
    export $(grep -v '^#' .env | xargs)
    npm run dev                 # http://127.0.0.1:3000

The tables are created automatically on the first request.

## Test

    DATABASE_URL=postgresql://postgres@127.0.0.1:5432/vk_test npm test

The tests empty the tables. They refuse to run against anything but a local database.

## Deploy

See [docs/DEPLOY.md](docs/DEPLOY.md): Postgres on Railway, the site on Vercel, about 15 minutes.

## Read before making the site public

See [docs/BEFORE_GOING_PUBLIC.md](docs/BEFORE_GOING_PUBLIC.md). In short: the party positions are
placeholder data without a publishing licence, and storing political opinions has legal conditions.

## Layout

| Path | What it holds |
| --- | --- |
| `public/` | The site: five HTML pages, `js/`, `css/`, `data/` |
| `public/data/` | Statements, survey questions, party positions and records (JSON) |
| `api/` | Serverless functions: `calculator`, `survey`, `results`, `respondent`, `health`, `admin/responses` |
| `lib/` | Database access, validation, aggregation, schema |
| `db/views.sql` | Optional SQL views for analysis |
| `scripts/` | Local dev server, schema migration, party-data builder |
| `test/` | API tests against a real Postgres |
| `docs/` | Architecture, deployment, pre-launch checklist |
