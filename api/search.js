const people = require('./_lib/people');
const auth = require('./_lib/auth');
const engine = require('../public/js/engine.js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { query } = req.body || {};
  const selfUsername = auth.currentUsername(req);
  const all = await people.getAll();
  const matches = engine.search(all, query, selfUsername);
  res.json({ query: query || '', matches });
};
