async function fullVerification() {
  const cb = Date.now();
  const res = await fetch(`https://bongshaihousing.com/bh-dv-202.html?cb=${cb}`);
  const html = await res.text();

  const priceSpanMatch = html.match(/<span id=["']spec-price-bh-dv-202["'][^>]*>([\s\S]*?)<\/span>/i);
  const waMatch = html.match(/href=["'](https:\/\/wa\.me\/[^"']+)["']/i);
  const hasCatSidebar = html.includes('cat-sidebar');
  const specRows = [...html.matchAll(/<td style=["'][^"']*font-weight: 600; color: var\(--primary-dark\);[^"']*["']>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>/gi)];

  console.log('HTTP Status:', res.status);
  console.log('Fixed Package Price Span:', priceSpanMatch ? priceSpanMatch[1].trim() : 'NONE');
  console.log('WhatsApp Link:', waMatch ? waMatch[1] : 'NONE');
  console.log('cat-sidebar present:', hasCatSidebar);
  console.log('Building Specifications row count:', specRows.length);
  specRows.forEach((r, i) => console.log(`  [${i+1}] ${r[1].trim()}: ${r[2].trim()}`));
}
fullVerification().catch(console.error);
