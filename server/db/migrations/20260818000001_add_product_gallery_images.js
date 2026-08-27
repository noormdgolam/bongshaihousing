// Every product page only ever had one image (main_image). Adding two
// more optional slots for a real gallery, matching the layout the user
// wants rolled out to every product page - most products don't have
// these shots yet, so they stay null and the gallery renders blank
// placeholders until they're added one at a time through the admin panel.
exports.up = async function (knex) {
  const hasCol2 = await knex.schema.hasColumn('products', 'image_2');
  const hasCol3 = await knex.schema.hasColumn('products', 'image_3');
  await knex.schema.alterTable('products', (table) => {
    if (!hasCol2) table.string('image_2', 500).nullable();
    if (!hasCol3) table.string('image_3', 500).nullable();
  });
};

exports.down = async function (knex) {
  const hasCol2 = await knex.schema.hasColumn('products', 'image_2');
  const hasCol3 = await knex.schema.hasColumn('products', 'image_3');
  await knex.schema.alterTable('products', (table) => {
    if (hasCol2) table.dropColumn('image_2');
    if (hasCol3) table.dropColumn('image_3');
  });
};
