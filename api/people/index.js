const people = require('../_lib/people');

module.exports = async (req, res) => {
  res.json({ people: await people.getAll() });
};
