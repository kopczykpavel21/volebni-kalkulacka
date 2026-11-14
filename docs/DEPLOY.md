# Deploying: Railway (database) and Vercel (site)

The menu names below are from memory and the dashboards change; the steps themselves are stable.

## 1. Database on Railway

1. Sign in at railway.app and create a **New Project**.
2. Add a **PostgreSQL** database to it.
3. Open the Postgres service, then its **Variables** tab.
4. Copy the value of `DATABASE_PUBLIC_URL`. It starts with `postgresql://`.
   Use the public URL, not the internal one: Vercel runs outside Railway's network.

You do not need to create tables. The site creates them on its first request.

## 2. Site on Vercel

1. Sign in at vercel.com, choose **Add New → Project**, and import this GitHub repository.
2. Framework preset: **Other**. Leave the build command empty.
3. Add three **Environment Variables**:

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | the Railway URL from step 1 |
   | `ADMIN_TOKEN` | a long random secret (see `.env.example` for a command that makes one) |
   | `MIN_PUBLIC_N` | Optional. Default `1` (results show at once). Set `5` or more before going public |

4. Press **Deploy**.

## 3. Check it

1. Open `https://<your-project>.vercel.app/api/health`. It should show `{"ok":true,"respondents":0}`.
2. Fill in the calculator and choose "Zobrazit výsledek a uložit odpovědi".
3. Open `/admin`, enter your `ADMIN_TOKEN`, and confirm the answer is there.
4. In Railway, open the Postgres **Data** tab: the three tables should exist.

If `/api/health` shows `server error`, open the function log in Vercel. The usual causes are a
wrong `DATABASE_URL` or the internal Railway URL used by mistake.

## 4. Optional: analysis views

Paste `db/views.sql` into the Railway query window, or run:

    DATABASE_URL=<railway url> npm run db:schema -- --views

## Keeping the test site private

Until the points in `BEFORE_GOING_PUBLIC.md` are settled, do not share the address widely.
Vercel's project settings include **Deployment Protection**, which can require a login to view the site.
