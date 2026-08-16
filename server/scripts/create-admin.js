#!/usr/bin/env node
/**
 * One-off admin-account bootstrap - deliberately not a seed file, since
 * `knex seed:run` re-runs every seed on every deploy and an admin
 * password shouldn't get silently reset just because a product re-scrape
 * needed re-seeding. Safe to re-run: upserts by email rather than failing
 * on a duplicate.
 *
 * Usage: node server/scripts/create-admin.js <email> <password> [name] [role]
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const knex = require('knex')(require('../db/knexfile.js'));

async function main() {
  const [email, password, name = 'Admin', role = 'admin'] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Usage: node create-admin.js <email> <password> [name] [role]');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await knex('admin_users').where({ email }).first();

  if (existing) {
    await knex('admin_users').where({ email }).update({ password_hash: passwordHash, name, role });
    console.log(`Updated existing admin user: ${email}`);
  } else {
    await knex('admin_users').insert({ email, password_hash: passwordHash, name, role });
    console.log(`Created admin user: ${email}`);
  }

  await knex.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
