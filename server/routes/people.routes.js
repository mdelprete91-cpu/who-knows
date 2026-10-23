/** People endpoints: list everyone, and update your OWN profile only. */

const express = require('express');
const db = require('../db');
const auth = require('../auth');

const router = express.Router();

// Anyone can see the whole directory (that's the point of the tool).
router.get('/', (req, res) => {
  res.json({ people: db.getAll() });
});

router.get('/:username', (req, res) => {
  const person = db.getByUsername(req.params.username);
  if (!person) return res.status(404).json({ error: 'Not found' });
  res.json({ person });
});

// You may only edit your own profile.
router.put('/:username', auth.requireAuth, (req, res) => {
  if (req.user.username !== req.params.username) {
    return res.status(403).json({ error: 'You can only edit your own profile.' });
  }
  const updated = db.updateProfile(req.params.username, req.body || {});
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({ person: updated });
});

module.exports = router;
