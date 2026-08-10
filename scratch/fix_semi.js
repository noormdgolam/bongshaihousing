const fs = require('fs');
const path = require('path');
const baseDir = __dirname;
Array.from({length: 12}, (_, i) => `bh-tsb-${101 + i}.html`).forEach(file => {
  const p = path.join(baseDir, '..', file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(/};};/g, '};');
    fs.writeFileSync(p, content);
    console.log("Fixed", file);
  }
});
