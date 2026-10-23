const people = require('../_lib/people');
const auth = require('../_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
  const target = req.query.username;
  const u = auth.currentUsername(req);
  if (!u) return res.status(401).json({ error: 'Not logged in' });
  if (u !== target) return res.status(403).json({ error: 'You can only edit your own profile.' });
  const updated = await people.updateProfile(target, req.body || {});
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({ person: updated });
};
