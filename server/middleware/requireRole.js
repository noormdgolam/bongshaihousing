// role gate for admin-only sections (user management) - editors can use
// the rest of the CMS but shouldn't be able to create/delete other admin
// accounts. Must run after requireAdmin.
module.exports = function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (allowedRoles.includes(req.session.adminRole)) return next();
    res.status(403).send('You do not have permission to access this section.');
  };
};
