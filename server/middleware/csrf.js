const crypto = require('crypto');

// Synchronizer-token CSRF check for /admin/* state-changing requests.
// No csurf dependency (deprecated) - a per-session random token, exposed
// via res.locals.csrfToken and auto-injected into every admin <form> by
// a page-load script in admin-layout.njk, so individual form templates
// never need to be touched.
module.exports = function csrfProtection(req, res, next) {
  if (!req.session.csrfSecret) {
    req.session.csrfSecret = crypto.randomBytes(24).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfSecret;

  const stateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  if (!stateChanging) return next();

  const submitted = req.body && req.body._csrf;
  if (!submitted || submitted !== req.session.csrfSecret) {
    return res.status(403).type('html').send('<!doctype html><title>Forbidden</title>Invalid or expired form token. Go back, refresh the page, and try again.');
  }
  next();
};
