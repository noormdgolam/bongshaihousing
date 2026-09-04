// The two blocks of prose at the top of every category landing page - the hero
// subtitle under the H1, and the bold "answer-first" intro paragraph in the
// off-white band below it - were hardcoded into each of the 10 category .njk
// templates, so changing a word meant a code edit and a redeploy. These two
// columns move that copy into the database where the dashboard can reach it.
//
// Deliberately not reusing the existing `categories.description` column: it is
// empty on every row today, its name says nothing about where it renders, and
// one column cannot hold two independently-edited blocks anyway.
//
// The backfill is in 20260904000003 - this migration only adds the columns, so
// the schema change and the content move stay separately reversible.
exports.up = async function (knex) {
  await knex.schema.alterTable('categories', (table) => {
    // Sits under the H1 in the navy hero band.
    table.text('hero_subtitle').nullable();
    // The bold paragraph in the off-white band directly below the hero.
    table.text('intro_paragraph').nullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('categories', (table) => {
    table.dropColumn('hero_subtitle');
    table.dropColumn('intro_paragraph');
  });
};
