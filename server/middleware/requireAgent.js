const db = require('../lib/db');

// Re-checks status on every request rather than trusting the session
// alone - an agent approved then later deactivated by an admin shouldn't
// keep dashboard access just because their existing session cookie is
// still valid.
module.exports = async function requireAgent(req, res, next) {
  if (!req.session || !req.session.agentId) {
    return res.redirect('/agent/login.html');
  }
  const agent = await db('agents').where({ id: req.session.agentId }).first();
  if (!agent || agent.status !== 'active') {
    req.session.agentId = null;
    return res.redirect('/agent/login.html');
  }
  req.agent = agent;
  next();
};
