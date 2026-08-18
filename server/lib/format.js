// Bangladeshi Lakh/Crore comma grouping (e.g. 3500000 -> "৩৫,০০,০০০" style
// digit grouping, "35,00,000" in plain digits) - was duplicated in
// routes/products.js and the AI chat widget's client-side JS; pulled out
// here so a future fix to the grouping logic doesn't need to happen in
// two places and risk drifting apart.
function formatTaka(n) {
  let s = Math.round(n).toString();
  const last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  if (rest !== '') {
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    s = rest + ',' + last3;
  } else {
    s = last3;
  }
  return '৳' + s;
}

// Same grouping, "Tk" instead of the ৳ glyph - for contexts stuck with
// Latin-1/WinAnsi-only rendering (PDFKit's standard 14 fonts don't cover
// U+09F3; passing it through corrupts not just the symbol but the whole
// string PDFKit tries to render it in).
function formatTakaAscii(n) {
  return formatTaka(n).replace('৳', 'Tk ');
}

module.exports = { formatTaka, formatTakaAscii };
