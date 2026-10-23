/**
 * Demo-only authentication.
 *
 * Everyone logs in with username = firstname.lastname (the part of their email
 * before "@", e.g. anna.rossi) and the password "test". This is intentionally
 * NOT real security — it only exists so each person can edit their own profile.
 */

const crypto = require('crypto');
const db = require('./db');

const DEMO_PASSWORD = 'test';

// In-memory token -> username map. Cleared on restart (fine for a demo).
const sessions = new Map();

/** Parse the "whoknows_session" cookie from a raw Cookie header. */
function tokenFromRequest(req) {
  const header = req.headers.cookie || '';
  const match = header.split(';').map((c) => c.trim()).find((c) => c.startsWith('whoknows_session='));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

function login(username, password) {
  const user = db.getByUsername(String(username || '').toLowerCase().trim());
  if (!user || password !== DEMO_PASSWORD) return null;
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, user.username);
  return { token, user };
}

function logout(token) {
  if (token) sessions.delete(token);
}

/** Returns the logged-in person (with computed completeness) or null. */
function currentUser(req) {
  const token = tokenFromRequest(req);
  if (!token) return null;
  const username = sessions.get(token);
  return username ? db.getByUsername(username) : null;
}

/** Express middleware that rejects unauthenticated requests. */
function requireAuth(req, res, next) {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: 'Not logged in' });
  req.user = user;
  next();
}

module.exports = { login, logout, currentUser, requireAuth, tokenFromRequest };
