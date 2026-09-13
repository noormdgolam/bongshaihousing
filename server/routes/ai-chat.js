const express = require('express');
const { callGroqAPI } = require('../lib/ai-assistant');
const { stripTags } = require('../lib/sanitize');
const supportChats = require('../lib/support-chats');
const { sendTelegramAlert } = require('../lib/telegram');

const router = express.Router();

// In-memory rate-limiter: max 15 messages per IP per minute
const rateLimits = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 15;

  const record = rateLimits.get(ip) || { count: 0, resetTime: now + windowMs };
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count++;
  }
  rateLimits.set(ip, record);

  // Clean old records periodically
  if (rateLimits.size > 2000) {
    for (const [key, val] of rateLimits.entries()) {
      if (now > val.resetTime) rateLimits.delete(key);
    }
  }

  return record.count <= maxRequests;
}

// One Telegram alert per conversation. A five-message chat should buzz the
// phone once, with who it is and how to ring them back - not five times.
// Bounded so a long-running process cannot grow this forever.
const notifiedChats = new Set();

function alertNewChat(chat, id, context, firstMessage) {
  if (!chat || notifiedChats.has(chat.id)) return;
  notifiedChats.add(chat.id);
  if (notifiedChats.size > 500) {
    // Oldest first; Set preserves insertion order.
    const drop = notifiedChats.values().next().value;
    notifiedChats.delete(drop);
  }

  const where = context.pageUrl === '/m' ? 'Mobile app' : (context.pageUrl || 'website');
  const lines = [
    '\u{1F4AC} New Customer Support chat',
    '',
    'Name : ' + (id.name || '-'),
    'Phone: ' + (id.phone || '-'),
    'From : ' + where,
    '',
    'First message:',
    String(firstMessage || '').slice(0, 300),
    '',
    'Read the full chat: https://bongshaihousing.com/admin/support-chats',
  ];
  // Fire and forget: an alert must never delay or fail the customer's reply.
  sendTelegramAlert(lines.join('\n')).catch(() => {});
}

router.post('/api/ai-chat', async (req, res) => {
  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please wait a moment or contact us directly on WhatsApp (+8801781636613).'
    });
  }

  const { messages, context, identity } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide at least one message.'
    });
  }

  // Identity is required before anyone can chat. An enquiry the business cannot
  // call back is worth very little, and this is what turns a conversation into
  // a contactable record even when the customer never fills in a form.
  const id = supportChats.validateIdentity(identity && identity.name, identity && identity.phone);
  if (!id.ok) {
    return res.status(400).json({
      success: false,
      needsIdentity: true,
      field: id.error,
      message: id.error === 'phone'
        ? 'Please enter a valid Bangladeshi mobile number.'
        : 'Please enter your name.',
    });
  }

  // Keep only the latest 6-8 messages to keep prompt fast and compact
  const sanitizedMessages = messages.slice(-6).map((msg) => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: stripTags(String(msg.content || '')).substring(0, 1000),
  }));

  const sanitizedContext = {
    pageUrl: stripTags(String(context?.pageUrl || '')).substring(0, 200),
    pageTitle: stripTags(String(context?.pageTitle || '')).substring(0, 200),
    language: context?.language === 'en' ? 'en' : 'bn',
  };

  // The transcript is kept whether or not this ever becomes a lead.
  let chat = null;
  try {
    chat = await supportChats.openChat({
      sessionToken: stripTags(String((identity && identity.sessionToken) || '')).substring(0, 64),
      name: id.name,
      phone: id.phone,
      phoneKey: id.phoneKey,
      pageUrl: sanitizedContext.pageUrl,
      modelInterest: stripTags(String(context?.model || '')).substring(0, 60),
      language: sanitizedContext.language,
    });
    const latest = sanitizedMessages[sanitizedMessages.length - 1];
    if (chat && latest && latest.role === 'user') await supportChats.addMessage(chat.id, 'user', latest.content);
    alertNewChat(chat, id, sanitizedContext, latest && latest.content);
  } catch (e) {
    // Never let logging failures break the customer's conversation.
    console.error('support chat capture failed:', e.message);
  }

  try {
    const aiResponse = await callGroqAPI(sanitizedMessages, sanitizedContext);
    if (chat) {
      supportChats.addMessage(chat.id, 'assistant', aiResponse).catch(() => {});
      // District arrives later in the conversation, not in the opening form.
      const loc = /(?:জেলা|district|থানা|উপজেলা)\s*[:\-]?\s*([ঀ-৿A-Za-z ]{3,40})/i.exec(latestUserText(sanitizedMessages));
      if (loc) supportChats.noteLocation(chat.id, loc[1].trim(), null).catch(() => {});
    }
    return res.json({
      success: true,
      message: aiResponse,
    });
  } catch (err) {
    // err.message carries the Groq status and response body verbatim - a 429
    // here means tokens-per-minute, not a malformed request.
    console.error('AI chat endpoint error:', err.message);
    // If support is unreachable, hand over in both languages - this is exactly
    // the moment a customer must not be left with nothing.
    const waBn = 'দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না। সরাসরি আমাদের টিমের সাথে হোয়াটসঅ্যাপে কথা বলুন: wa.me/8801781636613 (+880 1781-636613)';
    const waEn = 'Sorry, I could not answer just now. Message our team directly on WhatsApp: wa.me/8801781636613 (+880 1781-636613)';
    const nl2 = String.fromCharCode(10) + String.fromCharCode(10);
    const fallback = sanitizedContext.language === 'en' ? (waEn + nl2 + waBn) : (waBn + nl2 + waEn);
    return res.status(200).json({
      success: true,
      message: fallback,
    });
  }
});

function latestUserText(msgs) {
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].role === 'user') return msgs[i].content || '';
  }
  return '';
}

module.exports = router;
