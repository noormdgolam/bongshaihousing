// Design documents/drawings the customer can view on their project - a
// standard prefab/modular builder portal feature (see research: budget,
// schedules, and design documents are the norm for this kind of portal).
// Files live in the same private-uploads pattern as agent KYC documents -
// randomized filenames, streamed through an authenticated route, never a
// public URL - since a customer's floor plan isn't public-facing content.
exports.up = async function (knex) {
  await knex.schema.createTable('order_documents', (table) => {
    table.increments('id').primary();
    table.integer('order_id').unsigned().notNullable()
      .references('id').inTable('orders').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.string('file_path', 500).notNullable();
    table.string('mimetype', 100).nullable();
    table.timestamps(true, true);
  });
  await knex.raw('ALTER TABLE `order_documents` ENGINE=InnoDB');
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('order_documents');
};
