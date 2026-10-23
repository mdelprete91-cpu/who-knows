const people = require('../_lib/people');
const auth = require('../_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { username, password } = req.body || {};
  const u = String(username || '').toLowerCase().trim();
  const person = await people.getByUsername(u);
  if (!person || password !== 'test') {
    return res.status(401).json({ error: 'Wrong username or password. Use firstname.lastname and the password "test".' });
  }
  auth.setSessionCookie(res, u);
  res.json({ user: person });
};
