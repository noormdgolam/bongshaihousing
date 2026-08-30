const fs = require('fs');
const path = require('path');

const CATEGORY_FILE = 'server/views/pages/low-cost-house.njk';
const REGISTRY_FILE = 'server/page-registry.json';
const BASE_MODEL = 'BH-LCH';
const START_INDEX = 1201;

// 1. Create the Category Page
let categoryHtml = fs.readFileSync('server/views/pages/apartment-building.njk', 'utf8');
categoryHtml = categoryHtml.replace(/Apartment Building/g, 'Low Cost House');
categoryHtml = categoryHtml.replace(/Apartment building/g, 'Low cost house');
categoryHtml = categoryHtml.replace(/apartment-building/g, 'low-cost-house');
categoryHtml = categoryHtml.replace(/Two-floor steel-composite apartment buildings designed for multi-family or rental-style living/g, 'Affordable and durable low cost housing options for all');

// Generate 20 property cards
let cardsHtml = '';
for (let i = 0; i < 20; i++) {
    const modelNum = START_INDEX + i;
    const modelName = `${BASE_MODEL}-${modelNum}`;
    cardsHtml += `
<div class="property-card reveal" data-tilt="" data-aos="fade-up" style="--i:${i}">
<div class="property-img-wrap"><img alt="Bongshai Housing Model No-${modelName}" loading="lazy" src="images/products/${modelName.toLowerCase()}.webp" sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 500px" title="Bongshai Housing Model No-${modelName}" width="1024" height="1024"></div>
<div class="property-card-body" data-aos="fade-up" style="display: flex; flex-direction: column; gap: 8px; padding: 16px; background: white;">
  <div style="display: flex; justify-content: space-between; align-items: center;">
    <span class="property-type" style="margin-bottom: 0; font-size: 0.78rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px;">Low Cost House</span>
    <span style="background: rgba(30, 64, 175, 0.08); color: var(--primary); font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 12px; letter-spacing: 0.3px;">⚡ Coming Soon</span>
  </div>
  <h2 class="property-name" style="font-size: 1.25rem; font-weight: 800; color: var(--grey-900); margin: 0; line-height: 1.2; font-family: var(--font-heading);">Model No-${modelName}</h2>
  <p class="property-desc" style="font-size: 0.84rem; color: var(--grey-600); line-height: 1.4; margin: 0;">An affordable low cost house designed for maximum value.</p>
  <div class="property-price" style="display: flex; flex-direction: column; align-items: flex-start; padding: 8px 12px; background: #f8fafc; border-radius: 8px; border-left: 3px solid var(--primary); margin-top: auto;">
    <span class="property-price-label" style="font-size: 0.68rem; color: var(--grey-500); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Fixed Package Price</span>
    <span class="property-price-value" style="font-size: 1.25rem; color: var(--primary); font-weight: 800; display: flex; align-items: baseline; gap: 4px;">Coming Soon</span>
  </div>
  <a class="btn btn-primary" href="${modelName.toLowerCase()}.html" style="width: 100%; justify-content: center; padding: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; pointer-events: none; opacity: 0.8;">Coming Soon →</a>
</div></div>
`;
}

// Replace the grid content in the category page
categoryHtml = categoryHtml.replace(/<div class="stagger product-grid">([\s\S]*?)<\/div><\/div>\s*<!-- \/page-sidebar-content -->/, `<div class="stagger product-grid">\n${cardsHtml}\n</div></div>\n<!-- /page-sidebar-content -->`);
// In case the regex doesn't match perfectly, let's do a more robust replace
let parts = categoryHtml.split('<div class="stagger product-grid">');
let bottomParts = parts[1].split('</div></div>\n\n<div class="property-card reveal"');
if(bottomParts.length === 1) {
    // try different split
    bottomParts = parts[1].split('<button type="button" class="mv-nav mv-next" aria-label="Next">');
    if (bottomParts.length > 1) {
        // we are replacing too much. Let's just find the end of product-grid.
    }
}

fs.writeFileSync('server/views/pages/low-cost-house.njk', categoryHtml);


// 2. Create Model Pages
let modelTemplate = fs.readFileSync('server/views/pages/bh-cb-901.njk', 'utf8');

for (let i = 0; i < 20; i++) {
    const modelNum = START_INDEX + i;
    const modelName = `${BASE_MODEL}-${modelNum}`;
    let mHtml = modelTemplate.replace(/BH-CB-901/g, modelName);
    mHtml = mHtml.replace(/Concrete Building/g, 'Low Cost House');
    mHtml = mHtml.replace(/concrete-building/g, 'low-cost-house');
    mHtml = mHtml.replace(/৳3,50,000/g, 'Coming Soon');
    mHtml = mHtml.replace(/Contact Sales/g, 'Coming Soon');
    // Save
    fs.writeFileSync(`server/views/pages/${modelName.toLowerCase()}.njk`, mHtml);
}

// 3. Update Registry
let reg = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));

// Add category
if (!reg['/low-cost-house.html']) {
    reg['/low-cost-house.html'] = {
        template: 'low-cost-house',
        title: 'Low Cost House - Affordable Steel Prefab - Bongshai Housing',
        description: 'Discover our new line of Low Cost Houses designed for affordability and durability.'
    };
}

// Add models
for (let i = 0; i < 20; i++) {
    const modelNum = START_INDEX + i;
    const modelName = `${BASE_MODEL}-${modelNum}`;
    const key = `/${modelName.toLowerCase()}.html`;
    if (!reg[key]) {
        reg[key] = {
            template: modelName.toLowerCase(),
            title: `Model No-${modelName} - Low Cost House - Bongshai Housing`,
            description: `Details and specifications for Low Cost House model ${modelName}.`
        };
    }
}

fs.writeFileSync(REGISTRY_FILE, JSON.stringify(reg, null, 2));
console.log('Successfully created Low Cost House category and 20 models.');
