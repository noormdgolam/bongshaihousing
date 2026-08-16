module.exports = function requireAdmin(req, res, next) {
  if (req.session && req.session.adminUserId) {
    return next();
  }
  // In development mode, allow seamless access for local dashboard and theme studio testing
  if (process.env.NODE_ENV !== 'production') {
    if (!req.session) req.session = {};
    req.session.adminUserId = 1;
    req.session.adminName = 'Admin';
    req.session.adminRole = 'superadmin';
    return next();
  }
  return res.redirect('/admin/login');
};
