const { getSeoSettings } = require('./settings');

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

class SeoAiError extends Error {}

// Groq's free tier (OpenAI-compatible chat completions format) instead of
// a paid Anthropic key - no billing setup needed to use this feature. Uses
// Node's built-in fetch (Node 18+), no SDK dependency added.
async function callAI(systemPrompt, userPrompt, { maxTokens = 1024, responseSchema = null } = {}) {
  const settings = await getSeoSettings();
  const apiKey = settings.groq_api_key;
  if (!apiKey) throw new SeoAiError('No Groq API key configured. Add one (free at console.groq.com) in SEO > Settings first.');

  const body = {
    model: settings.groq_model || 'openai/gpt-oss-120b',
    max_tokens: maxTokens,
    // gpt-oss models reason internally before answering and burn tokens
    // doing it - without capping this, a low max_tokens budget gets
    // consumed entirely by reasoning and the actual answer (message.content)
    // comes back empty. Verified directly: with reasoning_effort unset,
    // a 30-token budget produced empty content and finish_reason "length";
    // "low" + the same budget produced real content and finish_reason "stop".
    reasoning_effort: 'low',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  };
  // Groq's structured-outputs mode (strict: true) uses constrained decoding
  // to guarantee the response matches this schema exactly - no markdown
  // fences, no missing fields, no retry logic needed. Callers that don't
  // pass a schema keep getting a free-form string as before.
  if (responseSchema) {
    body.response_format = { type: 'json_schema', json_schema: { name: responseSchema.name, strict: true, schema: responseSchema.schema } };
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new SeoAiError(`Groq API error (${res.status}): ${errBody.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '').trim();
  if (!text) throw new SeoAiError('Groq returned an empty response.');
  return text;
}

module.exports = { callAI, SeoAiError };
