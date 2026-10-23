const auth = require('../_lib/auth');

module.exports = (req, res) => {
  auth.clearSessionCookie(res);
  res.json({ ok: true });
};
