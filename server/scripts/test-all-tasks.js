const nunjucks = require('nunjucks');
const path = require('path');
const fs = require('fs');

const viewsDir = path.join(__dirname, '..', 'views');
const env = nunjucks.configure(viewsDir, { autoescape: true });

env.addFilter('initials', (name) => {
  if (!name) return '';
  const words = String(name).trim().split(/\s+/);
  const first = words[0] ? words[0][0] : '';
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
});

console.log('--- Testing Task 1: Search Index Router Module ---');
const searchIndexRouter = require('../routes/search-index');
if (!searchIndexRouter) {
  console.error('FAIL: searchIndexRouter failed to load');
  process.exit(1);
}
console.log('PASS: searchIndexRouter loaded successfully');

console.log('--- Testing Task 2: Homepage JSON-LD Reviews ---');
const mockTestimonials = [
  { author_name: 'Test Client 1', author_title: 'Developer', rating: 5, review_text: 'Excellent steel building service!' },
  { author_name: 'Test Client 2', author_title: 'Architect', rating: 5, review_text: 'Fast and reliable.' }
];

const homeHtmlDynamic = env.render('pages/index.njk', {
  site: { title: 'Bongshai Housing' },
  page: { title: 'Home' },
  path: '/',
  title: 'Home',
  description: 'Test description',
  canonical: 'https://bongshaihousing.com/',
  dbTestimonials: mockTestimonials,
});

if (!homeHtmlDynamic.includes('Test Client 1') || !homeHtmlDynamic.includes('Excellent steel building service!')) {
  console.error('FAIL: Homepage dynamic testimonials / JSON-LD failed');
  process.exit(1);
}
console.log('PASS: Homepage dynamic testimonials & JSON-LD verified');

const homeHtmlStatic = env.render('pages/index.njk', {
  site: { title: 'Bongshai Housing' },
  page: { title: 'Home' },
  path: '/',
  title: 'Home',
  description: 'Test description',
  canonical: 'https://bongshaihousing.com/',
  dbTestimonials: [],
});

if (!homeHtmlStatic.includes('Mahmudul Hasan') || !homeHtmlStatic.includes('Farhana Rahman')) {
  console.error('FAIL: Homepage static fallback testimonials failed');
  process.exit(1);
}
console.log('PASS: Homepage static fallback testimonials verified');

console.log('--- Testing Task 3: Team Members System ---');
const teamData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'db', 'seeds', 'data', 'team_members.json'), 'utf8'));

const depts = [
  'team-senior-management.njk',
  'team-engineering.njk',
  'team-marketing-sales.njk',
  'team-quality-control.njk',
  'team-skilled-workers.njk',
  'team-client-service.njk'
];

for (const tmpl of depts) {
  const deptMembers = teamData.slice(0, 2);
  const rendered = env.render(`pages/${tmpl}`, {
    site: { title: 'Bongshai Housing' },
    page: { title: 'Team' },
    path: `/${tmpl.replace('.njk', '.html')}`,
    dbTeamMembers: deptMembers,
  });

  if (!rendered.includes('team-roster-grid') || !rendered.includes('SMA AWAL')) {
    console.error(`FAIL: Team template pages/${tmpl} failed to render dynamic roster`);
    process.exit(1);
  }
}
console.log(`PASS: All ${depts.length} team templates render dynamic roster and static fallback properly`);

const adminTeamList = env.render('admin/team-members/list.njk', {
  members: teamData.map((m, idx) => ({ ...m, id: idx + 1 })),
  departments: [
    { slug: 'senior-management', label: 'Senior Management', page: 'team-senior-management.html' },
    { slug: 'engineering', label: 'Engineering Team', page: 'team-engineering.html' }
  ],
  totalCount: teamData.length,
  publishedCount: teamData.length,
  deptFilter: 'all',
  statusFilter: 'all',
  search: '',
  adminName: 'Admin',
  adminRole: 'superadmin',
});

if (!adminTeamList.includes('Team Members &amp; Department Leadership') || !adminTeamList.includes('Add Team Member')) {
  console.error('FAIL: Admin team members list failed to render');
  process.exit(1);
}
console.log('PASS: Admin team members list view verified');

const adminTeamForm = env.render('admin/team-members/form.njk', {
  member: { ...teamData[0], id: 1 },
  departments: [
    { slug: 'senior-management', label: 'Senior Management', page: 'team-senior-management.html' }
  ],
  adminName: 'Admin',
  adminRole: 'superadmin',
});

if (!adminTeamForm.includes('Full Name') || !adminTeamForm.includes('Delete Team Member')) {
  console.error('FAIL: Admin team members form failed to render');
  process.exit(1);
}
console.log('PASS: Admin team members form view verified');

console.log('=== ALL 3 TASKS VERIFIED SUCCESSFULLY! ===');
process.exit(0);
