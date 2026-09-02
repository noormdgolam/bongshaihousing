async function inspectTsb() {
  const cb = Date.now();
  const res = await fetch(`https://bongshaihousing.com/bh-tsb-101.html?cb=${cb}`);
  const html = await res.text();
  console.log('bh-tsb-101.html HTTP Status:', res.status);
  console.log('cat-sidebar present:', html.includes('cat-sidebar'));
  console.log('Building Specifications table present:', html.includes('Building Specifications'));
  
  const heroImgMatch = html.match(/<div class=["']reveal-left["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i) ||
                       html.match(/<img[^>]+alt=["'][^"']*BH-TSB-101[^"']*["'][^>]*src=["']([^"']+)["']/i);
  console.log('Hero Image Match:', heroImgMatch ? heroImgMatch[0] : 'None');

  const catRes = await fetch(`https://bongshaihousing.com/apartment-building.html?cb=${cb}`);
  const catHtml = await catRes.text();
  const catCardMatch = catHtml.match(/Model No-BH-TSB-101[\s\S]{0,300}/i) ||
                       catHtml.match(/BH-TSB-101[\s\S]*?<img[^>]+src=["']([^"']+)["']/i);
  console.log('Category Card match in apartment-building.html:', catCardMatch ? catCardMatch[0] : 'None');
}
inspectTsb().catch(console.error);
