const https = require('https');
let db;
try {
  db = require('./db');
} catch (e) {
  db = null;
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL_NAME = 'openai/gpt-oss-120b';

/**
 * Knowledge Base for Bongshai Housing
 */
const BONGSHAI_KNOWLEDGE = `
COMPANY PROFILE:
- Name: Bongshai Housing (বঙ্গশাই হাউজিং)
- Industry: Pre-Engineered Steel Buildings (PEB), Steel Composite Buildings, Modular Prefab Housing, Container Homes, and EPC Turnkey Real Estate.
- Headquarters: House #18, Road #18, Sector #10, Uttara, Dhaka-1230, Bangladesh.
- Hotlines / WhatsApp: +880 1781-636613, +880 1714-104940
- Email: sales@bongshai.com
- Experience: 20+ years in Bangladesh (founded 2008), 500+ completed projects nationwide, service coverage across all 64 districts.

CORE ADVANTAGES OVER TRADITIONAL RCC:
1. Speed: Full construction in 45-60 days (vs 12-18 months for conventional brick/RCC).
2. Safety: High earthquake resistance (designed as per BNBC Zone 4 seismic codes).
3. Weather & Cyclone Resistance: Wind load tolerance up to 200+ km/h.
4. Longevity: 50+ years design life with anti-rust galvanized steel & premium cladding.
5. Termite & Moisture Proof: Fire-retardant sandwich PUF/Rockwool insulation panels.
6. Cost Efficiency: 20-30% overall savings with minimal foundation load and zero material wastage.

PRODUCT CATEGORIES & PRICING GUIDELINES (BDT per sq.ft, matches the site's
own published FAQ figures exactly - do not deviate from these numbers):
- Industrial Steel Sheds & Worker Accommodation: Tk 900-950 / sq.ft.
- Tiny House & Wooden House: Tk 1,500 / sq.ft.
- Cottage House: Tk 2,200 / sq.ft.
- Apartment Building, Duplex Steel Building, Simplex Steel Building, Steel House, Concrete Building: Tk 2,500-2,750 / sq.ft.
- Container House: Tk 3,000 / sq.ft.
- Custom Turnkey Luxury Resort Projects (e.g. Kokomo Sunset Resort, The Wave Resort): Custom Quotation.
- Always mention the free instant estimate tool at bongshaihousing.com/solutions.html for a precise figure.

POPULAR MODELS:
- BH-SB-302: Popular 3-bedroom simplex steel house (approx 900-1200 sq.ft), ideal for suburban & village plots.
- BH-CB-901 / BH-CB-902: 4-bedroom modern steel composite duplex villa.
- BH-DV-201: Luxury duplex with panoramic glass balconies.
- LCV-101 to LCV-109: Budget-friendly 1 to 2 bedroom prefab living units.
- Container Homes (20ft & 40ft): Prefab mobile living/office solutions.

SALES GUIDANCE & TONE:
- Be warm, extremely knowledgeable, honest, and helpful like a senior civil engineer and sales consultant.
- When replying in Bengali (বাংলা), use standard grammatical Bengali (বাংলা ব্যাকরণ) with proper civil engineering context (e.g., floor is 'তলা', manufacturing/framing is 'ফেব্রিকেশন', 'প্রি-ইঞ্জিনিয়ার্ড স্টিল বিল্ডিং', 'ভূমিকম্প সহনশীল').
- Always provide clear, direct answers first (under 45 words), followed by concise details and price estimates.
- End recommendations by encouraging the user to request a detailed free architectural consultation or connect on WhatsApp (+8801781636613).
`;

/**
 * Fetch dynamic product and project highlights from the database
 */
async function getDynamicCatalogContext() {
  if (!db) return '';
  try {
    const products = await db('products')
      .where({ published: true })
      .select('model_number', 'title', 'price_per_sqft', 'price_currency', 'slug')
      .limit(20);

    if (!products || products.length === 0) return '';

    let catalogText = '\nLIVE IN-STOCK PRODUCT CATALOG:\n';
    products.forEach(p => {
      catalogText += `- Model ${p.model_number}: "${p.title}" | Price: ${p.price_per_sqft ? p.price_per_sqft + ' ' + p.price_currency + '/sq.ft.' : 'Contact for Quote'} | Page: /${p.slug}\n`;
    });
    return catalogText;
  } catch (err) {
    console.error('Dynamic catalog context query failed:', err.message);
    return '';
  }
}

/**
 * Call Groq Cloud API with OpenAI-compatible payload
 */
async function callGroqAPI(messages, userContext = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured in server environment.');
  }

  const dynamicCatalog = await getDynamicCatalogContext();

  const systemPrompt = {
    role: 'system',
    content: `${BONGSHAI_KNOWLEDGE}\n${dynamicCatalog}\n
CURRENT USER CONTEXT:
- Viewing Page: ${userContext.pageUrl || 'Home'}
- Page Title: ${userContext.pageTitle || 'Bongshai Housing'}

INSTRUCTIONS FOR ASSISTANT:
1. Always give an Answer-First opening (direct and concise).
2. Recommend specific models or solutions matching the customer's budget, land size, or requirements.
3. Suggest estimated construction costs accurately using the guidelines.
4. If the user asks in Bengali (or Banglish), answer in fluent, standard Bengali. If in English, answer in English.
5. Provide actionable guidance and recommend contacting Bongshai Housing sales engineers on WhatsApp (+8801781636613) or submitting the Quote form.
`
  };

  const payload = JSON.stringify({
    model: MODEL_NAME,
    messages: [systemPrompt, ...messages],
    temperature: 0.6,
    max_tokens: 1024,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      GROQ_API_URL,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 15000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const data = JSON.parse(body);
              const message = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
              resolve(message);
            } catch (e) {
              reject(new Error('Failed to parse Groq response: ' + e.message));
            }
          } else {
            reject(new Error(`Groq API returned status ${res.statusCode}: ${body}`));
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Groq API request timed out after 15s'));
    });

    req.write(payload);
    req.end();
  });
}

module.exports = { callGroqAPI, BONGSHAI_KNOWLEDGE };
