// Sends the "new lead" notification via WhatsApp Cloud API (Meta Graph API).
// Optional by design, same as lib/telegram.js next to it - a missing/misconfigured
// token must never block lead capture, only fall through to the email notify in
// lib/leads.js.
//
// Cloud API requires a pre-approved message template for business-initiated
// messages outside an open customer conversation window. This sends exactly the
// 4 body variables documented in README (see "Lead pipeline" section): name,
// phone, district, product/model - in that order. Your approved template's body
// must declare exactly 4 {{1}}..{{4}} placeholders in that order, or Meta will
// reject the send with a parameter-count mismatch.
async function sendWhatsAppTemplate({ name, phoneDisplay, district, product }) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  const toNumber = (process.env.OWNER_WHATSAPP || '+8801781636613').replace(/\D/g, '');
  const lang = process.env.WHATSAPP_TEMPLATE_LANG || 'bn';

  if (!token || !phoneNumberId || !templateName) {
    console.warn('[whatsapp] notify skipped: WHATSAPP_TOKEN/WHATSAPP_PHONE_NUMBER_ID/WHATSAPP_TEMPLATE_NAME not set.');
    return false;
  }

  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toNumber,
      type: 'template',
      template: {
        name: templateName,
        language: { code: lang },
        components: [{
          type: 'body',
          parameters: [
            { type: 'text', text: name || 'N/A' },
            { type: 'text', text: phoneDisplay || 'N/A' },
            { type: 'text', text: district || 'N/A' },
            { type: 'text', text: product || 'N/A' },
          ],
        }],
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    console.error('[whatsapp] send failed:', data.error?.message || res.status);
    return false;
  }
  return true;
}

// The weekly report (lib/lead-report.js) is a multi-paragraph summary, not a
// 4-field lead alert - it can't use sendWhatsAppTemplate()'s template at all
// (Meta rejects a send whose parameter count doesn't match the approved
// template exactly). This sends one body variable instead, so it needs a
// *separate* approved template - one placeholder, {{1}}, holding the whole
// report text - configured via its own env var so setting up the lead-alert
// template above doesn't accidentally half-configure this one too.
async function sendWhatsAppText(bodyText) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_REPORT_TEMPLATE_NAME;
  const toNumber = (process.env.OWNER_WHATSAPP || '+8801781636613').replace(/\D/g, '');
  const lang = process.env.WHATSAPP_TEMPLATE_LANG || 'bn';

  if (!token || !phoneNumberId || !templateName) {
    console.warn('[whatsapp] report notify skipped: WHATSAPP_TOKEN/WHATSAPP_PHONE_NUMBER_ID/WHATSAPP_REPORT_TEMPLATE_NAME not set.');
    return false;
  }

  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toNumber,
      type: 'template',
      template: {
        name: templateName,
        language: { code: lang },
        components: [{ type: 'body', parameters: [{ type: 'text', text: bodyText }] }],
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    console.error('[whatsapp] report send failed:', data.error?.message || res.status);
    return false;
  }
  return true;
}

module.exports = { sendWhatsAppTemplate, sendWhatsAppText };
