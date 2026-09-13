const https = require('https');
let db;
try {
  db = require('./db');
} catch (e) {
  db = null;
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL_NAME = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

/**
 * Knowledge Base for Bongshai Housing
 */
const BONGSHAI_KNOWLEDGE = `
COMPANY PROFILE:
- Name: Bongshai Housing (বংশাই হাউজিং)
- Industry: Pre-Engineered Steel Buildings (PEB), Steel Composite Buildings, Modular Prefab Housing, Container Homes, and EPC Turnkey Real Estate.
- Headquarters: House #18, Road #18, Sector #10, Uttara, Dhaka-1230, Bangladesh.
- Hotlines / WhatsApp: +880 1781-636613, +880 1714-104940
- Email: sales@bongshai.com
- Experience: Engineering excellence since 2008 (18+ years in Bangladesh), 100+ completed projects nationwide, nationwide service coverage.

CORE ADVANTAGES OVER TRADITIONAL RCC:
1. Speed: Full construction in 45-60 days (vs 12-18 months for conventional brick/RCC).
2. Safety: High earthquake resistance (designed as per BNBC Zone 4 seismic codes).
3. Weather & Cyclone Resistance: Wind load tolerance up to 200+ km/h.
4. Longevity: 50+ years design life with anti-rust galvanized steel & premium cladding.
5. Termite & Moisture Proof: Fire-retardant sandwich PUF/Rockwool insulation panels.
6. Cost Efficiency: 20-30% overall savings with minimal foundation load and zero material wastage.

PRICING MODEL - IMPORTANT, READ CAREFULLY:
Every model now has a FIXED total package price (not a per-sq.ft rate you
calculate from). There is no "your floor area x rate" estimate to compute.
Your job is to help the customer find and compare the specific model(s)
whose price and floor area already fit what they're looking for, using the
real model list below ("LIVE OFFICIAL PRODUCT CATALOG"), and quote ONLY
the fixed prices given there - never invent, calculate, or extrapolate a
price for a model that isn't in that list. If nothing in the catalog fits
what they described, say so honestly and offer to connect them with an
engineer for a custom quote instead of guessing a number.

POPULAR MODELS:
- BH-SB-302: Popular 3-bedroom simplex steel house (approx 900-1200 sq.ft), ideal for suburban & village plots.
- BH-CB-901 / BH-CB-902: 4-bedroom modern steel composite duplex villa.
- BH-DV-201: Luxury duplex with panoramic glass balconies.
- Container Homes (20ft & 40ft): Prefab mobile living/office solutions.

SALES GUIDANCE & TONE:
- Be warm, extremely knowledgeable, honest, and helpful like a senior civil engineer and sales consultant.
- When replying in Bengali (বাংলা), use standard grammatical Bengali (বাংলা ব্যাকরণ) with proper civil engineering context (e.g., floor is 'তলা', manufacturing/framing is 'ফেব্রিকেশন', 'প্রি-ইঞ্জিনিয়ার্ড স্টিল বিল্ডিং', 'ভূমিকম্প সহনশীল').
- Always provide clear, direct answers first (under 45 words), followed by the specific matching model(s) and their real fixed prices from the catalog.
- For an exact quote or a model outside the catalog, direct them to submit an inquiry at bongshaihousing.com/solutions.html or connect on WhatsApp (+8801781636613) - don't imply there's an instant calculator on that page, it's a sales inquiry form.
- Do NOT end every reply with a WhatsApp or consultation line. Offer it once, and
  only when the customer is ready for real numbers or you genuinely cannot help
  (see WHEN YOU CANNOT HELP). Repeating it in every message reads as spam.
`;

const { formatTaka } = require('./format');
const fs = require('fs');
const path = require('path');

/**
 * Fetch dynamic product and project highlights from the database or seed JSON
 */
// The catalogue the assistant is allowed to quote from.
//
// Every published model is summarised by category, always - a truncated list is
// how the assistant ended up telling a customer that Container House prices did
// not exist when all twelve of them have one. Full per-model lines are included
// only for what the conversation is actually about, which keeps the request
// well inside the free tier's tokens-per-minute while never being wrong about
// what is on offer.
async function getDynamicCatalogContext(recentText = '') {
  let products = [];
  if (db) {
    try {
      products = await db('products')
        .where({ published: true })
        .select('model_number', 'title', 'fixed_price', 'total_floor_area', 'slug', 'category_id');
    } catch (err) {
      console.warn('Dynamic catalog query failed:', err.message);
      products = [];
    }
  }
  if (!products.length) return '';

  let categories = [];
  if (db) {
    try {
      categories = await db('categories').select('id', 'name');
    } catch (err) { categories = []; }
  }
  const catName = new Map(categories.map((c) => [c.id, c.name]));

  const groups = new Map();
  for (const p of products) {
    const name = catName.get(p.category_id) || 'Other';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(p);
  }

  const priced = (list) => list.filter((p) => Number(p.fixed_price) > 0);
  const line = (p) => `${p.model_number} | ${p.total_floor_area || '?'} sq.ft | ${
    Number(p.fixed_price) > 0 ? formatTaka(p.fixed_price) : 'price not set yet'} | /${p.slug}`;

  // What is the customer actually asking about?
  const hay = String(recentText || '').toLowerCase();
  const wanted = new Set();
  for (const [name] of groups) {
    const words = name.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    if (words.some((w) => hay.includes(w))) wanted.add(name);
  }
  // Bengali names for the same categories.
  const BN = {
    'কনটেইনার': 'Container House', 'container': 'Container House',
    'কটেজ': 'Luxury Cottage House', 'cottage': 'Luxury Cottage House',
    'ডুপ্লেক্স': 'Duplex Prefab Building', 'duplex': 'Duplex Prefab Building',
    'সিমপ্লেক্স': 'Simplex Prefab Building', 'simplex': 'Simplex Prefab Building',
    'টাইনি': 'Tiny House', 'tiny': 'Tiny House',
    'কাঠ': 'Wooden House', 'wooden': 'Wooden House',
    'স্টিল': 'Steel House', 'steel house': 'Steel House',
    'অ্যাপার্টমেন্ট': 'Apartment Building', 'apartment': 'Apartment Building',
    'কংক্রিট': 'Concrete Building', 'concrete': 'Concrete Building',
    'লো কস্ট': 'Low Cost House', 'low cost': 'Low Cost House',
  };
  for (const key of Object.keys(BN)) {
    if (hay.includes(key) && groups.has(BN[key])) wanted.add(BN[key]);
  }
  // An explicit model number always wins.
  const asked = (hay.match(/bh-[a-z]+-\d+/gi) || []).map((m) => m.toUpperCase());

  let out = '\nLIVE OFFICIAL CATALOGUE. Every price below is a fixed package price '
    + 'set by the business. Quote these; never say a price is unavailable for a '
    + 'model that has one.\n\nWHAT WE OFFER (all of it):\n';

  for (const [name, list] of groups) {
    const withPrice = priced(list);
    const areas = list.map((p) => Number(p.total_floor_area)).filter(Boolean);
    if (withPrice.length) {
      const prices = withPrice.map((p) => Number(p.fixed_price));
      out += `- ${name}: ${list.length} models, ${
        areas.length ? Math.min(...areas) + '-' + Math.max(...areas) + ' sq.ft, ' : ''}${
        formatTaka(Math.min(...prices))} to ${formatTaka(Math.max(...prices))}\n`;
    } else {
      out += `- ${name}: ${list.length} models, prices not published yet - take their number and have the team call back\n`;
    }
  }

  const detail = products.filter((p) => asked.includes(p.model_number)
    || wanted.has(catName.get(p.category_id) || 'Other'));
  if (detail.length && detail.length <= 40) {
    out += '\nDETAIL FOR WHAT THEY ASKED ABOUT:\n';
    detail.forEach((p) => { out += '- ' + line(p) + '\n'; });
  } else {
    // Nothing specific yet: one cheapest example per category, so an opening
    // answer can still be concrete.
    out += '\nEXAMPLES (cheapest in each category):\n';
    for (const [, list] of groups) {
      const withPrice = priced(list).sort((a, b) => a.fixed_price - b.fixed_price);
      if (withPrice.length) out += '- ' + line(withPrice[0]) + '\n';
    }
  }
  return out;
}

// Several keys, so one key's tokens-per-minute ceiling is not the whole
// service's ceiling. GROQ_API_KEYS is comma-separated; GROQ_API_KEY still works
// on its own, so a host with one key configured needs no change.
//
// Keys are read fresh each call rather than cached at require time: the .env is
// edited on the host and the app is restarted, and a stale module-level copy
// would quietly keep using the old set.
function groqKeys() {
  const many = String(process.env.GROQ_API_KEYS || '')
    .split(',').map((k) => k.trim()).filter(Boolean);
  if (many.length) return many;
  const one = String(process.env.GROQ_API_KEY || '').trim();
  return one ? [one] : [];
}

// Where the next request starts. Round-robin rather than always-first, so load
// is spread instead of hammering key 1 until it 429s.
let keyCursor = 0;

// A failure worth retrying on a different key: rate limit, or a key that is
// rejected outright. Anything else (a bad request, a dead model) would fail
// identically on every key, so it is raised immediately.
function shouldTryNextKey(status) {
  return status === 429 || status === 401 || status === 403;
}

/**
 * Call Groq Cloud API with OpenAI-compatible payload
 */
async function callGroqAPI(messages, userContext = {}) {
  const keys = groqKeys();
  if (!keys.length) {
    throw new Error('No Groq API key configured (set GROQ_API_KEYS or GROQ_API_KEY).');
  }

  // The catalogue narrows to what they are asking about, so it needs the text.
  const recentText = messages.filter((m) => m.role === 'user').slice(-3)
    .map((m) => m.content || '').join(' ');
  const dynamicCatalog = await getDynamicCatalogContext(recentText);

  // Language is an explicit user choice from the widget's EN/BN toggle, not
  // auto-detected from the message text - auto-detection was producing
  // answers that mixed or guessed the wrong language regardless of what the
  // customer actually wanted to read.
  const languageInstruction = userContext.language === 'en'
    ? 'Respond only in fluent, natural English, regardless of what language the user\'s message is written in.'
    : 'Respond only in fluent, standard Bengali (বাংলা), regardless of what language the user\'s message is written in.';

  const systemPrompt = {
    role: 'system',
    content: `${BONGSHAI_KNOWLEDGE}\n${dynamicCatalog}\n
CURRENT USER CONTEXT:
- Viewing Page: ${userContext.pageUrl || 'Home'}
- Page Title: ${userContext.pageTitle || 'Bongshai Housing'}

YOU ARE BONGSHAI HOUSING'S CUSTOMER SUPPORT.

Write the way a good Bongshai representative actually talks to a customer:
warm, unhurried, competent. Never like a chatbot.

HOW TO TALK
- Short replies. Two or three sentences is usually enough. A customer on a
  phone will not read a wall of text.
- Speak naturally. In Bengali use the ordinary spoken register a Dhaka office
  would use with a customer - "ভাই"/"আপা" where it fits, "জি", "অবশ্যই",
  "ঠিক আছে". Never stiff, textbook Bengali.
- Answer the question first, then ask ONE natural follow-up. Never fire a list
  of questions at someone.
- Remember what they already told you. If they said 3 katha and two storeys,
  do not ask again - build on it.
- No bullet points or numbered lists unless you are genuinely listing models or
  steps. Normal conversation is prose.
- At most one emoji, and usually none.
- Never say "As an AI", "I am an AI language model", "I cannot", or any variant.
  You are Customer Support, so speak as Bongshai: "we build", "our team",
  "আমরা".
- If someone asks directly whether they are talking to a person or a bot, be
  honest and easy about it: say you are Bongshai's support assistant and you can
  put them in touch with the team on WhatsApp right away. Never claim to be a
  specific named human. Do not make up a name for yourself.

LOCATION
- Their name and number are already on file before the chat starts; never ask
  for those again.
- Do NOT open by asking where they are. Ask for district/upazila later, and only
  when it actually changes your answer - delivery distance, a site visit, or a
  regional price difference. Ask it as one natural question in the flow.

UNDERSTANDING THE CUSTOMER
- Expect typos, Banglish, mixed script and half-sentences. Work out the intent
  and answer it; never correct their spelling or ask them to rephrase.
- "কত টাকা লাগবে" almost always means total build cost, not rate per sqft.
  Get to a number, or to the one fact you need to give a number.

ABOUT NUMBERS
- Quote from the live catalogue above. Do not invent prices, rates or timelines.
- Cost depends mainly on total square footage and finishing level - say that
  plainly, then ask which one you still need.
- Give ranges, and be clear they are indicative, not a final quotation. The
  engineers confirm after seeing the site.
- ${languageInstruction}

CLOSING
- When they are ready for real numbers, offer WhatsApp (+8801781636613) or the
  quote form - as a helpful next step, not a sales push. Do not end every single
  message with it.

WHEN YOU CANNOT HELP
There is no floating WhatsApp button on the site any more, so handing over is
your job, not a button's. Hand over when - and only when - one of these is true:
  - the question needs a real engineer (structural design, soil, permits, a
    site-specific judgement)
  - they want a firm, committed quotation rather than an indicative range
  - they have asked something twice and you still have not understood it
  - they are unhappy, or asking about an existing order, payment or complaint
  - the answer is simply not in what you know about Bongshai

Do NOT hand over just because a question is slightly unusual - try first.

When you do hand over, say plainly that you are passing them to the team and
give the number ONCE, in the language the customer is reading. Never print it
twice, and never repeat the same message in the other language - they chose a
language with the EN/BN toggle. Like this:

  বাংলা: এই প্রশ্নটার সঠিক উত্তর আমাদের ইঞ্জিনিয়ার ভাই দিতে পারবেন। সরাসরি
  হোয়াটসঅ্যাপে কথা বলুন: wa.me/8801781636613 (+880 1781-636613)

  English: Our engineer can answer this one properly. Message the team directly
  on WhatsApp: wa.me/8801781636613 (+880 1781-636613)

Use only the customer's own language. Never apologise at length, never say you
are "unable to" - just point them at the person who can help.

NEVER hand over for a price that is in the catalogue above. If a model has a
fixed price, give it. Handing over instead of answering a question you can
answer is the single worst thing you can do here.

Worked example of the right register:
  Customer: ভাই, ৩ কাঠা জমিতে দুই তলা বাড়ি করতে কত টাকা লাগতে পারে?
  You: অবশ্যই ভাই, ৩ কাঠা জমিতে দুই তলা বাড়ি করা যাবে। খরচটা মূলত নির্ভর করবে
       মোট কত বর্গফুট করছেন আর ফিনিশিং কেমন চান তার উপর। বাড়িটা আনুমানিক কত
       বর্গফুট করতে চাচ্ছেন?
`
  };

  const payload = JSON.stringify({
    model: MODEL_NAME,
    messages: [systemPrompt, ...messages],
    temperature: 0.6,
    max_tokens: 600,   // replies are meant to be 2-3 sentences; Groq reserves this against TPM
  });

  // One attempt per key. A rate-limited or rejected key is the next key's
  // problem, not the customer's.
  const errors = [];
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const idx = (keyCursor + attempt) % keys.length;
    try {
      const out = await sendWithKey(keys[idx], payload);
      keyCursor = (idx + 1) % keys.length;   // next request starts on the next key
      return out;
    } catch (err) {
      // Never log the key itself - stderr.log is readable over FTP.
      const label = `key ${idx + 1}/${keys.length}`;
      errors.push(`${label}: ${err.message}`);
      if (!err.groqStatus || !shouldTryNextKey(err.groqStatus)) {
        throw err;
      }
      console.warn(`[groq] ${label} unusable (${err.groqStatus}), trying the next key`);
    }
  }
  throw new Error(`All ${keys.length} Groq key(s) failed. ${errors.join(' | ')}`);
}

// A single request on one key. Rejections carry groqStatus so the caller can
// tell "this key is exhausted" from "this request is wrong".
function sendWithKey(apiKey, payload) {
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
        // Collect raw Buffer chunks and decode once at the end. Bengali is
        // almost entirely multi-byte UTF-8 sequences; decoding each TCP chunk
        // separately corrupts any character whose bytes straddle a boundary.
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const data = JSON.parse(body);
              const message = data.choices && data.choices[0] && data.choices[0].message
                ? data.choices[0].message.content : '';
              resolve(message);
            } catch (e) {
              reject(new Error('Failed to parse Groq response: ' + e.message));
            }
          } else {
            const err = new Error(`Groq API returned status ${res.statusCode}: ${body}`);
            err.groqStatus = res.statusCode;
            reject(err);
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
