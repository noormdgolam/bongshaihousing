const path = require('path');

// Ensure production DB target
process.env.DB_HOST = process.env.DB_HOST || 'bongshaihousing.com';
process.env.DB_NAME = 'abongsha_bongshai_prod';
process.env.DB_USER = process.env.DB_USER || 'abongsha_housin';

if (!process.env.DB_PASSWORD) {
  console.error('ERROR: DB_PASSWORD environment variable is required.');
  process.exit(1);
}

const knexConfig = require('../server/db/knexfile.js');
const knex = require('knex')(knexConfig);

async function runProdMigration() {
  try {
    console.log('=== Step 2: Production Database Migration ===');
    console.log(`Target Host: ${process.env.DB_HOST}`);
    console.log(`Target User: ${process.env.DB_USER}`);
    console.log(`Target DB:   ${process.env.DB_NAME}`);

    // Pre-migration assertion
    console.log('\nAsserting current database...');
    const [r1] = await knex.raw('SELECT DATABASE() AS db');
    const db1 = r1[0].db;
    console.log(`SELECT DATABASE() before migration: '${db1}'`);
    if (db1 !== 'abongsha_bongshai_prod') {
      throw new Error(`ABORT: Target database is '${db1}', expected 'abongsha_bongshai_prod'!`);
    }

    // Check migration status before
    console.log('\nChecking current migration status on production...');
    const [completedBefore, pendingBefore] = await knex.migrate.list({
      directory: path.join(__dirname, '..', 'server', 'db', 'migrations')
    });
    console.log(`Completed migrations on prod: ${completedBefore.length}`);
    console.log(`Pending migrations on prod:   ${pendingBefore.length}`);
    for (const m of pendingBefore) {
      console.log(`  Pending: ${m.file || m}`);
    }

    // Run migrate:latest
    console.log('\nRunning knex.migrate.latest()...');
    const [batchNo, log] = await knex.migrate.latest({
      directory: path.join(__dirname, '..', 'server', 'db', 'migrations')
    });
    console.log(`Batch ${batchNo} completed successfully. Migrations applied:`);
    for (const m of log) {
      console.log(`  - ${m}`);
    }

    // Post-migration assertion
    console.log('\nAsserting database after migration...');
    const [r2] = await knex.raw('SELECT DATABASE() AS db');
    const db2 = r2[0].db;
    console.log(`SELECT DATABASE() after migration: '${db2}'`);
    if (db2 !== 'abongsha_bongshai_prod') {
      throw new Error(`CRITICAL: Database after migration is '${db2}', expected 'abongsha_bongshai_prod'!`);
    }

    // Step 3: Verification on production
    console.log('\n=== Step 3: Production Verification ===');
    const rows = await knex.raw(`
      SELECT id, name, sort_order,
             hero_subtitle IS NOT NULL AS has_hero,
             intro_paragraph IS NOT NULL AS has_intro,
             hero_subtitle, intro_paragraph
      FROM categories ORDER BY sort_order;
    `);

    const categories = rows[0];
    console.log(`Total categories found on production: ${categories.length}`);
    let anyNull = false;
    for (const c of categories) {
      const hasHero = Boolean(c.has_hero);
      const hasIntro = Boolean(c.has_intro);
      console.log(`[Category ${c.id}] ${c.name} (sort_order=${c.sort_order}): has_hero=${hasHero}, has_intro=${hasIntro}`);
      if (!hasHero || !hasIntro) {
        console.warn(`  --> WARNING: NULL found for category ${c.id} (${c.name}): hero_subtitle=${c.hero_subtitle}, intro_paragraph=${c.intro_paragraph}`);
        anyNull = true;
      }
    }

    if (!anyNull && categories.length === 10) {
      console.log('\nSUCCESS: All 10 categories on production have hero_subtitle and intro_paragraph populated!');
    } else if (anyNull) {
      console.log('\nWARNING: Some category rows have NULL copy fields. See breakdown above.');
    }

  } catch (err) {
    console.error('\nMigration failed:', err);
    process.exitCode = 1;
  } finally {
    await knex.destroy();
  }
}

runProdMigration();
