// The hardcoded nav mega-dropdown had a deliberately curated category order
// (Apartment -> Duplex -> Simplex -> Cottage -> Container -> Steel -> Tiny ->
// Wooden -> Low Cost -> Concrete) that categories.sort_order did NOT match -
// its values were roughly alphabetical, so switching the nav over to render
// from the DB silently reshuffled the dropdown. This restores the original
// curated order as the DB's own sort_order, so DB-driven == what was live.
// Categories not in this list (staging-only rows, future additions) keep
// their existing sort_order and simply fall after these.
const NAV_ORDER = [
  'apartment-building',
  'duplex-steel-building',
  'simplex-steel-building',
  'cottage-house',
  'container-house',
  'steel-house',
  'tiny-house',
  'wooden-house',
  'low-cost-house',
  'concrete-building',
];

exports.up = async function (knex) {
  for (let i = 0; i < NAV_ORDER.length; i++) {
    await knex('categories').where({ slug: NAV_ORDER[i] }).update({ sort_order: i });
  }
  // Push anything not explicitly ordered above to the end, preserving their
  // relative order, so they can't interleave into the curated sequence.
  const others = await knex('categories').whereNotIn('slug', NAV_ORDER).orderBy('sort_order');
  for (let i = 0; i < others.length; i++) {
    await knex('categories').where({ id: others[i].id }).update({ sort_order: NAV_ORDER.length + i });
  }
};

exports.down = async function (knex) {
  // No-op: the previous ordering was arbitrary and not worth restoring.
};
