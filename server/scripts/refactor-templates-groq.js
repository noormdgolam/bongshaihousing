const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');

const apiKey = process.env.GROQ_API_KEY || '';
const groq = new Groq({ apiKey });

const templateFile = process.argv[2];
if (!templateFile) {
  console.error('Please provide a template filename, e.g., apartment-building.njk');
  process.exit(1);
}

const targetPath = path.join(__dirname, '..', 'views', 'pages', templateFile);
if (!fs.existsSync(targetPath)) {
  console.error(`File not found: ${targetPath}`);
  process.exit(1);
}

const content = fs.readFileSync(targetPath, 'utf8');

const prompt = `
You are an expert Nunjucks developer. I have a Nunjucks template for a category landing page that currently has hardcoded product HTML blocks.

I need you to replace the hardcoded product list inside \`<div class="stagger product-grid">\` with a dynamic Nunjucks \`{% for product in dbProductsByModel._list %}\` loop.

Here is an example of what the dynamic loop inside the grid should look like:
\`\`\`html
<div class="stagger product-grid">
{% for product in dbProductsByModel._list %}
<div class="property-card reveal" data-tilt="" data-aos="fade-up" style="--i:{{ loop.index0 }}">
<div class="property-img-wrap">{{ productImg.cardImage(dbProductsByModel, product.model_number, product.title, product.main_image, product.srcset, '(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 500px', loop.first) }}</div>
<div class="property-card-body" data-aos="fade-up" style="display: flex; flex-direction: column; gap: 8px; padding: 16px; background: white;">
  <div style="display: flex; justify-content: space-between; align-items: center;">
    <span class="property-type" style="margin-bottom: 0; font-size: 0.78rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px;">{{ dbCategory.name }}</span>
    <span style="background: rgba(30, 64, 175, 0.08); color: var(--primary); font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 12px; letter-spacing: 0.3px;">🔧 Turnkey</span>
  </div>
  <h2 class="property-name" style="font-size: 1.25rem; font-weight: 800; color: var(--grey-900); margin: 0; line-height: 1.2; font-family: var(--font-heading);">{{ product.title }}</h2>
  <div class="property-specs" style="display: flex; flex-wrap: wrap; gap: 6px; font-size: 0.8rem; color: var(--grey-700); margin: 2px 0;">
    {% for spec in product.specs %}
    <span style="background: var(--off-white); padding: 4px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">{{ spec.icon | safe }} <strong>{{ spec.value }}</strong></span>
    {% endfor %}
  </div>
  <p class="property-desc" style="font-size: 0.84rem; color: var(--grey-600); line-height: 1.4; margin: 0;">{{ product.short_description }}</p>
  <div class="property-price" style="display: flex; flex-direction: column; align-items: flex-start; padding: 8px 12px; background: #f8fafc; border-radius: 8px; border-left: 3px solid var(--primary); margin-top: auto;">
    <span class="property-price-label" style="font-size: 0.68rem; color: var(--grey-500); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Fixed Package Price</span>
    <span class="property-price-value" style="font-size: 1.25rem; color: var(--primary); font-weight: 800; display: flex; align-items: baseline; gap: 4px;">৳{{ (product.sale_price or product.base_price) | string | replace(r/\\B(?=(\\d{3})+(?!\\d))/g, ",") }} <span style="font-size: 0.75rem; color: var(--grey-500); font-weight: 600;">BDT</span></span>
  </div>
  <a class="btn btn-primary" href="{{ product.slug }}.html" style="width: 100%; justify-content: center; padding: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px;">View Details ➔</a>
</div></div>
{% else %}
<p>No models available for this category yet.</p>
{% endfor %}
</div>
\`\`\`

IMPORTANT INSTRUCTIONS:
1. Preserve the rest of the template exactly as is. Only replace the contents of \`<div class="stagger product-grid">\`.
2. Delete all the hardcoded \`<div class="property-card">\` blocks.
3. Return the FULL updated file content inside a single \`\`\`html codeblock. DO NOT add any other explanations. Just output the \`\`\`html code block.

Here is the template:
\`\`\`html
${content}
\`\`\`
`;

async function main() {
  console.log('Sending request to Groq...');
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "openai/gpt-oss-120b",
    temperature: 0.1,
  });

  const responseText = chatCompletion.choices[0]?.message?.content || '';
  
  // Extract content inside ```html ... ```
  const match = responseText.match(/\`\`\`html\n([\s\S]*?)\`\`\`/);
  if (match && match[1]) {
    fs.writeFileSync(targetPath, match[1].trim());
    console.log(`Successfully refactored ${templateFile}`);
  } else {
    console.error('Failed to parse Groq response. Raw response:');
    console.log(responseText);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
