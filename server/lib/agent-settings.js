const db = require('./db');

const DEFAULT_SETTINGS = {
  commission_default_rate: '2.00',
  tier_silver_min_deals: '0',
  tier_silver_rate: '2.00',
  tier_gold_min_deals: '3',
  tier_gold_rate: '2.50',
  tier_platinum_min_deals: '6',
  tier_platinum_rate: '3.00',
  tranche_1_name: 'Agreement & Advance',
  tranche_1_pct: '40',
  tranche_2_name: 'Fabrication & Delivery',
  tranche_2_pct: '40',
  tranche_3_name: 'Handover & Erection',
  tranche_3_pct: '20',
  lead_protection_days: '90',
  payout_min_amount: '5000',
  whatsapp_share_template:
    'বংশাই হাউজিং-এর প্রি-ফেব স্টিল ডুপ্লেক্স ও ইন্ডাস্ট্রিয়াল শেড সম্পর্কে বিস্তারিত জানতে এবং স্পেশাল ডিসকাউন্টে বুকিং করতে নিচের লিংকে ভিজিট করুন:\n{{referral_link}}\n\nঅথবা সরাসরি যোগাযোগ করুন: {{phone}}',
  // Agent dashboard's "Pricing Cheat-Sheet" - the same rule as every other
  // business number here: the user sets the real figures from the admin
  // settings page, nothing is hardcoded in the template itself.
  pricing_band_1_label: 'Residential Duplex / Villa',
  pricing_band_1_range: '৳ 2,400 – ৳ 3,500+ / sq.ft',
  pricing_band_1_desc: '45-60 days installation, seismic resistant, modern architectural finish.',
  pricing_band_2_label: 'Prefab Simplex / Cottage',
  pricing_band_2_range: '৳ 1,400 – ৳ 2,400 / sq.ft',
  pricing_band_2_desc: 'Budget friendly, ideal for rural homes, farmhouses, or rooftop extensions.',
  pricing_band_3_label: 'Industrial PEB Factory Shed',
  pricing_band_3_range: '৳ 850 – ৳ 1,600 / sq.ft',
  pricing_band_3_desc: 'Clear-span up to 60m, heavy ASTM A572 steel, high-volume project commissions.',
};

async function getAgentSettings(database = db) {
  const result = { ...DEFAULT_SETTINGS };
  if (!database) return result;

  try {
    const hasTable = await database.schema.hasTable('agent_settings').catch(() => false);
    if (!hasTable) return result;

    const rows = await database('agent_settings').select('setting_key', 'setting_value').catch(() => []);
    for (const r of rows) {
      result[r.setting_key] = r.setting_value;
    }
  } catch (err) {
    console.error('[AgentSettings] Failed to fetch settings from DB:', err.message);
  }

  return result;
}

async function saveAgentSettings(updates, database = db) {
  if (!database || !updates) return false;

  try {
    const hasTable = await database.schema.hasTable('agent_settings').catch(() => false);
    if (!hasTable) return false;

    // Only ever write known setting keys - the settings form's POST body
    // also carries _csrf (and could carry any other stray field a future
    // template edit adds), which has no business being persisted as a
    // permanent row in this table.
    const allowedKeys = new Set(Object.keys(DEFAULT_SETTINGS));

    for (const [key, value] of Object.entries(updates)) {
      if (!allowedKeys.has(key)) continue;
      if (typeof value === 'undefined' || value === null) continue;
      const strVal = String(value).trim();
      const existing = await database('agent_settings').where({ setting_key: key }).first();
      if (existing) {
        await database('agent_settings').where({ setting_key: key }).update({
          setting_value: strVal,
          updated_at: database.fn.now(),
        });
      } else {
        await database('agent_settings').insert({
          setting_key: key,
          setting_value: strVal,
        });
      }
    }
    return true;
  } catch (err) {
    console.error('[AgentSettings] Failed to save settings to DB:', err.message);
    throw err;
  }
}

