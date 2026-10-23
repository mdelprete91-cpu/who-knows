# Who Knows

An internal tool for **Northwind Labs** (a fictional company). It shows the whole
company org chart and helps anyone find the right colleague for any topic, using a
plain-language search bar that highlights the best people to ask.

Everything runs **locally** — no accounts, no API keys, no cloud.

---

## Quick start

You need [Node.js](https://nodejs.org) 16 or newer.

```bash
cd who-knows
npm install
npm start
```

The app starts at **http://localhost:3000** and opens in your browser automatically.

**Log in** with any employee's username and the password `test`.

- Username = the part of the email before the `@` (i.e. `firstname.lastname`).
- Examples: `anna.rossi`, `elena.fontana`, `alice.monti`, `andrea.ferrara`.
- Password for everyone (demo only): `test`

---

## What you can do

- **Browse the org chart** — one card per person (photo placeholder, name, role,
  area, and a profile-completeness bar). Zoom with the mouse wheel or the + / −
  buttons, drag the background to pan, and click any card to open the full profile.
- **Search in plain language** — type something like
  *"I need help preparing a budget for a new partnership"*. The most relevant
  people light up on the chart (others fade), and a ranked list appears with a
  one-sentence reason for each match.
- **Enrich your own profile** — log in, open your own card, and click
  *Edit my profile*. You can fill in:
  1. What I do
  2. What I don't do
  3. Skills & topics I know well
  4. Currently working on
  5. Happy to help with

  Changes save immediately and are visible to everyone. You can only edit your own
  profile.

### How the search ranks people

- Matches your words against each person's skills, current work, "happy to help",
  and "what I do" (with smart matching, so *budget* also finds *budgeting*).
- People whose **"What I don't do"** matches your request are never highlighted.
- You are never suggested to yourself.
- **More complete profiles rank higher.**

> Note: the search is a local matching engine, not a cloud AI model — that keeps the
> app fully offline with no API keys. It behaves like a plain-language assistant.

---

## Replacing the demo data with a real HR export

The app ships with a fake HR export at `data/employees.csv` (35 people). On the
**first start**, it reads that file and creates `data/db.json`, which then becomes
the live store where all profile edits are saved.

To load your own people:

1. Export your employees into the same CSV format (same column headers):

   ```
   first_name,last_name,job_role,area,manager,location,email
   ```

   - `manager` is the manager's full name (`First Last`) exactly as it appears in
     their own row. Leave it blank for the top of the company (e.g. the CEO).
   - `email` must be unique; the login username is derived from it
     (`firstname.lastname`).
   - `area` can be anything; the five main areas are Product, Engineering, Design,
     Operations and Partnerships (the demo also uses "Executive" for the CEO).

2. Replace `data/employees.csv` with your file.

3. **Delete `data/db.json`** (this is what forces a fresh import).

4. Run `npm start` again. The new people load with empty profiles, ready to be
   filled in.

5. For the **hosted (static) version**, also run `npm run build:data` to
   regenerate `public/data/seed.json`, then redeploy.

---

## How it runs (same app, same UI, auto-detected backend)

On load the frontend probes `/api/health` and picks a backend automatically:

| Mode | When | Data source | Where edits are saved |
| --- | --- | --- | --- |
| **Local server** | `npm start` | `data/db.json` (built from the CSV) | Shared file — everyone on that server |
| **Hosted (serverless)** | Deployed on Vercel | bundled `public/data/seed.json` | **Shared** — a Vercel Blob store, visible to all visitors |
| **Static fallback** | Static hosting with no `/api` | `public/data/seed.json` | Each visitor's own browser (`localStorage`) |

The local server and the Vercel deployment both give **shared** persistence
(edits are visible to everyone). The static fallback is only used if the app is
served as plain files with no backend.

## Deploying a public link (Vercel)

The repo is already configured for Vercel:

- `public/` is served as the static site; `public/data/seed.json` is regenerated
  at build time (`vercel.json` → `npm run build:data`).
- `api/` holds serverless functions (auth, people, search) that read/write the
  shared profile data in a **Vercel Blob** store.

First-time setup:

```bash
npm i -g vercel                      # if you don't have the CLI
vercel link                          # link this folder to a Vercel project
vercel blob create-store who-knows   # create a Blob store and link it (adds BLOB_READ_WRITE_TOKEN)
vercel --prod                        # deploy; prints the public URL
```

After the project is connected to the GitHub repo in the Vercel dashboard, every
push to `main` deploys automatically. The serverless functions read
`BLOB_READ_WRITE_TOKEN` from the project's environment variables (set when the
Blob store is linked).

> Shared edits use a single JSON snapshot in Blob with last-write-wins. That's
> ideal for a demo; for heavy concurrent editing you'd switch the `api/_lib/store.js`
> adapter to a transactional store (Vercel KV or Postgres) — the rest is unchanged.

## Project structure

```
who-knows/
├── data/
│   ├── employees.csv        # seed HR export (replace with a real one)
│   └── db.json              # live store, generated on first start (git-ignored)
├── scripts/
│   └── build-data.js        # CSV -> public/data/seed.json (for static mode)
├── server/
│   ├── index.js             # Express server + opens the browser
│   ├── db.js                # CSV import, live store, completeness
│   ├── csv.js               # shared CSV parsing
│   ├── seed.js              # demo profile enrichment
│   ├── auth.js              # demo login + sessions
│   ├── search.js            # re-exports the shared engine
│   └── routes/              # auth / people / search endpoints
├── api/                     # Vercel serverless functions (hosted backend)
│   ├── health.js            # backend probe
│   ├── search.js
│   ├── auth/                # login / logout / me
│   ├── people/              # list + update-own-profile
│   └── _lib/                # store (Vercel Blob), people merge, auth
├── public/
│   ├── index.html
│   ├── css/styles.css
│   ├── data/seed.json       # bundled data (shared by all three modes)
│   └── js/                  # engine, api, auth, orgchart, profile, search, app
├── vercel.json              # Vercel build + static output config
└── package.json
```

---

## Resetting the demo

To wipe all profile edits and start from the seed again, delete `data/db.json`
and restart (`npm start`).
