const people = require('../_lib/people');
const auth = require('../_lib/auth');

module.exports = async (req, res) => {
  const u = auth.currentUsername(req);
  const user = u ? await people.getByUsername(u) : null;
  res.json({ user });
};
