require('dotenv').config();

const path = require('path');
const express = require('express');
const nunjucks = require('nunjucks');
const helmet = require('helmet');
const compression = require('compression');

const contactRouter = require('./routes/contact');
const careerRouter = require('./routes/career');
const counterRouter = require('./routes/counter');
const pagesRouter = require('./routes/pages');

const app = express();
const PORT = process.env.PORT || 3000;
const REPO_ROOT = path.join(__dirname, '..');

// Security headers + gzip. In production, Apache already does this for
// static assets (see .htaccess) - these cover the routes Node actually
// serves (dynamic pages once they exist, and the form/counter APIs).
app.use(helmet({
  contentSecurityPolicy: false, // site relies on inline scripts/styles extensively; revisit once a CSP is designed on purpose
}));
app.use(compression());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use('/', pagesRouter);
app.use('/', contactRouter);
app.use('/', careerRouter);
app.use('/', counterRouter);

if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(path.join(REPO_ROOT), { extensions: ['html'], index: false }));
}

app.use((req, res) => {
  res.status(404).sendFile(path.join(REPO_ROOT, '404.html'));
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ status: 'error', message: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`Bongshai Housing Node app listening on http://localhost:${PORT}`);
});
