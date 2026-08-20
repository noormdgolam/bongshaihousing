const db = require('../db');
const { callAI } = require('./ai-client');

const SYSTEM_PROMPT = `You are an SEO copywriter for Bongshai Housing, a real prefab steel building company in Bangladesh selling readymade steel houses, duplexes, cottages, and industrial sheds. You write factual, specific, non-generic SEO copy grounded ONLY in the data given to you - never invent prices, specs, or claims not present in the input. Write for a Bangladeshi audience; Taka pricing, district-level geography.`;

// Groq's structured-outputs mode (see ai-client.js) guarantees a response
// matching this schema exactly - the field enum also does double duty as
// input validation, since FIELD_MAP below only recognizes these four names.
const RESPONSE_SCHEMA = {
  name: 'seo_suggestions',
  schema: {
    type: 'object',
    properties: {
      suggestions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string', enum: ['meta_title', 'meta_description', 'alt_text', 'content_copy'] },
            value: { type: 'string' },
            reasoning: { type: 'string' },
          },
          required: ['field', 'value', 'reasoning'],
          additionalProperties: false,
        },
      },
    },
    required: ['suggestions'],
    additionalProperties: false,
  },
};

function buildProductPrompt(product) {
  return `Product: ${product.title} (model ${product.model_number})
Category: ${product.category_name || 'N/A'}
Price: ${product.price_per_sqft ? `Tk ${product.price_per_sqft}/sqft` : 'not set'}
Current description: ${product.description || '(none)'}
Current meta_title: ${product.meta_title || '(none)'}
Current meta_description: ${product.meta_description || '(none)'}
Current main image alt text: ${product.main_image_alt || '(none)'}

Generate, grounded strictly in the facts above:
1. field "meta_title": an SEO title under 60 characters, must include the model number or building type and "Bongshai Housing".
2. field "meta_description": under 155 characters, must include the price if known, and a clear reason to click.
3. field "alt_text": descriptive alt text for the main product image, under 125 characters.
4. field "content_copy": ONLY if the current description is missing or under 80 characters - a factual 2-3 sentence product description using nothing but the facts given above. Skip this field entirely if a real description already exists; do not rewrite copy that already reads fine.

Only include fields that are missing or clearly weak - skip any that are already good. If everything already reads fine, return an empty suggestions list.`;
}

async function generateForProduct(productId) {
  const product = await db('products')
    .leftJoin('categories', 'categories.id', 'products.category_id')
    .where('products.id', productId)
    .select('products.*', 'categories.name as category_name')
    .first();
  if (!product) throw new Error('Product not found');

  const raw = await callAI(SYSTEM_PROMPT, buildProductPrompt(product), { maxTokens: 800, responseSchema: RESPONSE_SCHEMA });
  // Structured-outputs mode guarantees this parses and matches the schema -
  // no fence-stripping or shape-checking needed, Groq's constrained decoding
  // can't produce anything else.
  const items = JSON.parse(raw).suggestions;

  const FIELD_MAP = {
    meta_title: { suggestionType: 'meta_title', current: product.meta_title },
    meta_description: { suggestionType: 'meta_description', current: product.meta_description },
    alt_text: { suggestionType: 'alt_text', current: product.main_image_alt },
    content_copy: { suggestionType: 'content_copy', current: product.description },
  };

  const label = `${product.model_number} - ${product.title}`;
  const rows = [];
  for (const item of items) {
    const mapping = FIELD_MAP[item.field];
    if (!mapping || !item.value) continue;
    rows.push({
      suggestion_type: mapping.suggestionType,
      target_type: 'product',
      target_id: product.id,
      target_label: label,
      field_name: item.field,
      current_value: mapping.current || null,
      suggested_value: String(item.value).trim(),
      reasoning: item.reasoning || null,
      status: 'pending',
    });
  }
  if (rows.length) await db('seo_suggestions').insert(rows);
  return rows.length;
}

// Batch entry point for both the manual "Generate Suggestions" button and
// the cron-triggered automation - caps how many products get sent to the
// API per run so a single click (or a misconfigured cron interval) can't
// run up an unbounded bill.
async function generateBatch(limit = 10) {
  const candidates = await db('products')
    .where({ published: true })
    .andWhere((qb) => {
      qb.whereNull('meta_title').orWhereNull('meta_description').orWhereNull('main_image_alt');
    })
    .whereNotIn('id', db('seo_suggestions').select('target_id').where({ target_type: 'product', status: 'pending' }))
    .orderBy('updated_at', 'asc')
    .limit(limit);

  let total = 0;
  const errors = [];
  for (const p of candidates) {
    try {
      total += await generateForProduct(p.id);
    } catch (e) {
      errors.push(`${p.model_number}: ${e.message}`);
    }
  }
  return { productsProcessed: candidates.length, suggestionsCreated: total, errors };
}

module.exports = { generateForProduct, generateBatch };
