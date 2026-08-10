const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const htmlDir = path.join(baseDir, '..');

const files = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html') && (f.startsWith('bh-') || f.startsWith('lcv-') || f.startsWith('dv-')));

files.forEach(file => {
  const filePath = path.join(htmlDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  content = content.replace(/querySelectorAll\('\.area-btn'\)/g, "querySelectorAll('.area-btn, .modern-area-btn')");
  content = content.replace(/querySelectorAll\("\.area-btn"\)/g, 'querySelectorAll(".area-btn, .modern-area-btn")');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Upgraded JS for", file);
  }
});
