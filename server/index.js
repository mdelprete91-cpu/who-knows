/**
 * Who Knows — server entry point.
 *
 * Serves the static frontend and the JSON API, then opens the app in your
 * browser. Start it with:  npm start
 */

const path = require('path');
const { exec } = require('child_process');
const express = require('express');

const authRoutes = require('./routes/auth.routes');
const peopleRoutes = require('./routes/people.routes');
const searchRoutes = require('./routes/search.routes');

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Lets the frontend detect that a live backend is present (shared persistence).
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/search', searchRoutes);

/** Open the default browser at the app URL (best effort, per-platform). */
function openBrowser(url) {
  const cmd =
    process.platform === 'darwin'
      ? `open "${url}"`
      : process.platform === 'win32'
      ? `start "" "${url}"`
      : `xdg-open "${url}"`;
  exec(cmd, (err) => {
    if (err) console.log(`Open your browser at ${url}`);
  });
}

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n  Who Knows is running at ${url}`);
  console.log('  Log in with firstname.lastname (e.g. anna.rossi) and password "test".\n');
  if (process.env.NO_OPEN !== '1') openBrowser(url);
});
