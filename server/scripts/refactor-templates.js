const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'views', 'pages');
const templateFiles = [
  'apartment-building.njk',
  'concrete-building.njk',
  'container-house.njk',
  'cottage-house.njk',
  'duplex-steel-building.njk',
  'industrial-sheds.njk',
  'luxury-villa.njk',
  'multi-story-homes.njk',
  'simplex-steel-building.njk',
  'steel-house.njk',
  'tiny-house.njk',
  'wooden-house.njk',
  'worker-accommodation.njk'
];

const dynamicLoopTemplate = `
{% if dbProductsByModel._list and dbProductsByModel._list.length > 0 %}
  {% for product in dbProductsByModel._list %}
  <div class="property-card reveal" data-tilt="" data-aos="fade-up" style="--i:{{ loop.index0 }}">
      <div class="card-image">
        <img src="{{ product.main_image }}" 
             {% if product.srcset %}srcset="{{ product.srcset }}" sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 500px"{% endif %}
             alt="{{ product.title | escape }}" 
             loading="lazy" 
             style="width: 100%; height: 250px; object-fit: cover;">
        <div class="card-badge">Popular</div>
      </div>
    <div class="property-card-body" data-aos="fade-up" style="display: flex; flex-direction: column; gap: 8px; padding: 16px; background: white;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="property-type" style="margin-bottom: 0; font-size: 0.78rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px;">{{ dbCategory.name }}</span>
        <span style="background: rgba(30, 64, 175, 0.08); color: var(--primary); font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 12px; letter-spacing: 0.3px;">🔧 Turnkey</span>
      </div>
      <h2 class="property-name" style="font-size: 1.25rem; font-weight: 800; color: var(--grey-900); margin: 0; line-height: 1.2; font-family: var(--font-heading);">{{ product.title }}</h2>
      <div class="property-specs" style="display: flex; flex-wrap: wrap; gap: 6px; font-size: 0.8rem; color: var(--grey-700); margin: 2px 0;">
        {% for spec in product.specs %}
        <span style="background: var(--off-white); padding: 4px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">{{ spec.spec_value }} {{ spec.spec_label }}</span>
        {% endfor %}
      </div>
      <p class="property-desc" style="font-size: 0.84rem; color: var(--grey-600); line-height: 1.4; margin: 0;">{{ product.description | truncate(100) }}</p>
      <div class="property-price" style="display: flex; flex-direction: column; align-items: flex-start; padding: 8px 12px; background: #f8fafc; border-radius: 8px; border-left: 3px solid var(--primary); margin-top: auto;">
        <span class="property-price-label" style="font-size: 0.68rem; color: var(--grey-500); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Fixed Package Price</span>
        <span class="property-price-value" style="font-size: 1.25rem; color: var(--primary); font-weight: 800; display: flex; align-items: baseline; gap: 4px;">
          {% if product.fixed_price %}
            ৳{{ product.fixed_price }} <span style="font-size: 0.75rem; color: var(--grey-500); font-weight: 600;">BDT</span>
          {% elif product.price_per_sqft %}
            ৳{{ product.price_per_sqft }} <span style="font-size: 0.75rem; color: var(--grey-500); font-weight: 600;">BDT/sqft</span>
          {% else %}
            Contact for Price
          {% endif %}
        </span>
      </div>
      <a class="btn btn-primary" href="{{ product.slug }}.html" style="width: 100%; justify-content: center; padding: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px;">View Details ➔</a>
    </div>
  </div>
  {% endfor %}
{% else %}
  <p>No models available for this category yet.</p>
{% endif %}
`;

function processFile(filename) {
  const filePath = path.join(targetDir, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${filename}, not found.`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find the <div class="stagger product-grid"> and everything inside it until the closing </div>
  // Wait, finding the matching closing tag with regex is hard, but we can just use a simple trick if the grid structure is consistent.
  // The grid starts with `<div class="stagger product-grid">` and ends before `</main>` or `<section class="cta-section">`.
  // Let's use a simpler replacement: we locate `<div class="stagger product-grid">` and the first `</section>` after it.
  
  const startIdx = content.indexOf('<div class="stagger product-grid">');
  if (startIdx === -1) {
    console.log(`Could not find product-grid in ${filename}`);
    return;
  }
  
  // The grid div is closed right before the section closes, usually. Let's find the closing </div> of the stagger product-grid.
  // We can just find the end of the property cards by looking for the last `</div></div>` or similar, but let's do bracket counting.
  
  let depth = 0;
  let endIdx = -1;
  let i = startIdx;
  
  // start of <div class="stagger product-grid">
  let inTag = false;
  let currentTag = "";
  let tagType = ""; // open or close
  
  while (i < content.length) {
    if (content[i] === '<' && content[i+1] !== '!' && content[i+1] !== '%') {
      let j = i + 1;
      let isClosing = false;
      if (content[j] === '/') {
        isClosing = true;
        j++;
      }
      let tagName = "";
      while (j < content.length && /[a-zA-Z0-9\-]/.test(content[j])) {
        tagName += content[j];
        j++;
      }
      tagName = tagName.toLowerCase();
      if (tagName === 'div') {
        if (isClosing) depth--;
        else depth++;
      }
      
      if (depth === 0) {
        endIdx = content.indexOf('>', j) + 1;
        break;
      }
    }
    i++;
  }
  
  if (endIdx === -1) {
    console.log(`Failed to find closing tag for ${filename}`);
    return;
  }
  
  const newGrid = `<div class="stagger product-grid">\n${dynamicLoopTemplate}\n</div>`;
  const newContent = content.substring(0, startIdx) + newGrid + content.substring(endIdx);
  
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`Successfully refactored ${filename}`);
}

for (const file of templateFiles) {
  processFile(file);
}
