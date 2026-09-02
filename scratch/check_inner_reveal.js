const fs = require('fs');
const path = require('path');
const reg = require('../server/page-registry.json');
const productPages = Object.entries(reg).filter(([k, v]) => /^\/(bh|dv|lcv)-/.test(k));

const variations = new Set();
for (const [k, v] of productPages) {
  const filePath = path.join('server/views', v.template);
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');
  const m = content.match(/<div class="reveal-left"[^>]*>([\s\S]*?)<\/div>/i);
  if (m) {
    // Check if there are other tags or just the img
    const inner = m[1].trim();
    if (inner.includes('bh301-thumb-row')) {
      variations.add('has bh301-thumb-row');
    } else if (inner.startsWith('{% set dbp = dbProductsByModel')) {
      variations.add('starts with dbp img');
    } else {
      variations.add(inner.substring(0, 40));
    }
  }
}
console.log('Variations found:', Array.from(variations));
