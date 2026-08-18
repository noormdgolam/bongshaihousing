const { getSeoSettings } = require('./settings');

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

class SeoAiError extends Error {}

// Uses Node's built-in fetch (Node 18+) rather than adding an SDK
// dependency - this app's package.json is deliberately kept minimal for
// this host's tight install-memory limits (see project-node-hosting-quirks).
async function callClaude(systemPrompt, userPrompt, { maxTokens = 1024 } = {}) {
  const settings = await getSeoSettings();
  const apiKey = settings.anthropic_api_key;
  if (!apiKey) throw new SeoAiError('No Anthropic API key configured. Add one in SEO > Settings first.');

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': API_VERSION,
    },
    body: JSON.stringify({
      model: settings.claude_model || 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new SeoAiError(`Claude API error (${res.status}): ${errBody.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = (data.content || []).map((block) => block.text || '').join('').trim();
  if (!text) throw new SeoAiError('Claude returned an empty response.');
  return text;
}

module.exports = { callClaude, SeoAiError };
