/*
 * Data layer with two interchangeable backends:
 *
 *   - SERVER mode: talks to the Express API (local `npm start`). Profile edits
 *     are saved to data/db.json and shared by everyone who uses that server.
 *   - STATIC mode: no backend (e.g. the site hosted on Vercel). Data is loaded
 *     from the bundled public/data/seed.json, and each visitor's profile edits
 *     are saved in their own browser via localStorage.
 *
 * On load we probe /api/health to decide which mode we're in. The rest of the
 * app only uses window.api.* and doesn't care which backend is active.
 *
 * `window.api.ready` resolves once a mode has been chosen — app.js awaits it.
 */

// ---------- SERVER mode (Express backend) ----------
const SERVER = (() => {
  async function request(url, options = {}) {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }
  return {
    mode: 'server',
    me: () => request('/api/auth/me'),
    login: (username, password) =>
      request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
    logout: () => request('/api/auth/logout', { method: 'POST' }),
    getPeople: () => request('/api/people'),
    updateProfile: (username, fields) =>
      request(`/api/people/${encodeURIComponent(username)}`, {
        method: 'PUT',
        body: JSON.stringify(fields),
      }),
    search: (query) =>
      request('/api/search', { method: 'POST', body: JSON.stringify({ query }) }),
  };
})();

// ---------- STATIC mode (no backend) ----------
const STATIC = (() => {
  const LS_PROFILES = 'whoknows.profiles'; // { username: {field: value} }
  const SS_USER = 'whoknows.user';         // current username
  const FIELDS = window.Engine.ENRICHMENT_FIELDS;

  let base = [];

  const loadOverrides = () => {
    try { return JSON.parse(localStorage.getItem(LS_PROFILES) || '{}'); } catch (_) { return {}; }
  };
  const saveOverrides = (o) => {
    try { localStorage.setItem(LS_PROFILES, JSON.stringify(o)); } catch (_) {}
  };
  const currentUsername = () => {
    try { return sessionStorage.getItem(SS_USER); } catch (_) { return null; }
  };

  // Base people + this browser's edits, with completeness computed fresh.
  const merged = () => {
    const ov = loadOverrides();
    return base.map((p) => {
      const m = { ...p, ...(ov[p.username] || {}) };
      m.completeness = window.Engine.completeness(m);
      return m;
    });
  };

  async function init() {
    const res = await fetch('data/seed.json', { cache: 'no-store' });
    const data = await res.json();
    base = data.people || [];
  }

  return {
    mode: 'static',
    init,
    me: async () => {
      const u = currentUsername();
      return { user: u ? (merged().find((p) => p.username === u) || null) : null };
    },
    login: async (username, password) => {
      const u = String(username || '').toLowerCase().trim();
      const person = merged().find((p) => p.username === u);
      if (!person || password !== 'test') {
        throw new Error('Wrong username or password. Use firstname.lastname and the password "test".');
      }
      try { sessionStorage.setItem(SS_USER, u); } catch (_) {}
      return { user: person };
    },
    logout: async () => {
      try { sessionStorage.removeItem(SS_USER); } catch (_) {}
      return { ok: true };
    },
    getPeople: async () => ({ people: merged() }),
    updateProfile: async (username, fields) => {
      if (currentUsername() !== username) throw new Error('You can only edit your own profile.');
      const ov = loadOverrides();
      const cur = ov[username] || {};
      FIELDS.forEach((f) => { if (typeof fields[f] === 'string') cur[f] = fields[f].trim(); });
      ov[username] = cur;
      saveOverrides(ov);
      return { person: merged().find((p) => p.username === username) };
    },
    search: async (query) => ({
      query: query || '',
      matches: window.Engine.search(merged(), query, currentUsername()),
    }),
  };
})();

// ---------- Mode selection ----------
window.api = {};
function bindApi(impl) { Object.assign(window.api, impl); }

window.api.ready = (async function chooseMode() {
  try {
    const res = await fetch('/api/health', { cache: 'no-store' });
    if (res.ok) {
      const j = await res.json().catch(() => ({}));
      if (j && j.ok) { bindApi(SERVER); return 'server'; }
    }
  } catch (_) { /* no backend reachable */ }
  await STATIC.init();
  bindApi(STATIC);
  return 'static';
})();
