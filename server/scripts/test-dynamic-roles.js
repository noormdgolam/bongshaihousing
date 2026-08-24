const fs = require('fs');
const path = require('path');
const { getDynamicPermissionMatrix } = require('../lib/permission-matrix');

const adminPath = path.join(__dirname, '../routes/admin.js');
const origContent = fs.readFileSync(adminPath, 'utf8');

console.log('--- TEST 1: Normal Matrix ---');
let m1 = getDynamicPermissionMatrix(adminPath);
let usersRow = m1.find(r => r.path === '/admin/users*');
let productsRow = m1.find(r => r.path === '/admin/products*');
let seoSettingsRow = m1.find(r => r.path === '/admin/seo/settings*');

console.log('Original /admin/users* roles:', usersRow.roles);
console.log('Original /admin/products* roles:', productsRow.roles);
console.log('Original /admin/seo/settings* roles:', seoSettingsRow.roles);

console.log('\n--- TEST 2: Modifying direct requireRole on /admin/seo/settings in admin.js ---');
const modifiedDirect = origContent.replace(
  "router.get('/admin/seo/settings', requireRole('admin', 'superadmin')",
  "router.get('/admin/seo/settings', requireRole('superadmin')"
);
fs.writeFileSync(adminPath, modifiedDirect, 'utf8');
let m2 = getDynamicPermissionMatrix(adminPath);
let seoRow2 = m2.find(r => r.path === '/admin/seo/settings*');
console.log('Dynamic /admin/seo/settings* roles after changing to superadmin-only:', seoRow2.roles);

console.log('\n--- TEST 3: Modifying CONTENT_SECTIONS requireRole in admin.js ---');
const modifiedContentSections = origContent.replace(
  "router.use(section, requireRole('admin', 'superadmin', 'editor'));",
  "router.use(section, requireRole('superadmin'));"
);
fs.writeFileSync(adminPath, modifiedContentSections, 'utf8');
let m3 = getDynamicPermissionMatrix(adminPath);
let productsRow3 = m3.find(r => r.path === '/admin/products*');
console.log('Dynamic /admin/products* roles after CONTENT_SECTIONS change:', productsRow3.roles);

// Restore original
fs.writeFileSync(adminPath, origContent, 'utf8');

console.log('\n--- TEST 4: Restored Matrix ---');
let m4 = getDynamicPermissionMatrix(adminPath);
let usersRow4 = m4.find(r => r.path === '/admin/users*');
let productsRow4 = m4.find(r => r.path === '/admin/products*');
let seoSettingsRow4 = m4.find(r => r.path === '/admin/seo/settings*');

console.log('Restored /admin/users* roles:', usersRow4.roles);
console.log('Restored /admin/products* roles:', productsRow4.roles);
console.log('Restored /admin/seo/settings* roles:', seoSettingsRow4.roles);

const pass = 
  JSON.stringify(seoRow2.roles) === JSON.stringify(['superadmin']) &&
  JSON.stringify(productsRow3.roles) === JSON.stringify(['superadmin']) &&
  JSON.stringify(productsRow4.roles) === JSON.stringify(['superadmin', 'admin', 'editor']) &&
  JSON.stringify(seoSettingsRow4.roles) === JSON.stringify(['superadmin', 'admin']);

if (pass) {
  console.log('\n✅ ALL TESTS PASSED: Dynamic permission derivation is 100% verified against live route gates!');
} else {
  console.error('\n❌ TESTS FAILED');
  process.exit(1);
}
