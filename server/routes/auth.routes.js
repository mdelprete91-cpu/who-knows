/** Auth endpoints: login, logout, and "who am I". */

const express = require('express');
const auth = require('../auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const result = auth.login(username, password);
  if (!result) {
    return res.status(401).json({ error: 'Wrong username or password. Use firstname.lastname and the password "test".' });
  }
  res.cookie
    ? res.cookie('whoknows_session', result.token, { httpOnly: true, sameSite: 'lax' })
    : res.setHeader('Set-Cookie', `whoknows_session=${result.token}; HttpOnly; SameSite=Lax; Path=/`);
  res.json({ user: result.user });
});

router.post('/logout', (req, res) => {
  auth.logout(auth.tokenFromRequest(req));
  res.setHeader('Set-Cookie', 'whoknows_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  const user = auth.currentUser(req);
  res.json({ user: user || null });
});

module.exports = router;
