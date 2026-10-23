/** Search endpoint: rank colleagues for a plain-language query. */

const express = require('express');
const db = require('../db');
const auth = require('../auth');
const { search } = require('../search');

const router = express.Router();

router.post('/', (req, res) => {
  const { query } = req.body || {};
  const me = auth.currentUser(req);
  const selfUsername = me ? me.username : null;
  const matches = search(db.getAll(), query, selfUsername);
  res.json({ query: query || '', matches });
});

module.exports = router;