function calculateAgentTier(wonCount = 0, settings = DEFAULT_SETTINGS) {
  const count = Number(wonCount) || 0;
  const platMin = parseInt(settings.tier_platinum_min_deals, 10) || 6;
  const goldMin = parseInt(settings.tier_gold_min_deals, 10) || 3;

  const platRate = parseFloat(settings.tier_platinum_rate) || 3.0;
  const goldRate = parseFloat(settings.tier_gold_rate) || 2.5;
  const silverRate = parseFloat(settings.tier_silver_rate) || 2.0;

  if (count >= platMin) {
    return {
      tier: 'platinum',
      label: 'Platinum Partner',
      badgeClass: 'pill-platinum',
      rate: platRate,
      wonCount: count,
      nextTier: null,
      dealsToNext: 0,
      progressPct: 100,
    };
  }

  if (count >= goldMin) {
    const needed = platMin - count;
    const progress = Math.min(100, Math.round(((count - goldMin) / (platMin - goldMin)) * 100));
    return {
      tier: 'gold',
      label: 'Gold Partner',
      badgeClass: 'pill-gold',
      rate: goldRate,
      wonCount: count,
      nextTier: 'Platinum Partner',
      dealsToNext: needed,
      progressPct: progress,
    };
  }

  const needed = goldMin - count;
  const progress = Math.min(100, Math.round((count / goldMin) * 100));
  return {
    tier: 'silver',
    label: 'Silver Partner',
    badgeClass: 'pill-silver',
    rate: silverRate,
    wonCount: count,
    nextTier: 'Gold Partner',
    dealsToNext: needed,
    progressPct: progress,
  };
}

function calculateCommission(dealValue = 0, rate = 2.0) {
  const value = parseFloat(dealValue) || 0;
  const pct = parseFloat(rate) || 0;
  const commission = Math.round((value * pct) / 100);
  return {
    dealValue: value,
    rate: pct,
    commissionAmount: commission,
  };
}

function calculateTranches(totalCommission = 0, settings = DEFAULT_SETTINGS) {
  const total = parseFloat(totalCommission) || 0;
  const p1 = parseFloat(settings.tranche_1_pct) || 40;
  const p2 = parseFloat(settings.tranche_2_pct) || 40;
  const p3 = parseFloat(settings.tranche_3_pct) || 20;

  const a1 = Math.round((total * p1) / 100);
  const a2 = Math.round((total * p2) / 100);
  const a3 = total - a1 - a2;

  return [
    { number: 1, name: settings.tranche_1_name || 'Agreement & Advance', pct: p1, amount: a1 },
    { number: 2, name: settings.tranche_2_name || 'Fabrication & Delivery', pct: p2, amount: a2 },
    { number: 3, name: settings.tranche_3_name || 'Handover & Erection', pct: p3, amount: a3 },
  ];
}

function getAgentReferralCode(agent) {
  if (!agent) return 'BH-AG-000';
  if (agent.referral_code && agent.referral_code.trim()) {
    return agent.referral_code.trim();
  }
  return `BH-AG-${100 + Number(agent.id || 0)}`;
}

// Reverses the fallback BH-AG-<100+id> pattern generated above, for callers
// (contact.js's attribution lookup) that need to resolve a referral code
// back to an agent.id when the agent has no explicit referral_code row yet.
// Kept next to getAgentReferralCode() specifically so the encode/decode math
// can't drift apart the way it did before this existed (fallback codes
// looked up with no -100 offset, silently matching the wrong agent id, or
// none at all, for every agent who'd never opened their own dashboard).
function parseAgentIdFromFallbackCode(refCode) {
  if (!refCode || !refCode.startsWith('BH-AG-')) return null;
  const numeric = parseInt(refCode.replace('BH-AG-', ''), 10);
  if (isNaN(numeric) || numeric < 100) return null;
  return numeric - 100;
}

function composeWhatsAppMessage(agent, settings = DEFAULT_SETTINGS, siteUrl = 'https://bongshaihousing.com') {
  const code = getAgentReferralCode(agent);
  const referralLink = `${siteUrl.replace(/\/$/, '')}/?ref=${encodeURIComponent(code)}`;
  const template = settings.whatsapp_share_template || DEFAULT_SETTINGS.whatsapp_share_template;

  return template
    .replace(/{{referral_link}}/g, referralLink)
    .replace(/{{agent_name}}/g, agent?.name || '')
    .replace(/{{business_name}}/g, agent?.business_name || agent?.name || '')
    .replace(/{{phone}}/g, agent?.phone || '');
}

module.exports = {
  DEFAULT_SETTINGS,
  getAgentSettings,
  saveAgentSettings,
  calculateAgentTier,
  calculateCommission,
  calculateTranches,
  getAgentReferralCode,
  parseAgentIdFromFallbackCode,
  composeWhatsAppMessage,
};
