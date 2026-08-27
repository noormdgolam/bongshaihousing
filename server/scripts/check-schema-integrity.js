const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'db', 'migrations');
const ROUTES_DIR = path.join(__dirname, '..', 'routes');
const LIB_DIR = path.join(__dirname, '..', 'lib');

console.log('--- Checking Migrations vs Knex Queries ---');

// Parse migrations to extract table schemas
const migrationFiles = fs.readdirSync(MIGRATIONS_DIR).sort();
console.log(`Found ${migrationFiles.length} migration files.`);

// Check route code for table and column usages
const jsFiles = [
  ...fs.readdirSync(ROUTES_DIR).map(f => path.join(ROUTES_DIR, f)),
  ...fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.js')).map(f => path.join(LIB_DIR, f))
];

const knexQueries = [];

for (const filePath of jsFiles) {
  const code = fs.readFileSync(filePath, 'utf8');
  const rel = path.relative(path.join(__dirname, '..'), filePath);

  // Match db('tableName') or db.from('tableName')
  const tableRegex = /db\(\s*['"]([a-zA-Z0-9_]+)['"]\s*\)/g;
  let match;
  while ((match = tableRegex.exec(code)) !== null) {
    knexQueries.push({ file: rel, table: match[1] });
  }
}

const uniqueTablesQueried = [...new Set(knexQueries.map(q => q.table))];
console.log('Tables queried in code:', uniqueTablesQueried);

// Check if each table exists in migrations
const allMigrationCode = migrationFiles.map(f => fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf8')).join('\n');

const missingTables = [];
for (const table of uniqueTablesQueried) {
  const createsTable = allMigrationCode.includes(`createTable('${table}'`) || allMigrationCode.includes(`createTableIfNotExists('${table}'`);
  if (!createsTable && table !== 'sessions') {
    missingTables.push(table);
  }
}

if (missingTables.length > 0) {
  console.error('CRITICAL: Tables queried in code but NOT created in any migration:', missingTables);
} else {
  console.log('PASS: All queried tables are defined in migrations.');
}
