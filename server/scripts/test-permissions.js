const path = require('path');
const nunjucks = require('nunjucks');
const requireRole = require('../middleware/requireRole');

const viewsDir = path.join(__dirname, '..', 'views');
const env = nunjucks.configure(viewsDir, { autoescape: true });

async function runTests() {
  console.log('=== 1. TESTING REQUIREROLE MIDDLEWARE LOGIC ===');

  // Test 1: Admin bypass
  let adminAllowed = false;
  const adminMw = requireRole('admin');
  const mockAdminReq = { session: { adminRole: 'superadmin' }, headers: {} };
  const mockAdminRes = { status: () => mockAdminRes, send: () => {} };
  adminMw(mockAdminReq, mockAdminRes, () => { adminAllowed = true; });
  console.log(`PASS: Superadmin bypass -> allowed = ${adminAllowed}`);
  if (!adminAllowed) process.exit(1);

  // Test 2: Editor blocked on Admin-only route
  let editorStatus = null;
  const mockEditorReq = { session: { adminRole: 'editor' }, headers: {} };
  const mockEditorRes = {
    status: (code) => { editorStatus = code; return mockEditorRes; },
    send: (msg) => { /* 403 HTML page */ },
  };
  adminMw(mockEditorReq, mockEditorRes, () => { editorStatus = 200; });
  console.log(`PASS: Editor blocked from admin-only route -> status = ${editorStatus}`);
  if (editorStatus !== 403) process.exit(1);

  // Test 3: JSON response on Accept: application/json
  let jsonResult = null;
  const mockJsonReq = { session: { adminRole: 'sales' }, headers: { accept: 'application/json' } };
  const mockJsonRes = {
    status: (code) => mockJsonRes,
    json: (payload) => { jsonResult = payload; },
  };
  adminMw(mockJsonReq, mockJsonRes, () => {});
  console.log(`PASS: JSON forbidden payload returned -> ${JSON.stringify(jsonResult)}`);
  if (!jsonResult || jsonResult.success !== false) process.exit(1);

  console.log('\n=== 2. TESTING SIDEBAR NAVIGATION ROLE-GATING ===');

  // Render sidebar as Superadmin
  const adminHtml = env.render('admin-layout.njk', {
    adminName: 'Super Admin',
    adminRole: 'superadmin',
  });
  if (!adminHtml.includes('/admin/themes') || !adminHtml.includes('/admin/theme-editor') || !adminHtml.includes('/admin/users')) {
    console.error('FAIL: Superadmin missing administrative navigation links');
    process.exit(1);
  }
  console.log('PASS: Superadmin sees Themes, Studio Pro, and User Management links');

  // Render sidebar as Editor
  const editorHtml = env.render('admin-layout.njk', {
    adminName: 'Content Editor',
    adminRole: 'editor',
  });
  if (editorHtml.includes('/admin/themes') || editorHtml.includes('/admin/theme-editor') || editorHtml.includes('/admin/users')) {
    console.error('FAIL: Editor can see restricted admin navigation links');
    process.exit(1);
  }
  if (!editorHtml.includes('/admin/products') || !editorHtml.includes('/admin/projects')) {
    console.error('FAIL: Editor cannot see content catalog links');
    process.exit(1);
  }
  console.log('PASS: Editor cannot see Themes/Studio/Users, but sees Products & Projects');

  // Render sidebar as Sales
  const salesHtml = env.render('admin-layout.njk', {
    adminName: 'Sales Rep',
    adminRole: 'sales',
  });
  if (salesHtml.includes('/admin/themes') || salesHtml.includes('/admin/products') || salesHtml.includes('/admin/users')) {
    console.error('FAIL: Sales rep can see restricted catalog or admin links');
    process.exit(1);
  }
  if (!salesHtml.includes('/admin/leads')) {
    console.error('FAIL: Sales rep cannot see leads pipeline');
    process.exit(1);
  }
  console.log('PASS: Sales rep sees Leads pipeline, with catalog and theme links hidden');

  console.log('\n=== ALL PERMISSIONS TESTS PASSED CLEANLY! ===');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
