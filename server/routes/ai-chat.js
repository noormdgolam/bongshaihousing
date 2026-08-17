const express = require('express');
const { callGroqAPI } = require('../lib/ai-assistant');
const { stripTags } = require('../lib/sanitize');

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

router.post('/api/ai-chat', async (req, res) => {
  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please wait a moment or contact us directly on WhatsApp (+8801781636613).'
    });
  }

  const { messages, context } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide at least one message.'
    });
  }

  // Keep only the latest 6-8 messages to keep prompt fast and compact
  const sanitizedMessages = messages.slice(-8).map((msg) => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: stripTags(String(msg.content || '')).substring(0, 1000),
  }));

  const sanitizedContext = {
    pageUrl: stripTags(String(context?.pageUrl || '')).substring(0, 200),
    pageTitle: stripTags(String(context?.pageTitle || '')).substring(0, 200),
    language: context?.language === 'en' ? 'en' : 'bn',
  };

  try {
    const aiResponse = await callGroqAPI(sanitizedMessages, sanitizedContext);
    return res.json({
      success: true,
      message: aiResponse,
    });
  } catch (err) {
    console.error('AI chat endpoint error:', err.message);
    const fallback = sanitizedContext.language === 'en'
      ? 'Welcome to Bongshai Housing! For instant pricing and technical consultations on steel structures and prefab villas, reach our engineers on WhatsApp: +880 1781-636613.'
      : 'বঙ্গশাই হাউজিং-এ আপনাকে স্বাগতম! আমাদের স্টিল বিল্ডিং, ডুপ্লেক্স ও প্রিফ্যাব হাউজিং সংক্রান্ত যেকোনো তথ্যের জন্য সরাসরি আমাদের ইঞ্জিনিয়ারদের সাথে হোয়াটসঅ্যাপে কথা বলুন (+8801781636613) অথবা একটি কোটেশন রিকোয়েস্ট পাঠান।';
    return res.status(200).json({
      success: true,
      message: fallback,
    });
  }
});

module.exports = router;
