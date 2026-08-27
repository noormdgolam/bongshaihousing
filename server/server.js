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
const counterRouter = require('./routes/counter');
const pagesRouter = require('./routes/pages');
const productsRouter = require('./routes/products');
const aiChatRouter = require('./routes/ai-chat');
const sitemapRouter = require('./routes/sitemap');
const searchIndexRouter = require('./routes/search-index');
const adminAuthRouter = require('./routes/admin-auth');
const adminRouter = require('./routes/admin');
const agentAuthRouter = require('./routes/agent-auth');
const agentRouter = require('./routes/agent');
const customerAuthRouter = require('./routes/customer-auth');
const customerRouter = require('./routes/customer');
const { extractVisitorInfo } = require('./lib/visitor-tracker');

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

// Domain/protocol canonicalization - the old .htaccess enforced this at
// the Apache layer (RewriteCond %{HTTPS} off / %{HTTP_HOST} ^www\.), but
// once Node Selector took over serving these paths directly, that logic
// never got ported. Confirmed via Search Console: www./bare-http variants
// were failing "page with redirect" validation because nothing was
// actually redirecting them - not a validation-lag issue, a real gap.
// Bare, non-www https://bongshaihousing.com is canonical, matching every
// canonical/OG URL already hardcoded that way in page-registry.json and
// products.js.
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') return next(); // local dev has no TLS - would redirect-loop otherwise
  const host = req.hostname || '';
  const isWww = host.startsWith('www.');
  if (!req.secure || isWww) {
    const targetHost = isWww ? host.slice(4) : host;
    return res.redirect(301, `https://${targetHost}${req.originalUrl}`);
  }
  next();
});

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
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 8, // 8 hours
  },
}));

const nunjucksEnv = nunjucks.configure(path.join(__dirname, 'views'), {
  autoescape: true,
  express: app,
  noCache: process.env.NODE_ENV !== 'production',
});
app.set('view engine', 'njk');

// "Mahmudul Hasan" -> "MH" for avatar initials (testimonials, etc.) -
// first letter of the first and last words, not just the first N chars.
nunjucksEnv.addFilter('initials', (name) => {
  if (!name) return '';
  const words = String(name).trim().split(/\s+/);
  const first = words[0] ? words[0][0] : '';
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
});

// Formats a DB timestamp (Date object or string) for display - no
// moment/date-fns dependency for one simple "18 Aug 2026" style format.
nunjucksEnv.addFilter('date', (value) => {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
});

// Bangladeshi Taka currency format filter (e.g. 2500000 -> ৳25,00,000)
const { formatTaka, formatTakaAscii } = require('./lib/format');
nunjucksEnv.addFilter('taka', (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  const n = Number(value);
  return Number.isFinite(n) ? formatTaka(n) : String(value);
});
nunjucksEnv.addFilter('formatTaka', (value) => {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  return Number.isFinite(n) ? formatTaka(n) : String(value);
});
nunjucksEnv.addFilter('formatTakaAscii', (value) => {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  return Number.isFinite(n) ? formatTakaAscii(n) : String(value);
});

// Footer copyright year - was a client-side <span id="year"> filled by JS
// after page load; server-rendering it removes the dependency on that
// script actually running (an earlier JS error elsewhere on the page, or
// JS disabled entirely, would otherwise leave the copyright line blank).
nunjucksEnv.addGlobal('currentYear', new Date().getFullYear());

// Global Theme Settings Middleware: injects active design tokens and CSS vars
const { getThemeSettings, generateCssVariables } = require('./lib/theme');
app.use(async (req, res, next) => {
  try {
    const theme = await getThemeSettings();
    res.locals.theme = theme;
    res.locals.themeCssVars = generateCssVariables(theme);
  } catch (e) {
    res.locals.theme = {};
    res.locals.themeCssVars = '';
  }
  next();
});

