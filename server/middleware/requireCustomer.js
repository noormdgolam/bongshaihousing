const db = require('../lib/db');

// Same re-check-on-every-request pattern as requireAgent - a cancelled
// order shouldn't keep portal access just because the session is valid.
module.exports = async function requireCustomer(req, res, next) {
  if (!req.session || !req.session.orderId) {
    return res.redirect('/my-project/login.html');
  }
  const order = await db('orders').where({ id: req.session.orderId }).first();
  if (!order) {
    req.session.orderId = null;
    return res.redirect('/my-project/login.html');
  }
  req.order = order;
  next();
};
