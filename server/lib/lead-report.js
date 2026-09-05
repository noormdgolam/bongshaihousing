// Builds the weekly lead summary, read-only against the `leads` table (the
// system of record - see lib/leads.js for why this isn't the Google Sheet
// the original spec described). No writes anywhere in this file.
const db = require('./db');
const { applyOverdueFilter } = require('./leads');

const STATUSES = ['নতুন', 'যোগাযোগ হয়েছে', 'কোটেশন দেওয়া', 'সাইট ভিজিট', 'আলোচনায়', 'বিক্রি', 'হারানো'];
const MAX_CHARS = 1500;
const MAX_OVERDUE_LISTED = 8;

// "This week" = the 7 days ending today, computed in Asia/Dhaka wall-clock
// time regardless of the server's own system timezone or whatever wall-clock
// moment a cron daemon happens to fire this script at - Dhaka has no DST, so
// a fixed +6h offset is exact, not an approximation.
function dhakaNow() {
  return new Date(Date.now() + 6 * 60 * 60 * 1000);
}
function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}
function weekWindow() {
  const now = dhakaNow();
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - 6);
  return { from: toDateStr(start), to: toDateStr(now) };
}

function waLink(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  const local = digits.startsWith('880') ? digits : digits.startsWith('0') ? '88' + digits.slice(1) : '88' + digits;
  return `https://wa.me/${local}`;
}

async function buildWeeklyReport() {
  const { from, to } = weekWindow();
  const thisWeek = () => db('leads').where('created_at', '>=', from).andWhere('created_at', '<', to + ' 23:59:59.999');

  const newThisWeek = await thisWeek().count({ n: '*' }).then(([r]) => Number(r.n));

  const bySource = await thisWeek().select('source').count({ n: '*' }).groupBy('source').orderBy('n', 'desc');

  // "Cost per lead" per this spec's own env vars (USD spend + a configurable
  // FX rate), divided by ad-sourced leads - defined here as any source other
  // than 'direct', matching what was already told to the user when auditing
  // an earlier report that used the same "ad-sourced" phrasing without
  // pinning it down further.
  const adSourcedThisWeek = await thisWeek().whereNot({ source: 'direct' }).count({ n: '*' }).then(([r]) => Number(r.n));
  const adSpendUsd = parseFloat(process.env.AD_SPEND_USD) || 0;
  const usdBdtRate = parseFloat(process.env.USD_BDT_RATE) || 122;
  const adSpendBdt = adSpendUsd * usdBdtRate;
  const costPerLead = adSourcedThisWeek > 0 ? Math.round(adSpendBdt / adSourcedThisWeek) : null;

  const byDistrict = await thisWeek().whereNotNull('district').select('district').count({ n: '*' })
    .groupBy('district').orderBy('n', 'desc').limit(5);

  // Overdue: same definition as /agent/today (lib/leads.js's applyOverdueFilter),
  // not scoped to this week - a followup that slipped from three weeks ago is
  // still exactly the kind of thing this report exists to surface. Capped at
  // MAX_OVERDUE_LISTED to keep the message under the 1500-char budget; the
  // header line still reports the true total.
  const allOverdue = await db('leads').modify(applyOverdueFilter).orderBy('created_at', 'asc');
  const overdueCount = allOverdue.length;
  const overdueListed = allOverdue.slice(0, MAX_OVERDUE_LISTED);

  const funnelRows = await db('leads').select('status').count({ n: '*' }).groupBy('status');
  const funnelMap = Object.fromEntries(funnelRows.map((r) => [r.status, Number(r.n)]));
  const funnel = STATUSES.map((s) => ({ status: s, n: funnelMap[s] || 0 }));

  return { from, to, newThisWeek, bySource, costPerLead, adSourcedThisWeek, byDistrict, overdueCount, overdueListed, funnel };
}

function formatMessage(r) {
  const lines = [];
  lines.push(`📊 সাপ্তাহিক লিড রিপোর্ট (${r.from} থেকে ${r.to})`);
  lines.push(`এই সপ্তাহে ${r.newThisWeek} জন নতুন, ${r.overdueCount} জনের ফলোআপ বাকি`);
  lines.push('');

  lines.push('📥 নতুন লিড, উৎস অনুযায়ী:');
  if (r.bySource.length === 0) lines.push('  কোনো নতুন লিড নেই');
  r.bySource.forEach((s) => lines.push(`  ${s.source || 'অজানা'}: ${s.n}`));
  lines.push('');

  if (r.costPerLead != null) {
    lines.push(`💰 প্রতি লিড খরচ: ৳${r.costPerLead} (${r.adSourcedThisWeek}টি বিজ্ঞাপন-সূত্র লিড থেকে)`);
    lines.push('');
  }

  lines.push('📍 জেলা অনুযায়ী (শীর্ষ ৫):');
  if (r.byDistrict.length === 0) lines.push('  কোনো তথ্য নেই');
  r.byDistrict.forEach((d) => lines.push(`  ${d.district}: ${d.n}`));
  lines.push('');

  lines.push(`⚠️ ফলোআপ বাকি (মোট ${r.overdueCount}):`);
  if (r.overdueListed.length === 0) {
    lines.push('  কোনোটি বাকি নেই ✅');
  } else {
    r.overdueListed.forEach((l) => lines.push(`  ${l.name} · ${l.phone} · ${waLink(l.phone)}`));
    if (r.overdueCount > r.overdueListed.length) lines.push(`  ...আরও ${r.overdueCount - r.overdueListed.length} জন`);
  }
  lines.push('');

  lines.push('🔀 ফানেল:');
  r.funnel.forEach((f) => lines.push(`  ${f.status}: ${f.n}`));

  let message = lines.join('\n');
  if (message.length > MAX_CHARS) {
    // Trim the overdue list first (already capped), then hard-truncate as a
    // last resort - the header line (new/overdue counts) always survives
    // since it's built first and near the top.
    message = message.slice(0, MAX_CHARS - 20) + '\n...(সংক্ষেপিত)';
  }
  return message;
}

module.exports = { buildWeeklyReport, formatMessage };
