// Sends a lead alert to the site owner's phone via Telegram. Optional by
// design - a missing/misconfigured token must never block the actual
// lead-capture flow (DB save + email), only add to it.
async function sendTelegramAlert(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn('Telegram alert skipped: TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID not set.');
    return;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error('Telegram alert failed:', data.description || JSON.stringify(data));
    }
  } catch (err) {
    console.error('Telegram alert error:', err.message);
  }
}

module.exports = { sendTelegramAlert };
