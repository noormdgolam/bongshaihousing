const db = require('../lib/db');

// Same re-check-on-every-request pattern as requireAgent - loads the
// customer fresh each time rather than trusting whatever was in the
// session, so a deleted account can't keep portal access just because
// the session cookie is still valid.
module.exports = async function requireCustomer(req, res, next) {
  if (!req.session || !req.session.customerId) {
    return res.redirect('/my-project/login.html');
  }
  const customer = await db('customers').where({ id: req.session.customerId }).first();
  if (!customer) {
    req.session.customerId = null;
    return res.redirect('/my-project/login.html');
  }
  req.customer = customer;
  next();
};
