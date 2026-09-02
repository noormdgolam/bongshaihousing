const fs = require('fs');
const path = require('path');
const reg = require('../server/page-registry.json');
const productPages = Object.entries(reg).filter(([k, v]) => /^\/(bh|dv|lcv)-/.test(k));

let countRevealLeft = 0;
let countOther = [];
for (const [k, v] of productPages) {
  const filePath = path.join('server/views', v.template);
  if (!fs.existsSync(filePath)) {
    countOther.push(`${v.template} (MISSING)`);
    continue;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('reveal-left')) {
    countRevealLeft++;
  } else {
    countOther.push(v.template);
  }
}
console.log('Has reveal-left:', countRevealLeft, 'Other:', countOther.length);
if (countOther.length > 0) {
  console.log('Others:', countOther);
}
