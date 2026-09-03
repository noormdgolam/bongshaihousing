// categories.hero_image exists but was never actually rendered anywhere on
// the live site (confirmed: only read by the admin edit form/list, grep
// found zero references in any public-facing .njk) - so it was safe to
// repurpose as the category's main photo, which the new DB-driven nav mega-
// dropdown (see 20260903000004/5) now reads. Backfilled here with exactly
// the image paths the OLD hardcoded nav.njk was using per category, so
// switching the nav over to read this column is a no-visible-change deploy.
// Only 'low-cost-house' had a hero_image already set, and it was wrong
// (pointed at a Concrete Building photo, not its own) - overwritten with the
// same "coming soon" placeholder the old hardcoded nav actually showed live,
// rather than keeping a mismatched photo or the correct-but-still-wrong-for-
// this-purpose prior value.
const IMAGE_BY_SLUG = {
  'apartment-building': 'images/products/Model No-BH-TB-101.webp',
  'duplex-steel-building': 'images/products/dv-101.webp',
  'simplex-steel-building': 'images/products/bh-sb-301.webp',
  'cottage-house': 'images/products/Model No-BH-CH-401.webp',
  'container-house': 'images/products/bh-ct-501.webp',
  'steel-house': 'images/products/Model No-BH-SH-601.webp',
  'tiny-house': 'images/products/Model No-BH-TH-701.webp',
  'wooden-house': 'images/products/Model No-BH-WH-801.webp',
  'low-cost-house': 'images/products/coming-soon-placeholder.png',
  'concrete-building': 'images/products/bh-cb-901.webp',
};

exports.up = async function (knex) {
  for (const [slug, image] of Object.entries(IMAGE_BY_SLUG)) {
    await knex('categories').where({ slug }).update({ hero_image: image });
  }
};

exports.down = async function (knex) {
  // No-op rollback: this only corrects data that was null/wrong, nothing to
  // meaningfully revert to.
};
