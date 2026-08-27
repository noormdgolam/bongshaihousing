// Utility for extracting visitor metadata (IP, Country, Device, Browser, OS, Referrer)
// Optimized for cPanel/LiteSpeed hosting with zero heavy binary dependencies.

const COUNTRY_MAP = {
  BD: { name: 'Bangladesh', flag: '🇧🇩' },
  US: { name: 'United States', flag: '🇺🇸' },
  GB: { name: 'United Kingdom', flag: '🇬🇧' },
  AE: { name: 'United Arab Emirates', flag: '🇦🇪' },
  SA: { name: 'Saudi Arabia', flag: '🇸🇦' },
  IN: { name: 'India', flag: '🇮🇳' },
  MY: { name: 'Malaysia', flag: '🇲🇾' },
  SG: { name: 'Singapore', flag: '🇸🇬' },
  CA: { name: 'Canada', flag: '🇨🇦' },
  AU: { name: 'Australia', flag: '🇦🇺' },
  QA: { name: 'Qatar', flag: '🇶🇦' },
  KW: { name: 'Kuwait', flag: '🇰🇼' },
  OM: { name: 'Oman', flag: '🇴🇲' },
  IT: { name: 'Italy', flag: '🇮🇹' },
  DE: { name: 'Germany', flag: '🇩🇪' },
  FR: { name: 'France', flag: '🇫🇷' },
  JP: { name: 'Japan', flag: '🇯🇵' },
  CN: { name: 'China', flag: '🇨🇳' },
  KR: { name: 'South Korea', flag: '🇰🇷' },
  PK: { name: 'Pakistan', flag: '🇵🇰' },
  NP: { name: 'Nepal', flag: '🇳🇵' },
  LK: { name: 'Sri Lanka', flag: '🇱🇰' },
  BH: { name: 'Bahrain', flag: '🇧🇭' },
  TH: { name: 'Thailand', flag: '🇹🇭' },
};

function getClientIp(req) {
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) return cfIp.trim();

  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const list = forwarded.split(',');
    const clientIp = list[0].trim();
    if (clientIp) return clientIp;
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) return realIp.trim();

  let ip = req.socket?.remoteAddress || req.ip || '127.0.0.1';
  if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }
  return ip;
}

function resolveCountry(req, ip) {
  // Check Cloudflare or reverse proxy header
  const code = (req.headers['cf-ipcountry'] || req.headers['x-country-code'] || '').toUpperCase();
  if (code && COUNTRY_MAP[code]) {
    return {
      country: COUNTRY_MAP[code].name,
      country_code: code,
      flag: COUNTRY_MAP[code].flag,
      city: req.headers['cf-ipcity'] ? decodeURIComponent(req.headers['cf-ipcity']) : null,
    };
  } else if (code && code !== 'XX') {
    return { country: code, country_code: code, flag: '🌍', city: null };
  }

  // Local or internal network
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { country: 'Localhost / Internal', country_code: 'LOC', flag: '💻', city: 'Development' };
  }

  // Default fallback for Bangladesh target audience
  return { country: 'Bangladesh', country_code: 'BD', flag: '🇧🇩', city: 'Dhaka' };
}

function parseUserAgent(uaString) {
  if (!uaString) return { device_type: 'Desktop', browser: 'Unknown', os: 'Unknown' };

  const ua = uaString.toLowerCase();

  // Device Type
  let device_type = 'Desktop';
  if (/googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|whatsapp|telegrambot|bytespider|gptbot|claudebot|perplexitybot/i.test(ua)) {
    device_type = 'Bot / Crawler';
  } else if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    device_type = 'Tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|windows phone/i.test(ua)) {
    device_type = 'Mobile';
  }

  // Browser
  let browser = 'Other';
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/opr\/|opera/i.test(ua)) browser = 'Opera';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) browser = 'Safari';
  else if (/msie|trident/i.test(ua)) browser = 'Internet Explorer';
  else if (device_type === 'Bot / Crawler') browser = 'Bot / Crawler';

  // Operating System
  let os = 'Other';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/mac os|macintosh/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/cros/i.test(ua)) os = 'Chrome OS';

  return { device_type, browser, os };
}

function parseReferrer(referrerUrl, currentHost) {
  if (!referrerUrl) return 'Direct Traffic';
  try {
    const ref = new URL(referrerUrl);
    if (currentHost && ref.host === currentHost) return 'Internal';
    if (/google\./i.test(ref.hostname)) return 'Google Search';
    if (/facebook\.com|fb\.com/i.test(ref.hostname)) return 'Facebook';
    if (/instagram\.com/i.test(ref.hostname)) return 'Instagram';
    if (/youtube\.com|youtu\.be/i.test(ref.hostname)) return 'YouTube';
    if (/linkedin\.com/i.test(ref.hostname)) return 'LinkedIn';
    if (/t\.co|twitter\.com|x\.com/i.test(ref.hostname)) return 'X (Twitter)';
    if (/bing\.com/i.test(ref.hostname)) return 'Bing';
    if (/yahoo\.com/i.test(ref.hostname)) return 'Yahoo';
    if (/wa\.me|whatsapp\.com/i.test(ref.hostname)) return 'WhatsApp';
    return ref.hostname.replace(/^www\./, '');
  } catch (e) {
    return referrerUrl.substring(0, 80);
  }
}

function extractVisitorInfo(req) {
  const ip = getClientIp(req);
  const geo = resolveCountry(req, ip);
  const ua = parseUserAgent(req.headers['user-agent']);
  const referrer = parseReferrer(req.headers['referer'] || req.headers['referrer'], req.headers['host']);

  return {
    ip: ip.substring(0, 45),
    country: geo.country,
    country_code: geo.country_code,
    city: geo.city,
    flag: geo.flag,
    user_agent: (req.headers['user-agent'] || '').substring(0, 500),
    device_type: ua.device_type,
    browser: ua.browser,
    os: ua.os,
    referrer: referrer.substring(0, 500),
  };
}

module.exports = {
  getClientIp,
  resolveCountry,
  parseUserAgent,
  parseReferrer,
  extractVisitorInfo,
  COUNTRY_MAP,
};
