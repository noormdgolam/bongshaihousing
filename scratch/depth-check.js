const fs = require('fs');
for (const f of ['simplex-steel-building', 'duplex-steel-building', 'cottage-house']) {
  const s = fs.readFileSync('e:/web/Bongshaihousing/server/views/pages/' + f + '.njk', 'utf8');
  const landmarks = ['<div class="stagger product-grid">', 'Our Technology'];
  let depth = 0, last = 0;
  const tagRe = /<(\/?)div\b[^>]*>/g;
  const out = [f];
  for (const lm of landmarks) {
    const idx = s.indexOf(lm);
    if (idx < 0) { out.push(lm.slice(0, 15) + ':n/a'); continue; }
    let m;
    tagRe.lastIndex = last;
    while ((m = tagRe.exec(s)) && m.index < idx) { depth += m[1] ? -1 : 1; last = tagRe.lastIndex; }
    out.push(lm.slice(0, 15) + ':' + depth);
  }
  // per-card balance
  const cardStarts = [...s.matchAll(/<div class="property-card reveal"/g)].map(m => m.index);
  const gridEnd = s.indexOf('Our Technology');
  const cards = [];
  for (let i = 0; i < cardStarts.length; i++) {
    const end = i + 1 < cardStarts.length ? cardStarts[i + 1] : (gridEnd > 0 ? gridEnd : s.length);
    const chunk = s.slice(cardStarts[i], end);
    const o = (chunk.match(/<div\b/g) || []).length;
    const c = (chunk.match(/<\/div>/g) || []).length;
    cards.push(o - c);
  }
  out.push('cardNet:' + cards.join(','));
  console.log(out.join('  |  '));
}