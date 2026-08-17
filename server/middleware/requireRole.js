// Role gate for admin CMS sections. Must run after requireAdmin.
module.exports = function requireRole(...allowedRoles) {
  return function (req, res, next) {
    const role = (req.session && req.session.adminRole) || 'editor';
    // 'superadmin' and 'admin' always have full bypass access
    if (role === 'superadmin' || role === 'admin' || allowedRoles.includes(role)) {
      return next();
    }
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(403).json({ success: false, error: `Forbidden: Insufficient permissions for role (${role})` });
    }
    res.status(403).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>403 Forbidden — Bongshai CMS</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0F172A; color: #F8FAFC; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .error-card { background: #1E293B; border: 1px solid #334155; padding: 36px 32px; border-radius: 12px; max-width: 440px; text-align: center; box-shadow: 0 16px 32px rgba(0,0,0,0.4); }
          h1 { color: #EF4444; font-size: 1.4rem; margin: 0 0 12px; }
          p { color: #94A3B8; font-size: 0.88rem; line-height: 1.5; margin: 0 0 20px; }
          .badge { display: inline-block; background: rgba(239,68,68,0.15); color: #FCA5A5; font-size: 0.78rem; font-weight: 700; padding: 3px 10px; border-radius: 20px; margin-bottom: 16px; }
          .btn { display: inline-block; background: #3B82F6; color: white; padding: 9px 18px; border-radius: 6px; text-decoration: none; font-size: 0.85rem; font-weight: 700; }
          .btn:hover { background: #2563EB; }
        </style>
      </head>
      <body>
        <div class="error-card">
          <div style="font-size: 2.2rem; margin-bottom: 12px;">🛑</div>
          <span class="badge">403 FORBIDDEN</span>
          <h1>Access Restricted</h1>
          <p>Your current account role (<strong>${role}</strong>) does not have permission to access this section.</p>
          <a href="/admin" class="btn">← Return to Dashboard</a>
        </div>
      </body>
      </html>
    `);
  };
};
