const path = require('path');
const nunjucks = require('nunjucks');

const viewsDir = path.join(__dirname, '..', 'views');
const env = nunjucks.configure(viewsDir, { autoescape: true });

async function runTests() {
  console.log('=== 1. TESTING MEDIA LIBRARY TEMPLATE RENDERING ===');

  const mockFiles = [
    { filename: 'hero-steel-178693.webp', path: 'images/uploads/hero-steel-178693.webp', size: 102400, inUse: true },
    { filename: 'old-draft-sample.png', path: 'images/uploads/old-draft-sample.png', size: 51200, inUse: false },
  ];

  const html = env.render('admin/media/list.njk', {
    adminName: 'Noor Md Golam',
    adminRole: 'superadmin',
    files: mockFiles,
    unusedCount: 1,
    uploaded: true,
  });

  const checks = [
    { test: html.includes('Media Library'), name: 'Media Library Title' },
    { test: html.includes('mediaUploadZone') && html.includes('mediaFileInput'), name: 'Dropzone File Input' },
    { test: html.includes('media-filter-btn'), name: 'Filter Pills' },
    { test: html.includes('mediaSearchInput'), name: 'Search Input' },
    { test: html.includes('copyMediaUrl'), name: '1-Click Copy URL Handler' },
    { test: html.includes('hero-steel-178693.webp'), name: 'File thumbnail list' },
    { test: html.includes('/admin/media/upload'), name: 'Upload form target' },
  ];

  for (const check of checks) {
    if (!check.test) {
      console.error(`FAIL: Media library check "${check.name}" failed`);
      process.exit(1);
    }
    console.log(`PASS: ${check.name}`);
  }

  console.log('\n=== ALL MEDIA LIBRARY TESTS PASSED CLEANLY! ===');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
