const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
let cleaned = 0;

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;

  if (content.includes('js.puter.com')) {
    content = content.replace(/<!-- Puter\.js SDK[^>]*-->\s*<script src="https:\/\/js\.puter\.com\/v2\/"><\/script>\s*/gi, '');
    content = content.replace(/<script src="https:\/\/js\.puter\.com\/v2\/"><\/script>\s*/gi, '');
    changed = true;
  }
  if (content.includes('Claude 3.5 AI')) {
    content = content.replace(/Claude 3\.5 AI/g, 'AI Assistant');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(f, content, 'utf8');
    cleaned++;
  }
}

console.log(`Cleaned Puter.js references from ${cleaned} HTML files.`);
