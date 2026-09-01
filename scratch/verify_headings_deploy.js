async function verifyDeploy() {
  console.log('====================================================');
  console.log(' Verification for Commits b0441c2f..8b8501a4');
  console.log('====================================================\n');

  // Check 1: Duplex Steel Building page content
  console.log('[1] Checking https://bongshaihousing.com/duplex-steel-building.html...');
  const resDuplex = await fetch('https://bongshaihousing.com/duplex-steel-building.html?cb=' + Date.now());
  const htmlDuplex = await resDuplex.text();
  const searchPhrase = "engineered, earthquake-resistant structural integrity";
  const hasPhrase = htmlDuplex.includes(searchPhrase);
  console.log(`  Contains "${searchPhrase}": ${hasPhrase}`);

  // Check 2: Verify category pages for question-style H1/H2 headings
  const testPages = [
    'apartment-building.html',
    'steel-house.html',
    'duplex-steel-building.html',
    'solutions.html',
    'products-and-solutions.html',
    'steel-vs-concrete-comparison.html',
    'about.html',
    'certifications.html',
    'faq.html',
    'projects.html'
  ];

  console.log('\n[2] Checking live category & core pages for question-style H1/H2 headings...');
  for (const page of testPages) {
    const res = await fetch(`https://bongshaihousing.com/${page}?cb=${Date.now()}`);
    const html = await res.text();
    // Match any H1 or H2 that ends with a question mark
    const questionHeadings = (html.match(/<h[12][^>]*>[^<]*\?[^<]*<\/h[12]>/gi) || [])
      .map(h => h.replace(/<[^>]+>/g, '').trim())
      // FAQ questions inside FAQ accordions are standard FAQs, but main H1/H2 section headers shouldn't be questions except dedicated FAQ sections
      .filter(h => !page.includes('faq') && !h.toLowerCase().includes('frequently asked'));

    console.log(`  ${page.padEnd(35)} -> HTTP ${res.status}, Question H1/H2 count: ${questionHeadings.length}${questionHeadings.length ? ' (' + questionHeadings.join('; ') + ')' : ''}`);
  }

  // Check 3: Check title tags in solutions.html and products-and-solutions.html
  console.log('\n[3] Checking page title tags in solutions.html and products-and-solutions.html...');
  const resSol = await fetch('https://bongshaihousing.com/solutions.html?cb=' + Date.now());
  const htmlSol = await resSol.text();
  const titleSol = (htmlSol.match(/<title>([^<]+)<\/title>/i) || [])[1];
  console.log(`  solutions.html title: "${titleSol}"`);

  const resProdSol = await fetch('https://bongshaihousing.com/products-and-solutions.html?cb=' + Date.now());
  const htmlProdSol = await resProdSol.text();
  const titleProdSol = (htmlProdSol.match(/<title>([^<]+)<\/title>/i) || [])[1];
  console.log(`  products-and-solutions.html title: "${titleProdSol}"`);

  console.log('\n====================================================');
  console.log(' VERIFICATION COMPLETE');
  console.log('====================================================\n');
}

verifyDeploy().catch(console.error);
