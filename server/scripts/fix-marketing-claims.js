#!/usr/bin/env node
/*
 * Sitewide unverified-marketing-claims cleanup.
 * Fixes: "500+" -> "100+", "20+ Years" -> "18+ Years", "200+ Professionals" -> "175+",
 * "98% Satisfaction" -> "99%", drops "ISO 9001:2015 certified" framing and the
 * unconfirmed in-house material-testing-lab claim, generalizes "all 64 districts"
 * coverage claims to "nationwide", and fixes the stale WhatsApp number.
 *
 * Usage:
 *   node server/scripts/fix-marketing-claims.js            (dry-run, default)
 *   node server/scripts/fix-marketing-claims.js --apply    (writes changes)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const APPLY = process.argv.includes('--apply');

function walk(dir, filter, results = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, filter, results);
    else if (filter(entry.name)) results.push(full);
  }
  return results;
}

const staticHtmlFiles = fs
  .readdirSync(ROOT)
  .filter((f) => f.endsWith('.html'))
  .map((f) => path.join(ROOT, f));
const njkFiles = walk(path.join(ROOT, 'server', 'views'), (n) => n.endsWith('.njk'));

const extraFiles = [
  path.join(ROOT, 'AGENTS.md'),
  path.join(ROOT, 'llms.txt'),
  path.join(ROOT, 'llms-full.txt'),
  path.join(ROOT, 'search-index.json'),
  path.join(ROOT, 'antigravity_prompt.md'),
  path.join(ROOT, 'server', 'lib', 'ai-assistant.js'),
  path.join(ROOT, 'server', 'lib', 'brochure-generator.js'),
  path.join(ROOT, 'server', 'lib', 'theme.js'),
  path.join(ROOT, 'server', 'scripts', 'regenerate_product_descriptions.py'),
  path.join(ROOT, 'server', 'page-registry.json'),
  path.join(ROOT, 'server', 'db', 'seeds', 'data', 'products.json'),
  path.join(ROOT, 'server', 'db', 'seeds', 'data', 'team_members.json'),
  path.join(ROOT, 'server', 'db', 'seeds', 'data', 'faqs.json'),
  path.join(ROOT, 'faq.md'),
  path.join(ROOT, 'service-areas.md'),
].filter((f) => fs.existsSync(f));

const allTargetFiles = [...staticHtmlFiles, ...njkFiles, ...extraFiles];

const rules = [
  {
    name: 'stat-card 500->100',
    re: /<div class="stat-card-num">500<span class="gold">\+<\/span><\/div>/g,
    to: () => '<div class="stat-card-num">100<span class="gold">+</span></div>',
  },
  {
    name: 'stat-card 20->18 (Years)',
    re: /<div class="stat-card-num">20<span class="gold">\+<\/span><\/div>/g,
    to: () => '<div class="stat-card-num">18<span class="gold">+</span></div>',
  },
  {
    name: 'stat-card 200->175 (Professionals)',
    re: /<div class="stat-card-num">200<span class="gold">\+<\/span><\/div>/g,
    to: () => '<div class="stat-card-num">175<span class="gold">+</span></div>',
  },
  {
    name: 'stat-card 98->99 (Satisfaction)',
    re: /<div class="stat-card-num">98<span class="gold">%<\/span><\/div>/g,
    to: () => '<div class="stat-card-num">99<span class="gold">%</span></div>',
  },
  {
    name: 'FAQ JSON-LD long sentence (homepage/about)',
    re: /with engineering excellence since 2008, ISO 9001:2015 certification, 500\+ delivered projects, and service coverage across all 64 districts of Bangladesh\./g,
    to: () =>
      'with engineering excellence since 2008, 100+ delivered projects, and nationwide service coverage across Bangladesh.',
  },
  {
    name: 'Product FAQ answer (cert + testing-lab + count sentence)',
    re: /Yes\. All Bongshai Housing ([^.]+?) construction is delivered under ISO 9001:2015 Quality Management certification\. The company operates an in-house material testing laboratory that tests all steel, concrete, and panel components before use\. Bongshai Housing was founded in 2008 and has delivered 500\+ projects across Bangladesh\./g,
    to: (m, model) =>
      `Yes. All Bongshai Housing ${model} construction follows BNBC 2020 and AISC structural design codes, with quality checks at every build stage. Bongshai Housing was founded in 2008 and has delivered 100+ projects across Bangladesh.`,
  },
  {
    name: 'Product FAQ question (drop "certified" framing)',
    re: /Is Bongshai Housing's ([^?]+?) construction quality certified\?/g,
    to: (m, model) => `What quality standards does Bongshai Housing's ${model} construction follow?`,
  },
  {
    name: 'Compact product JSON-LD suffix (njk)',
    re: /all 64 districts\. All-steel, climate-resilient, ISO certified\. Founded 2008\./g,
    to: () => 'nationwide. All-steel, climate-resilient. Founded 2008.',
  },
  {
    name: 'Stale WhatsApp/phone number',
    re: /8801711200241/g,
    to: () => '8801781636613',
  },
  {
    name: 'Product desc suffix - "framing, all 64 districts."',
    re: /steel-composite framing, all 64 districts\./g,
    to: () => 'steel-composite framing, nationwide.',
  },
  {
    name: 'Product desc suffix - "framing delivered to all 64 districts."',
    re: /steel-composite framing delivered to all 64 districts\./g,
    to: () => 'steel-composite framing, delivered nationwide.',
  },
  {
    name: 'Coverage claim - "districts and thanas in Bangladesh"',
    re: /across all 64 districts and thanas in Bangladesh/g,
    to: () => 'nationwide across Bangladesh',
  },
  {
    name: 'Coverage claim - "districts in Bangladesh"',
    re: /across all 64 districts in Bangladesh/g,
    to: () => 'nationwide across Bangladesh',
  },
  {
    name: 'faqs.json coverage-claim answer opener',
    re: /We serve all 64 districts of Bangladesh, with dedicated project teams/g,
    to: () => 'We serve customers nationwide across Bangladesh, with dedicated project teams',
  },
  {
    name: 'team_members.json QC role parenthetical',
    re: /Lead QC Inspector \(ISO 9001:2015\)/g,
    to: () => 'Lead QC Inspector',
  },
  {
    name: 'team_members.json coordinator bio districts',
    re: /Coordinates field engineer visits across all 64 districts and manages customer inquiry intake\./g,
    to: () => 'Coordinates field engineer visits nationwide and manages customer inquiry intake.',
  },
  // --- Round 2: individually-located remaining instances ---
  {
    name: 'ai-assistant.js knowledge line',
    re: /Experience: Engineering excellence since 2008 \(18\+ years in Bangladesh\), 500\+ completed projects nationwide, service coverage across all 64 districts\./g,
    to: () =>
      'Experience: Engineering excellence since 2008 (18+ years in Bangladesh), 100+ completed projects nationwide, nationwide service coverage.',
  },
  {
    name: 'projects.html/njk meta description',
    re: /Portfolio of 500\+ completed pre-engineered steel building, prefab housing, industrial shed, and resort construction projects/g,
    to: () =>
      'Portfolio of 100+ completed pre-engineered steel building, prefab housing, industrial shed, and resort construction projects',
  },
  {
    name: 'about.html/njk Organization description',
    re: /with engineering excellence since 2008, 500\+ delivered projects, ISO 9001:2015 certification, and a team of expert engineers and architects\./g,
    to: () =>
      'with engineering excellence since 2008, 100+ delivered projects, and a team of expert engineers and architects.',
  },
  {
    name: 'index.html/njk coverage FAQ',
    re: /Bongshai Housing serves all 64 districts of Bangladesh across all 8 administrative divisions, with dedicated project teams based in Dhaka, Chattogram, and Cumilla\./g,
    to: () =>
      'Bongshai Housing serves customers nationwide across all 8 administrative divisions of Bangladesh, with dedicated project teams based in Dhaka, Chattogram, and Cumilla.',
  },
  {
    name: 'cottage-house.html/njk coverage FAQ',
    re: /Bongshai Housing serves all 64 districts including rural upazilas across Bangladesh\./g,
    to: () => 'Bongshai Housing serves rural upazilas nationwide across Bangladesh.',
  },
  {
    name: 'gallery.html/njk meta description',
    re: /by Bongshai Housing Ltd\. across all 64 districts of Bangladesh\. Founded 2008\./g,
    to: () => 'by Bongshai Housing Ltd. nationwide across Bangladesh. Founded 2008.',
  },
  {
    name: 'team-marketing-sales.html/njk meta description',
    re: /serving clients across all 64 districts of Bangladesh\./g,
    to: () => 'serving clients nationwide across Bangladesh.',
  },
  {
    name: 'steel-vs-concrete-comparison.html/njk coverage line',
    re: /We build across all 64 districts of Bangladesh - you own the land/g,
    to: () => 'We build nationwide across Bangladesh - you own the land',
  },
  {
    name: 'products-and-solutions.html/njk cost-estimation coverage line',
    re: /free architectural consultation and turnkey cost estimation across all 64 districts of Bangladesh\./g,
    to: () => 'free architectural consultation and turnkey cost estimation nationwide across Bangladesh.',
  },
  {
    name: 'products-and-solutions.html/njk "certified Zone 4" (FAQ answer)',
    re: /delivering certified Zone 4 earthquake resistance/g,
    to: () => 'delivering Zone 4-rated earthquake resistance',
  },
  {
    name: 'products-and-solutions.html/njk "certified earthquake resilience" (hero copy)',
    re: /with certified earthquake resilience and turnkey execution\./g,
    to: () => 'with Zone 4-rated earthquake resilience and turnkey execution.',
  },
  {
    name: 'products-and-solutions.html/njk "certified for Zone 4" (second FAQ)',
    re: /AISC seismic standards, certified for Zone 4 earthquake resistance/g,
    to: () => 'AISC seismic standards, rated for Zone 4 earthquake resistance',
  },
  {
    name: 'apartment-building / low-cost-house ISO description',
    re: /Multi-family or rental-style design\. ISO 9001:2015 certified construction\./g,
    to: () => 'Multi-family or rental-style design. Built to BNBC 2020 and AISC structural codes.',
  },
  {
    name: 'llms.txt coverage bullet',
    re: /- \*\*Coverage\*\*: All 64 districts of Bangladesh/g,
    to: () => '- **Coverage**: Nationwide across Bangladesh',
  },
  {
    name: 'llms.txt total-coverage bullet',
    re: /- \*\*Total\*\*: All 64 districts of Bangladesh served with dedicated project teams/g,
    to: () => '- **Total**: Nationwide coverage served with dedicated project teams',
  },
  {
    name: 'llms.txt homes-delivered bullet',
    re: /- 500\+ homes delivered/g,
    to: () => '- 100+ homes delivered',
  },
  {
    name: 'llms.txt company-summary Q&A',
    re: /Bongshai Housing Ltd\. is a leading PEB company headquartered in Uttara, Dhaka, with 20\+ years of experience, ISO 9001:2015 certification, and a portfolio spanning 500\+ delivered projects across all 64 districts of Bangladesh\./g,
    to: () =>
      'Bongshai Housing Ltd. is a leading PEB company headquartered in Uttara, Dhaka, with 18+ years of experience and a portfolio spanning 100+ delivered projects nationwide across Bangladesh.',
  },
  {
    name: 'llms.txt coverage Q&A',
    re: /A: All 64 districts of Bangladesh, with dedicated project teams in Dhaka, Chattogram, and Cumilla, and project capability in all 8 administrative divisions\./g,
    to: () =>
      'A: Nationwide across Bangladesh, with dedicated project teams in Dhaka, Chattogram, and Cumilla, and project capability in all 8 administrative divisions.',
  },
  {
    name: 'llms-full.txt intro coverage sentence',
    re: /Bongshai Housing serves all 64 districts of Bangladesh, with dedicated project teams in Dhaka, Chattogram, and Cumilla\./g,
    to: () =>
      'Bongshai Housing serves customers nationwide across Bangladesh, with dedicated project teams in Dhaka, Chattogram, and Cumilla.',
  },
  {
    name: 'llms-full.txt company-stats sentence',
    re: /The company was founded in 2008, has delivered 500\+ completed projects, employs 200\+ engineering and construction professionals, and holds a 98% client satisfaction rate\./g,
    to: () =>
      'The company was founded in 2008, has delivered 100+ completed projects, employs 175+ engineering and construction professionals, and holds a 99% client satisfaction rate.',
  },
  {
    name: 'llms-full.txt divisions coverage line',
    re: /Bongshai Housing serves all 64 districts of Bangladesh across all 8 administrative divisions:/g,
    to: () => 'Bongshai Housing serves customers nationwide across all 8 administrative divisions of Bangladesh:',
  },
  {
    name: 'llms-full.txt closing coverage line',
    re: /All 64 districts of Bangladesh\. Dedicated project teams in Dhaka, Chattogram, and Cumilla\./g,
    to: () => 'Nationwide across Bangladesh. Dedicated project teams in Dhaka, Chattogram, and Cumilla.',
  },
  // --- Round 3 ---
  {
    name: 'about.html/njk meta description coverage',
    re: /delivering residential prefab homes, industrial factory sheds, and turnkey EPC projects across all 64 districts of Bangladesh\./g,
    to: () =>
      'delivering residential prefab homes, industrial factory sheds, and turnkey EPC projects nationwide across Bangladesh.',
  },
  {
    name: 'theme.js admin preview text',
    re: /live metrics \(64 districts, 500\+ projects\)/g,
    to: () => 'live metrics (nationwide, 100+ projects)',
  },
  {
    name: 'faq.md coverage answer',
    re: /We serve all 64 districts of Bangladesh, with dedicated project teams based in Dhaka, Chattogram, and Cumilla\. See our full district-by-district service area list for details on your region\./g,
    to: () =>
      'We serve customers nationwide across Bangladesh, with dedicated project teams based in Dhaka, Chattogram, and Cumilla. See our full district-by-district service area list for details on your region.',
  },
  {
    name: 'service-areas.html/njk hero coverage line',
    re: /Bongshai Housing provides prefab steel building construction and EPC services across all 64 districts of Bangladesh\. We deliver turnkey structural solutions for residential, commercial, and industrial sectors nationwide\./g,
    to: () =>
      'Bongshai Housing provides prefab steel building construction and EPC services nationwide across Bangladesh. We deliver turnkey structural solutions for residential, commercial, and industrial sectors nationwide.',
  },
  {
    name: 'service-areas.md hero coverage line',
    re: /Bongshai Housing proudly operates across all 64 districts and thanas in Bangladesh, delivering premium steel buildings and real estate solutions nationwide\./g,
    to: () =>
      'Bongshai Housing proudly operates nationwide across Bangladesh, delivering premium steel buildings and real estate solutions nationwide.',
  },
  // --- Round 4: remaining ISO 9001 "certified" instances ---
  {
    name: 'Product/project desc suffix - "ISO 9001:2015 certified. Founded 2008."',
    re: / ISO 9001:2015 certified\. Founded 2008\./g,
    to: () => ' Founded 2008.',
  },
  {
    name: 'Product/project desc suffix - "ISO 9001:2015 certified construction. Founded 2008."',
    re: / ISO 9001:2015 certified construction\. Founded 2008\./g,
    to: () => ' Founded 2008.',
  },
  {
    name: 'District page desc suffix - "Founded 2008. ISO 9001:2015 certified."',
    re: /Founded 2008\. ISO 9001:2015 certified\./g,
    to: () => 'Founded 2008.',
  },
  {
    name: 'about.html/njk certified-company FAQ answer',
    re: /Yes\. Bongshai Housing holds ISO 9001:2015 Quality Management certification and follows OHSAS 18001 \/ ISO 45001 occupational health and safety standards\. The company operates an in-house material testing laboratory, testing all steel, concrete, and panel components before use on every project\./g,
    to: () =>
      'Yes. Bongshai Housing follows BNBC 2020 and AISC structural design codes and applies rigorous quality-control checks at every stage of construction.',
  },
  {
    name: 'team-quality-control.html/njk meta description',
    re: /Quality control team maintaining ISO 9001:2015 standards on every steel building and construction project at Bongshai Housing\./g,
    to: () =>
      'Quality control team maintaining rigorous quality standards on every steel building and construction project at Bongshai Housing.',
  },
  {
    name: 'faq.html/njk JSON-LD certified-company answer',
    re: /Yes\. Bongshai Housing is ISO 9001:2015 certified for Quality Management and follows OHSAS 18001 \/ ISO 45001 occupational health and safety standards, with in-house material testing on every steel, concrete, and panel component before use\./g,
    to: () =>
      'Yes. Bongshai Housing follows BNBC 2020 and AISC structural design codes and applies rigorous quality-control and safety checks at every stage of construction.',
  },
  {
    name: 'faq.html/njk visible certified-company answer',
    re: /Yes\. Bongshai Housing is <a href="iso-9001-certification\.html">ISO 9001:2015 certified<\/a> for Quality Management and follows <a href="ohsas-safety-certification\.html">OHSAS 18001 \/ ISO 45001<\/a> occupational health and safety standards, with <a href="material-testing-certification\.html">in-house material testing<\/a> on every steel, concrete, and panel component before use\./g,
    to: () =>
      'Yes. Bongshai Housing follows BNBC 2020 and AISC structural design codes and applies rigorous quality-control and safety checks at every stage of construction — see our <a href="certifications.html">quality &amp; safety practices</a> for details.',
  },
  {
    name: 'llms.txt ISO bullet',
    re: /- \*\*ISO 9001:2015\*\* — Quality Management System \(certified\)/g,
    to: () => '- **Quality & Safety** — BNBC 2020 & AISC structural design code compliance',
  },
  {
    name: 'llms.txt certified-company Q&A',
    re: /A: Yes — ISO 9001:2015 Quality Management, OHSAS 18001 \/ ISO 45001 Safety Standards, with in-house material testing laboratory for all steel, concrete, and panel components\./g,
    to: () =>
      'A: Bongshai Housing follows BNBC 2020 and AISC structural design codes, with rigorous quality-control and safety checks at every stage of construction.',
  },
  {
    name: 'llms-full.txt ISO bullet',
    re: /- ISO 9001:2015 Quality Management System \(certified\)/g,
    to: () => '- BNBC 2020 & AISC structural design code compliance',
  },
  {
    name: 'llms-full.txt cert-summary line',
    re: /ISO 9001:2015 \(Quality Management\), OHSAS 18001 \/ ISO 45001 \(Safety\), in-house material testing laboratory\./g,
    to: () => 'BNBC 2020 (Bangladesh National Building Code) and AISC structural design codes, with quality-control checks at every build stage.',
  },
  {
    name: 'search-index.json cert desc 1',
    re: /Bongshai Housing holds ISO 9001, OHSAS 18001, and rigorous material-testing certifications, ensuring every steel building we deliver meets international quality and safety standards\./g,
    to: () =>
      'Bongshai Housing follows BNBC 2020 and AISC structural design codes, ensuring every steel building we deliver meets rigorous quality and safety standards.',
  },
  {
    name: 'search-index.json cert desc 2',
    re: /Bongshai Housing is ISO 9001:2015 certified for Quality Management, ensuring consistent, internationally-audited standards across every steel building project we deliver in Bangladesh\./g,
    to: () =>
      'Bongshai Housing follows BNBC 2020 and AISC structural design codes for Quality Management, ensuring consistent, code-compliant standards across every steel building project we deliver in Bangladesh.',
  },
  {
    name: 'concrete-building.html/njk meta description',
    re: /ISO 9001:2015 certified quality\. Tk 2,500-2,750 per sqft\./g,
    to: () => 'built to BNBC 2020 quality standards. Tk 2,500-2,750 per sqft.',
  },
  {
    name: 'concrete-building.html/njk FAQ answer',
    re: /Yes\. All Bongshai Housing construction, including concrete buildings, is delivered under ISO 9001:2015 Quality Management certification with in-house material testing laboratory oversight\./g,
    to: () =>
      'Yes. All Bongshai Housing construction, including concrete buildings, follows BNBC 2020 and AISC structural design codes with quality checks at every build stage.',
  },
  {
    name: 'luxury-villa.html/njk FAQ answer',
    re: /and full ISO 9001:2015 certified construction\. Contact \+880 1781-636613 for a custom design consultation\./g,
    to: () => 'and full BNBC 2020-compliant construction. Contact +880 1781-636613 for a custom design consultation.',
  },
  {
    name: 'simplex-steel-building.html/njk meta description',
    re: /Grade 50 steel, ISO 9001 certified\. Tk 2,500-2,750 per sqft\./g,
    to: () => 'Grade 50 steel, BNBC 2020 compliant. Tk 2,500-2,750 per sqft.',
  },
  {
    name: 'steel-vs-concrete-comparison.html/njk why-text link',
    re: /<a href="certifications\.html">ISO 9001:2015 quality management<\/a> with in-house material testing/g,
    to: () => '<a href="certifications.html">rigorous quality management</a> with code-compliant construction',
  },
];

const manifest = { changedFiles: [], unmatchedFiles: [], perRule: {} };
for (const r of rules) manifest.perRule[r.name] = 0;

for (const file of allTargetFiles) {
  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  let newContent = content;
  let fileChanged = false;
  for (const rule of rules) {
    const before = newContent;
    newContent = newContent.replace(rule.re, (...args) => rule.to(...args));
    if (newContent !== before) {
      const count = (before.match(rule.re) || []).length;
      manifest.perRule[rule.name] += count;
      fileChanged = true;
    }
  }
  if (fileChanged) {
    manifest.changedFiles.push(path.relative(ROOT, file));
    if (APPLY) fs.writeFileSync(file, newContent, 'utf8');
  }
}

console.log(`Mode: ${APPLY ? 'APPLY (writing changes)' : 'DRY RUN (no changes written)'}`);
console.log(`Scanned ${allTargetFiles.length} files.\n`);
console.log('Replacements per rule:');
for (const [name, count] of Object.entries(manifest.perRule)) {
  console.log(`  ${count.toString().padStart(4)}  ${name}`);
}
console.log(`\n${manifest.changedFiles.length} files changed.`);
if (!APPLY) {
  console.log('\nRun again with --apply to write these changes.');
}
