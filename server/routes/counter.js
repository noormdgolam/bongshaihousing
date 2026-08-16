const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const COUNTER_FILE = path.join(__dirname, '..', 'data', 'counter.txt');

function readCount() {
  if (!fs.existsSync(COUNTER_FILE)) {
    fs.mkdirSync(path.dirname(COUNTER_FILE), { recursive: true });
    fs.writeFileSync(COUNTER_FILE, '0');
  }
  return parseInt(fs.readFileSync(COUNTER_FILE, 'utf8'), 10) || 0;
}

function hasVisitedCookie(req) {
  const header = req.headers.cookie || '';
  return header.split(';').some((c) => c.trim().startsWith('bh_visited='));
}

// Mirrors counter.php (PHP session -> "has visited this browser session"
// check, backed by a flat counter.txt), wired to js/counter.js.
router.get('/counter.php', (req, res) => {
  let count = readCount();

  if (!hasVisitedCookie(req)) {
    count += 1;
    fs.writeFileSync(COUNTER_FILE, String(count));
    // PHP's session cookie is per-browser-session (expires when the browser
    // closes) - mirror that with no explicit maxAge/expires.
    res.setHeader('Set-Cookie', 'bh_visited=1; Path=/; SameSite=Lax');
  }

  res.json({ views: count });
});

module.exports = router;
