const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const htmlDir = path.join(baseDir, '..');

const files = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html') && (f.startsWith('bh-dv-') || f.startsWith('bh-cb-')));

files.forEach(file => {
  const filePath = path.join(htmlDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/<\/script>\s*<\/script>/, '</script>');

  fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Fixed double script tags');
