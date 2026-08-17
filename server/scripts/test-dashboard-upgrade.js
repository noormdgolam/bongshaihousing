const path = require('path');
const nunjucks = require('nunjucks');
const { DEFAULT_THEME, PRESETS } = require('../lib/theme');

const viewsDir = path.join(__dirname, '..', 'views');
const env = nunjucks.configure(viewsDir, { autoescape: true });

env.addFilter('initials', (name) => {
  if (!name) return '';
  const words = String(name).trim().split(/\s+/);
  const first = words[0] ? words[0][0] : '';
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
});

console.log('=== TESTING DASHBOARD UPGRADE ===');

const mockCounts = {
  products: 32,
  publishedProducts: 28,
  categories: 12,
  projects: 19,
  featuredProjects: 8,
  leads: 45,
  newLeads: 4,
  contactedLeads: 18,
  convertedLeads: 15,
  conversionRate: 33,
  serviceAreas: 64,
  dedicatedServiceAreas: 18,
  faqs: 22,
  teamMembers: 14,
  testimonials: 5,
  mediaCount: 42,
};

const mockRecentLeads = [
  {
    id: 101,
    name: 'Engr. Rafiqul Islam',
    email: 'rafiq@example.com',
    phone: '+8801711000001',
    district: 'Gazipur',
    upazila: 'Tongi',
    model: 'BH-IS-5000',
    floor_area: 5000,
    status: 'new',
    created_at: new Date().toISOString(),
  },
  {
    id: 102,
    name: 'Tariq Mahmud',
    email: 'tariq@example.com',
    phone: '+8801811000002',
    district: 'Dhaka',
    upazila: 'Uttara',
    model: 'BH-DX-2400',
    floor_area: 2400,
    status: 'contacted',
    created_at: new Date().toISOString(),
  },
];

const mockRecentActivities = [
  {
    action: 'create',
    entity_type: 'product',
    summary: 'Created product BH-DX-2400 (Duplex Steel)',
    admin_name: 'Admin',
    created_at: new Date().toISOString(),
  },
  {
    action: 'status_change',
    entity_type: 'lead',
    summary: 'Lead #102 status set to "contacted"',
    admin_name: 'SuperAdmin',
    created_at: new Date().toISOString(),
  },
];

const rendered = env.render('admin/dashboard.njk', {
  adminName: 'Noor Md Golam',
  adminRole: 'superadmin',
  counts: mockCounts,
  recentLeads: mockRecentLeads,
  recentActivities: mockRecentActivities,
  activeTheme: {
    ...DEFAULT_THEME,
    name: 'Slate Midnight (Dark)',
    is_dark: true,
  },
  systemInfo: {
    nodeVersion: process.version,
    uptimeMinutes: 120,
    env: 'production',
    serverTime: '07:15 AM',
  },
});

const assertions = [
  { test: rendered.includes('Executive Dashboard'), name: 'Dashboard Header' },
  { test: rendered.includes('Quote Inquiries'), name: 'KPI 1 (Leads Pipeline)' },
  { test: rendered.includes('4 Action Needed'), name: 'New Leads Action Badge' },
  { test: rendered.includes('Steel Models Catalog'), name: 'KPI 2 (Product Catalog)' },
  { test: rendered.includes('Nationwide Coverage'), name: 'KPI 3 (Coverage)' },
  { test: rendered.includes('Active Theme Studio'), name: 'KPI 4 (Theme Studio)' },
  { test: rendered.includes('Product Catalog &amp; Architecture'), name: 'Workflow Matrix Group 1' },
  { test: rendered.includes('Projects &amp; Service Coverage'), name: 'Workflow Matrix Group 2' },
  { test: rendered.includes('Social Proof, SEO &amp; Team'), name: 'Workflow Matrix Group 3' },
  { test: rendered.includes('Engr. Rafiqul Islam'), name: 'Recent Leads Table' },
  { test: rendered.includes('wa.me/8801711000001'), name: 'Direct WhatsApp Link' },
  { test: rendered.includes('quick-status'), name: 'Inline Quick Status Changer' },
  { test: rendered.includes('Recent Activity Trail'), name: 'Audit Activity Trail' },
  { test: rendered.includes('Engine &amp; Hosting Architecture'), name: 'Technical Engine Specs' },
];

for (const a of assertions) {
  if (!a.test) {
    console.error(`FAIL: Assertion failed for "${a.name}"`);
    process.exit(1);
  }
  console.log(`PASS: ${a.name}`);
}

console.log('\n=== ALL DASHBOARD UPGRADE TESTS PASSED CLEANLY! ===');
process.exit(0);
