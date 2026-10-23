/**
 * Data layer for Who Knows.
 *
 * - On first start, parses data/employees.csv (the HR export) and writes
 *   data/db.json, which becomes the live store that all edits are saved to.
 * - To load a real export later: replace employees.csv, delete db.json, restart.
 */

const fs = require('fs');
const path = require('path');
const { ENRICHMENT } = require('./seed');
const engine = require('../public/js/engine.js');
const { parseCSV, rowToPerson, usernameFromEmail } = require('./csv');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CSV_PATH = path.join(DATA_DIR, 'employees.csv');
const DB_PATH = path.join(DATA_DIR, 'db.json');

// The five fields each person can fill in to enrich their profile
// (defined once in the shared engine).
const ENRICHMENT_FIELDS = engine.ENRICHMENT_FIELDS;

/** Build the live store from the CSV, applying the demo enrichment seed. */
function buildFromCsv() {
  const text = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parseCSV(text);
  const people = rows.map((r) => rowToPerson(r, ENRICHMENT[usernameFromEmail(r.email)] || {}));
  const db = { people };
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  return db;
}

/** Load the live store, building it from the CSV on first start. */
function load() {
  if (!fs.existsSync(DB_PATH)) {
    return buildFromCsv();
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

let db = load();

function save() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

/** Profile completeness as a 0–100 percentage (shared with the engine). */
const completeness = engine.completeness;

/** Attach the computed completeness so it's never stale. */
function withCompleteness(person) {
  return { ...person, completeness: completeness(person) };
}

function getAll() {
  return db.people.map(withCompleteness);
}

function getByUsername(username) {
  const p = db.people.find((x) => x.username === username);
  return p ? withCompleteness(p) : null;
}

/** Update only the enrichment fields of a given person. */
function updateProfile(username, updates) {
  const person = db.people.find((x) => x.username === username);
  if (!person) return null;
  ENRICHMENT_FIELDS.forEach((f) => {
    if (typeof updates[f] === 'string') {
      person[f] = updates[f].trim();
    }
  });
  save();
  return withCompleteness(person);
}

module.exports = {
  ENRICHMENT_FIELDS,
  getAll,
  getByUsername,
  updateProfile,
  completeness,
};