// Static asset directories: /css, /js, /images, /fonts, plus root assets
// In production on cPanel, Apache handles these directly; in Node dev/staging,
// Express serves them cleanly so styles and media always load.
app.use('/images', express.static(path.join(REPO_ROOT, 'images'), { maxAge: '1d' }));
app.use('/css', express.static(path.join(REPO_ROOT, 'css'), { maxAge: '1d' }));
app.use('/js', express.static(path.join(REPO_ROOT, 'js'), { maxAge: '1d' }));
app.use('/fonts', express.static(path.join(REPO_ROOT, 'fonts'), { maxAge: '7d' }));
app.use('/favicon.ico', express.static(path.join(REPO_ROOT, 'favicon.ico')));
app.use('/manifest.json', express.static(path.join(REPO_ROOT, 'manifest.json')));
app.use('/', searchIndexRouter); // dynamic search-index.json, DB products/categories/projects merged with static entries
app.use('/sw.js', express.static(path.join(REPO_ROOT, 'sw.js')));
app.use('/', sitemapRouter); // dynamic sitemap.xml, DB products/projects merged with the static entries
app.use('/llms.txt', express.static(path.join(REPO_ROOT, 'llms.txt')));
app.use('/llms-full.txt', express.static(path.join(REPO_ROOT, 'llms-full.txt')));
app.use('/robots.txt', express.static(path.join(REPO_ROOT, 'robots.txt')));
app.use('/agent-permissions.json', express.static(path.join(REPO_ROOT, 'agent-permissions.json')));
// Domain-ownership verification token (Bing/Search Console-style) -
// domain-specific, so inert on this test subdomain today, but needs to
// resolve once this app becomes bongshaihousing.com's real production site.
app.use('/f446c3814965a067992e82231bb56211.txt', express.static(path.join(REPO_ROOT, 'f446c3814965a067992e82231bb56211.txt')));

// Old/broken URL parity with the static site's .htaccess RewriteRules
// (Search Console fixes, renamed model numbers, dead WordPress-scanner
// paths) - see server/scripts/generate-redirects.js, re-run whenever
// .htaccess changes. Registered before the page routes so a redirected
// path never falls through to a 404 first.
const redirectsPath = path.join(__dirname, 'redirects.json');
const redirects = fs.existsSync(redirectsPath) ? JSON.parse(fs.readFileSync(redirectsPath, 'utf8')) : { exact: {}, prefix: {} };
const redirectPrefixes = Object.entries(redirects.prefix || {});
app.use((req, res, next) => {
  // Apache's original rules matched trailing slashes optionally
  // (^login/?$) - the JSON map only stores the no-slash form, so strip
  // one trailing slash before the exact-match lookup (root "/" excluded,
  // it's already its own distinct key).
  const normalizedPath = req.path.length > 1 && req.path.endsWith('/') ? req.path.slice(0, -1) : req.path;
  const exactMatch = redirects.exact[normalizedPath];
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

app.use('/admin', require('./middleware/csrf'));
app.use('/', adminAuthRouter);
app.use('/', adminRouter);
app.use('/agent', require('./middleware/csrf'));
app.use('/', agentAuthRouter);
app.use('/', agentRouter);
app.use('/my-project', require('./middleware/csrf'));
app.use('/', customerAuthRouter);
app.use('/', customerRouter);

// Page-view & visitor logging for the admin Analytics dashboard - GET requests only,
// after admin routes (so admin browsing never counts as traffic), fire-and-
// forget so a DB hiccup never adds latency to a real page load.
app.use((req, res, next) => {
  const isStaticAsset = /\.(css|js|map|png|jpg|jpeg|webp|svg|ico|woff|woff2|ttf|eot|json|xml|txt)$/i.test(req.path);
  if (req.method === 'GET' && !isStaticAsset && db) {
    try {
      const visitor = extractVisitorInfo(req);
      db('page_views').insert({
        path: req.path,
        ip: visitor.ip,
        country: visitor.country,
        country_code: visitor.country_code,
        city: visitor.city,
        user_agent: visitor.user_agent,
        device_type: visitor.device_type,
        browser: visitor.browser,
        os: visitor.os,
        referrer: visitor.referrer,
      }).catch(() => {});
    } catch (e) {
      // Ignore logging error to prevent affecting user experience
    }
  }
  next();
});

app.use('/', productsRouter); // DB-driven product slug pages (bh-*, dv-*, lcv-*) — must precede pagesRouter
app.use('/', aiChatRouter);   // AI Sales Assistant API endpoint (/api/ai-chat)
app.use('/', pagesRouter);
app.use('/', contactRouter);
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
  if (!res.headersSent) {
    res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
});

app.listen(PORT, () => {
  console.log(`Bongshai Housing Node app listening on http://localhost:${PORT}`);
});
