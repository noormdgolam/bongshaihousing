const express = require('express');
const router = express.Router();

// Bare status route at the app root. index.html isn't converted yet (that's
// later Phase 1 work), and cPanel's Node Selector health-checks the
// Application URL root after install/restart - without this it 404s as
// JSON, which cPanel's "check availability" step flags as a failed
// install even though npm install itself succeeded fine.
router.get('/', (req, res) => {
  res.status(200).type('html').send('<!doctype html><title>Bongshai Housing - Node app</title>Bongshai Housing Node app is running (Phase 1, staging).');
});

// Phase 1 scope: prove the templating pattern on one real page (career.html,
// the one with the form we just migrated) rather than converting all 223
// pages in this pass. Same URL as today - GET /career.html - so nothing
// about the live site changes yet. More pages get added to this router as
// they're converted.
router.get('/career.html', (req, res) => {
  res.render('pages/career.njk', {
    title: 'Jobs at Bongshai Housing | Bongshai Housing Bangladesh',
    description: "Join Bongshai Housing's team. Explore current openings in engineering, construction, and sales at Bangladesh's leading steel building and prefab housing company.",
    keywords: 'Careers, steel building Bangladesh, prefab housing Dhaka, Bongshai Housing, EPC contractor Bangladesh, pre-engineered steel buildings',
    canonical: 'https://bongshaihousing.com/career.html',
    ogTitle: 'Careers | Bongshai Housing - Steel Structure Manufacturer in Bangladesh',
    ogDescription: 'Join a leading steel structure manufacturer and pre-engineered steel building company in Bangladesh. Apply today!',
    twitterTitle: 'Careers | Bongshai Housing',
    twitterDescription: 'Steel building & construction jobs at a leading pre-engineered steel building company in Bangladesh. Apply now.',
  });
});

module.exports = router;
