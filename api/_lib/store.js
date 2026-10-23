/**
 * Shared storage for the hosted (serverless) version, backed by Vercel Blob.
 *
 * We keep a single logical JSON document of profile overrides:
 *   { username: { whatIDo, whatIDont, skills, currentlyWorkingOn, happyToHelp } }
 * The base 35 people come from the bundled seed; this doc only stores edits and
 * is shared by everyone who uses the site.
 *
 * Vercel Blob is optimised for IMMUTABLE content — overwriting one fixed path
 * propagates with a delay, which would make edits appear "one write behind". So
 * each write creates a NEW immutable blob under overrides/, and reads pick the
 * newest one. New immutable blobs are instantly consistent, so edits are visible
 * to everyone right away. Older snapshots are cleaned up best-effort.
 *
 * Note: writes are read-modify-write (last write wins) — fine for a demo. Heavy
 * concurrent editing would want a transactional store (KV/Postgres).
 */

const { put, list, del } = require('@vercel/blob');

const PREFIX = 'overrides/';

function newest(blobs) {
  return blobs.reduce((a, b) => (new Date(b.uploadedAt) > new Date(a.uploadedAt) ? b : a));
}

async function readOverrides() {
  try {
    const { blobs } = await list({ prefix: PREFIX });
    if (!blobs.length) return {};
    const res = await fetch(newest(blobs).url, { cache: 'no-store' });
    if (!res.ok) return {};
    return await res.json();
  } catch (err) {
    console.error('readOverrides failed:', err);
    return {};
  }
}

async function writeOverrides(overrides) {
  const pathname = `${PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}.json`;
  await put(pathname, JSON.stringify(overrides), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
  // Best-effort: keep only the newest snapshot so the store doesn't grow.
  try {
    const { blobs } = await list({ prefix: PREFIX });
    const stale = blobs
      .filter((b) => b.pathname !== pathname)
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      .slice(1) // keep one previous as a safety net, delete the rest
      .map((b) => b.url);
    if (stale.length) await del(stale);
  } catch (err) {
    console.error('override cleanup failed:', err);
  }
}

module.exports = { readOverrides, writeOverrides };
