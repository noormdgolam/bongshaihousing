// Seeds nav_items with the exact structure the hardcoded nav.njk/static-page
// nav already has today, so switching nav.njk over to render from this table
// is a no-visible-change deploy - admin edits start from what's live, not
// from an empty menu. One deliberate improvement over the old hardcoded
// markup: desktop's About dropdown was missing "Agent Login" (only the
// mobile drawer had it, under a separate "Portals & Tracking" grouping) -
// unified here since rendering both desktop and mobile from one tree makes
// that inconsistency pointless to keep.
exports.up = async function (knex) {
  const existing = await knex('nav_items').count('id as c').first();
  if (existing.c > 0) return; // already seeded, don't duplicate on re-run

  const [homeId, aboutId, productsId, projectsId, galleryId, contactId] = await knex('nav_items')
    .insert([
      { label: 'Home', url: 'index.html', item_type: 'link', sort_order: 0 },
      { label: 'About', url: 'about.html', item_type: 'link', sort_order: 1 },
      { label: 'Products & Solutions', url: 'products-and-solutions.html', item_type: 'category_grid', sort_order: 2 },
      { label: 'Our Projects', url: 'projects.html', item_type: 'link', sort_order: 3 },
      { label: 'Image Gallery', url: 'gallery.html', item_type: 'link', sort_order: 4 },
      { label: 'Contact', url: 'contact.html', item_type: 'link', sort_order: 5 },
    ])
    .then(async ([firstId]) => {
      // MySQL insert() with multiple rows only returns the first insertId;
      // the rest are sequential from there since this is a fresh table.
      return [firstId, firstId + 1, firstId + 2, firstId + 3, firstId + 4, firstId + 5];
    });

  await knex('nav_items').insert([
    { label: 'Company Profile', url: 'about.html', parent_id: aboutId, icon: 'ℹ️', sort_order: 0 },
    { label: 'Certifications', url: 'certifications.html', parent_id: aboutId, icon: '📜', sort_order: 1 },
    { label: 'FAQ', url: 'faq.html', parent_id: aboutId, icon: '❓', sort_order: 2 },
    { label: 'Become an Agent', url: '/agent/signup.html', parent_id: aboutId, icon: '🤝', sort_order: 3 },
    { label: 'Agent Login', url: '/agent/login.html', parent_id: aboutId, icon: '🔑', sort_order: 4 },
    { label: 'Track My Project', url: '/my-project/login.html', parent_id: aboutId, icon: '📊', sort_order: 5 },
  ]);
};

exports.down = async function (knex) {
  await knex('nav_items').del();
};
