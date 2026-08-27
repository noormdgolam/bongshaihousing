// Extends admin_users.role from ('admin', 'editor') to add 'sales' - a
// role scoped to leads/CRM only (no catalog/content/theme access), for
// staff who only need to work inquiries, not edit the site.
exports.up = async function (knex) {
  await knex.raw("ALTER TABLE `admin_users` MODIFY COLUMN `role` ENUM('admin', 'editor', 'sales') NOT NULL DEFAULT 'editor'");
};

exports.down = async function (knex) {
  await knex.raw("ALTER TABLE `admin_users` MODIFY COLUMN `role` ENUM('admin', 'editor') NOT NULL DEFAULT 'editor'");
};
