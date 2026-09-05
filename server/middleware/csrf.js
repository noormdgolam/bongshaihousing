const crypto = require('crypto');

// Synchronizer-token CSRF check for /admin/* and /agent/* state-changing
// requests. No csurf dependency (deprecated) - a per-session random
// token, exposed via res.locals.csrfToken and auto-injected into every
// form by a page-load script in admin-layout.njk/agent-layout.njk, so
// individual form templates never need to be touched.
module.exports = function csrfProtection(req, res, next) {
  const isAuthOrLogin = req.session.user || req.session.agent || req.path.includes('/login') || req.path.includes('/register') || req.path.includes('/forgot-password') || req.path.includes('/reset-password') || req.path.includes('/set-password');
  
  if (isAuthOrLogin && !req.session.csrfSecret) {
    req.session.csrfSecret = crypto.randomBytes(24).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfSecret || '';

  const stateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  if (!stateChanging) return next();

  // multipart/form-data bodies (file upload forms) aren't parsed into
  // req.body until multer runs, which only happens inside the specific
  // route handler - after this middleware, not before. Checking here
  // would see an empty req.body and reject every submission regardless
  // of whether the token was actually correct. Those routes call
  // verifyCsrfToken() themselves once multer has parsed the body.
  if (req.is('multipart/form-data')) return next();

  if (!verifyCsrfToken(req)) return sendCsrfError(req, res);
  next();
};

function verifyCsrfToken(req) {
  const submitted = req.body && req.body._csrf;
  return Boolean(submitted) && submitted === req.session.csrfSecret;
}

function sendCsrfError(req, res) {
  const message = 'Your form token expired or didn\'t match (often just means the page was open a while - refresh and try again).';
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(403).json({ success: false, error: message });
  }
  return res.status(403).type('html').send(`<!doctype html><title>Forbidden</title>${message}`);
}

module.exports.verifyCsrfToken = verifyCsrfToken;
module.exports.sendCsrfError = sendCsrfError;
