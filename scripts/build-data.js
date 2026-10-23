/**
 * Builds public/data/seed.json from data/employees.csv + the demo enrichment.
 *
 * This bundled JSON is what the app loads when it runs as a static site (e.g.
 * on Vercel), where there is no backend. Run it after changing employees.csv:
 *
 *   npm run build:data
 */

const fs = require('fs');
const path = require('path');
const { parseCSV, rowToPerson, usernameFromEmail } = require('../server/csv');
const { ENRICHMENT } = require('../server/seed');

const CSV_PATH = path.join(__dirname, '..', 'data', 'employees.csv');
const OUT_DIR = path.join(__dirname, '..', 'public', 'data');
const OUT_PATH = path.join(OUT_DIR, 'seed.json');

const text = fs.readFileSync(CSV_PATH, 'utf8');
const rows = parseCSV(text);
const people = rows.map((r) => rowToPerson(r, ENRICHMENT[usernameFromEmail(r.email)] || {}));

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify({ people }, null, 2), 'utf8');

console.log(`Wrote ${people.length} people to public/data/seed.json`);
