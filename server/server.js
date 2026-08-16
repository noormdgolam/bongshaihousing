require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const nunjucks = require('nunjucks');
const helmet = require('helmet');
const compression = require('compression');
const session = require('express-session');
const { ConnectSessionKnexStore } = require('connect-session-knex');

const db = require('./lib/db');
const contactRouter = require('./routes/contact');
const careerRouter = require('./routes/career');
const counterRouter = require('./routes/counter');
const pagesRouter = require('./routes/pages');
const adminAuthRouter = require('./routes/admin-auth');
const adminRouter = require('./routes/admin');

// The session store (and any other async DB init) can reject before
// anything has a chance to .catch() it - without this, a single transient
// MySQL hiccup crashes the entire Node process (public pages included,
// not just the admin panel that actually needs the DB).
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection (app stays up):', err);
});

const app = express();
const PORT = process.env.PORT || 3000;
const REPO_ROOT = path.join(__dirname, '..');

// cPanel's Node Selector (LiteSpeed) terminates TLS and forwards to this
// app over plain HTTP internally - without trust proxy, req.secure reads
// false even on a genuine https:// request, and express-session silently
// (no error, no log) refuses to set a `secure: true` cookie in that case.
// Login "succeeding" (302 to /admin) but never actually staying logged in
// is exactly what that looks like from the outside.
app.set('trust proxy', 1);

// Security headers + gzip. In production, Apache already does this for
// static assets (see .htaccess) - these cover the routes Node actually
// serves (dynamic pages once they exist, and the form/counter APIs).
app.use(helmet({
  contentSecurityPolicy: false, // site relies on inline scripts/styles extensively; revisit once a CSP is designed on purpose
}));
app.use(compression());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Admin session, backed by the same MySQL connection as everything else
// (no separate Redis dependency to provision on shared hosting).
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me-in-.env',
  store: new ConnectSessionKnexStore({ knex: db, tableName: 'sessions', createTable: true }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 8, // 8 hours
  },
}));

nunjucks.configure(path.join(__dirname, 'views'), {
  autoescape: true,
  express: app,
  noCache: process.env.NODE_ENV !== 'production',
});
app.set('view engine', 'njk');

// Dev-only convenience: in production this is Apache's job (see the
// architecture note in the plan - static assets stay off the Node
// process). Kept here so `npm run dev` renders a usable page locally.
// Asset directories are safe to register early (no dynamic route ever
// matches /images, /css, /js, /fonts), but the repo-root static fallback
// for the *other* 222 not-yet-converted pages must come AFTER the routers
// below - otherwise it shadows converted pages like /career.html by
// serving the old static file straight off disk before Express ever
// reaches the Nunjucks-rendered route.
if (process.env.NODE_ENV !== 'production') {
  app.use('/images', express.static(path.join(REPO_ROOT, 'images')));
  app.use('/css', express.static(path.join(REPO_ROOT, 'css')));
  app.use('/js', express.static(path.join(REPO_ROOT, 'js')));
  app.use('/fonts', express.static(path.join(REPO_ROOT, 'fonts')));
}

// Old/broken URL parity with the static site's .htaccess RewriteRules
// (Search Console fixes, renamed model numbers, dead WordPress-scanner
// paths) - see server/scripts/generate-redirects.js, re-run whenever
// .htaccess changes. Registered before the page routes so a redirected
// path never falls through to a 404 first.
const redirectsPath = path.join(__dirname, 'redirects.json');
const redirects = fs.existsSync(redirectsPath) ? JSON.parse(fs.readFileSync(redirectsPath, 'utf8')) : { exact: {}, prefix: {} };
const redirectPrefixes = Object.entries(redirects.prefix || {});
app.use((req, res, next) => {
  const exactMatch = redirects.exact[req.path];
  if (exactMatch) {
    return res.redirect(exactMatch.permanent ? 301 : 302, exactMatch.to);
  }
  const pathNoSlash = req.path.replace(/^\/+/, '');
  const prefixMatch = redirectPrefixes.find(([prefix]) => pathNoSlash.startsWith(prefix));
  if (prefixMatch) {
    const [, target] = prefixMatch;
    return res.redirect(target.permanent ? 301 : 302, target.to);
  }
  next();
});

app.use('/', adminAuthRouter);
app.use('/', adminRouter);
app.use('/', pagesRouter);
app.use('/', contactRouter);
app.use('/', careerRouter);
app.use('/', counterRouter);

if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(path.join(REPO_ROOT), { extensions: ['html'], index: false }));
}

// bongshai-node-app is a separate directory from the site's actual files
// (public_html/bongshaihousing.com/) in production - not a subdirectory of
// it - so this can't reach for ../404.html the way dev mode can. Apache's
// own .htaccess ErrorDocument 404 already covers the real site experience
// for anything not proxied to Node; this only needs to handle a request
// that made it to Node but matched no route here.
//
// HTML, not JSON: cPanel's Node Selector "check availability" probe after
// install/restart flagged a content-type mismatch (expected text/html,
// got application/json) when this fell through to a JSON response - the
// actual API routes (send_email.php etc.) keep JSON since that's correct
// for those; this generic fallback just needs to not trip that check.
app.use((req, res) => {
  res.status(404).type('html').send('<!doctype html><title>Not Found</title>Not found.');
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ status: 'error', message: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`Bongshai Housing Node app listening on http://localhost:${PORT}`);
});
