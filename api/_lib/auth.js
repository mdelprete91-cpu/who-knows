/**
 * Demo auth for the hosted version. Stateless (no server-side sessions): the
 * session cookie is the username plus a short HMAC so it can't be trivially
 * forged. This is still demo-grade security only — it just gates "edit your own
 * profile", exactly like the local version.
 */

const crypto = require('crypto');

const SECRET = process.env.SESSION_SECRET || 'whoknows-demo-secret';
const COOKIE = 'whoknows_session';

function hmac(username) {
  return crypto.createHmac('sha256', SECRET).update(username).digest('hex').slice(0, 24);
}

function makeToken(username) {
  return `${username}.${hmac(username)}`;
}

function usernameFromToken(token) {
  if (!token) return null;
  const i = token.lastIndexOf('.');
  if (i < 0) return null;
  const username = token.slice(0, i);
  const sig = token.slice(i + 1);
  return hmac(username) === sig ? username : null;
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function currentUsername(req) {
  const token = (req.cookies && req.cookies[COOKIE]) || parseCookies(req)[COOKIE];
  return usernameFromToken(token);
}

function setSessionCookie(res, username) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE}=${encodeURIComponent(makeToken(username))}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`
  );
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

module.exports = { currentUsername, setSessionCookie, clearSessionCookie };
