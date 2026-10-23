/**
 * People for the hosted version: the bundled seed (35 people, with the demo
 * enrichment baked in) merged with the shared overrides from Vercel Blob.
 * Completeness is always recomputed so it's never stale.
 */

const engine = require('../../public/js/engine.js');
const seed = require('../../public/data/seed.json');
const store = require('./store');

const ENRICHMENT_FIELDS = engine.ENRICHMENT_FIELDS;

async function getAll() {
  const overrides = await store.readOverrides();
  return seed.people.map((p) => {
    const merged = { ...p, ...(overrides[p.username] || {}) };
    merged.completeness = engine.completeness(merged);
    return merged;
  });
}

async function getByUsername(username) {
  return (await getAll()).find((p) => p.username === username) || null;
}

async function updateProfile(username, updates) {
  if (!seed.people.some((p) => p.username === username)) return null;
  const overrides = await store.readOverrides();
  const cur = overrides[username] || {};
  ENRICHMENT_FIELDS.forEach((f) => {
    if (typeof updates[f] === 'string') cur[f] = updates[f].trim();
  });
  overrides[username] = cur;
  await store.writeOverrides(overrides);
  return getByUsername(username);
}

module.exports = { getAll, getByUsername, updateProfile, ENRICHMENT_FIELDS };
