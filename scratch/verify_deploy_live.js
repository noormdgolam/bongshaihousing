async function verifyAll() {
  console.log('====================================================');
  console.log('1. SMOKE CHECK: /industrial-sheds.html 301 Redirect');
  console.log('====================================================');
  const resShed = await fetch('https://bongshaihousing.com/industrial-sheds.html', { redirect: 'manual' });
  console.log('Status Code:', resShed.status);
  console.log('Location Header:', resShed.headers.get('location'));

  console.log('\n====================================================');
  console.log('2. HOMEPAGE CHECK: Discontinued Lines');
  console.log('====================================================');
  const resHome = await fetch('https://bongshaihousing.com/');
  const htmlHome = await resHome.text();
  const shedOccurrences = (htmlHome.match(/Industrial Steel Sheds/gi) || []).length;
  console.log('Occurrences of "Industrial Steel Sheds" on homepage:', shedOccurrences);

  console.log('\n====================================================');
  console.log('3. LOW-COST HOUSE: 20 Grayscale Images');
  console.log('====================================================');
  const resLch = await fetch('https://bongshaihousing.com/low-cost-house.html');
  const htmlLch = await resLch.text();
  const grayscaleMatches = (htmlLch.match(/filter:\s*grayscale\(65%\)/gi) || []).length;
  const comingSoonMatches = (htmlLch.match(/coming_soon\.webp/gi) || []).length;
  const placeholderMatches = (htmlLch.match(/placeholder\.webp/gi) || []).length;
  console.log('Grayscale (65%) cards count:', grayscaleMatches);
  console.log('Dead "coming_soon.webp" occurrences:', comingSoonMatches);
  console.log('Dead "placeholder.webp" occurrences:', placeholderMatches);
}

verifyAll().catch(console.error);
