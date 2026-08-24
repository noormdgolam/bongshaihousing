const fs = require('fs');
const path = require('path');

const SERVER_DIR = path.join(__dirname, '..');
const MIGRATIONS_DIR = path.join(SERVER_DIR, 'db', 'migrations');
const ROUTES_DIR = path.join(SERVER_DIR, 'routes');
const LIB_DIR = path.join(SERVER_DIR, 'lib');
const SEEDS_DIR = path.join(SERVER_DIR, 'db', 'seeds');

console.log('======================================================');
console.log('   DEEP AUDIT 1: SQL COLUMNS VS MIGRATION DEFINITIONS ');
console.log('======================================================\n');

// 1. Read all migration files and extract table schemas with their column names
const migrationFiles = fs.readdirSync(MIGRATIONS_DIR).sort();
const tableColumns = new Map(); // tableName -> Set of column names

for (const mf of migrationFiles) {
  const content = fs.readFileSync(path.join(MIGRATIONS_DIR, mf), 'utf8');
  
  // Find createTable or createTableIfNotExists
  const createTableRegex = /(?:createTable|createTableIfNotExists)\(['"]([a-zA-Z0-9_]+)['"],\s*(?:\([^)]*\)\s*=>|function\s*\([^)]*\))\s*\{([\s\S]*?)\}\);/g;
  let match;
  while ((match = createTableRegex.exec(content)) !== null) {
    const tableName = match[1];
    const tableBody = match[2];
    if (!tableColumns.has(tableName)) {
      tableColumns.set(tableName, new Set(['id', 'created_at', 'updated_at']));
    }
    const cols = tableColumns.get(tableName);

    // Extract table.<type>('column_name')
    const colRegex = /table\.[a-zA-Z0-9_]+\(['"]([a-zA-Z0-9_]+)['"]/g;
    let colMatch;
    while ((colMatch = colRegex.exec(tableBody)) !== null) {
      cols.add(colMatch[1]);
    }
  }

  // Find table alterations: table.string('col') or alter table
  const alterTableRegex = /table\(['"]([a-zA-Z0-9_]+)['"],\s*(?:\([^)]*\)\s*=>|function\s*\([^)]*\))\s*\{([\s\S]*?)\}\);/g;
  while ((match = alterTableRegex.exec(content)) !== null) {
    const tableName = match[1];
    const tableBody = match[2];
    if (tableColumns.has(tableName)) {
      const cols = tableColumns.get(tableName);
      const colRegex = /table\.[a-zA-Z0-9_]+\(['"]([a-zA-Z0-9_]+)['"]/g;
      let colMatch;
      while ((colMatch = colRegex.exec(tableBody)) !== null) {
        cols.add(colMatch[1]);
      }
    }
  }
}

console.log(`Discovered ${tableColumns.size} tables from migrations:`);
for (const [table, cols] of tableColumns.entries()) {
  console.log(`  - ${table} (${cols.size} columns): ${[...cols].join(', ')}`);
}

// 2. Scan all JS files in routes, lib, and seeds for queries and verify column existence
const jsFiles = [
  ...fs.readdirSync(ROUTES_DIR).map(f => path.join(ROUTES_DIR, f)),
  ...fs.readdirSync(LIB_DIR).filter(f => f.endsWith('.js')).map(f => path.join(LIB_DIR, f)),
  ...fs.readdirSync(SEEDS_DIR).filter(f => f.endsWith('.js')).map(f => path.join(SEEDS_DIR, f)),
];

const columnErrors = [];

for (const jsFile of jsFiles) {
  const content = fs.readFileSync(jsFile, 'utf8');
  const relPath = path.relative(SERVER_DIR, jsFile).replace(/\\/g, '/');

  // Check db('table').select('col1', 'col2', ...)
  const selectRegex = /db\(['"]([a-zA-Z0-9_]+)['"]\)(?:[\s\S]*?)\.select\(([^)]+)\)/g;
  let sMatch;
  while ((sMatch = selectRegex.exec(content)) !== null) {
    const table = sMatch[1];
    const selectArgs = sMatch[2];
    if (tableColumns.has(table)) {
      const knownCols = tableColumns.get(table);
      const rawCols = selectArgs.split(',').map(s => s.trim().replace(/['"]/g, ''));
      for (const col of rawCols) {
        if (!col || col === '*' || col.includes('as ') || col.includes('(') || col.startsWith('db.')) continue;
        if (!knownCols.has(col)) {
          columnErrors.push({
            file: relPath,
            table,
            operation: 'select',
            column: col,
            error: `Selected column "${col}" does not exist in migration for table "${table}"`
          });
        }
      }
    }
  }

  // Check db('table').insert({ col1: ..., col2: ... })
  const insertObjRegex = /db\(['"]([a-zA-Z0-9_]+)['"]\)\.insert\(\{\s*([\s\S]*?)\s*\}\)/g;
  let iMatch;
  while ((iMatch = insertObjRegex.exec(content)) !== null) {
    const table = iMatch[1];
    const body = iMatch[2];
    if (tableColumns.has(table)) {
      const knownCols = tableColumns.get(table);
      const lines = body.split('\n');
      for (const line of lines) {
        const keyMatch = line.match(/^\s*([a-zA-Z0-9_]+)\s*:/);
        if (keyMatch) {
          const col = keyMatch[1];
          if (!knownCols.has(col)) {
            columnErrors.push({
              file: relPath,
              table,
              operation: 'insert',
              column: col,
              error: `Inserted column "${col}" does not exist in migration for table "${table}"`
            });
          }
        }
      }
    }
  }

  // Check db('table').where({ col: ... })
  const whereObjRegex = /db\(['"]([a-zA-Z0-9_]+)['"]\)(?:[\s\S]*?)\.where\(\{\s*([\s\S]*?)\s*\}\)/g;
  let wMatch;
  while ((wMatch = whereObjRegex.exec(content)) !== null) {
    const table = wMatch[1];
    const body = wMatch[2];
    if (tableColumns.has(table)) {
      const knownCols = tableColumns.get(table);
      const lines = body.split('\n');
      for (const line of lines) {
        const keyMatch = line.match(/^\s*([a-zA-Z0-9_]+)\s*:/);
        if (keyMatch) {
          const col = keyMatch[1];
          if (!knownCols.has(col)) {
            columnErrors.push({
              file: relPath,
              table,
              operation: 'where',
              column: col,
              error: `Where-clause column "${col}" does not exist in migration for table "${table}"`
            });
          }
        }
      }
    }
  }
}

console.log('\n------------------------------------------------------');
console.log(`Column Discrepancies Found: ${columnErrors.length}`);
columnErrors.forEach(e => {
  console.log(` ❌ [${e.file}] Table "${e.table}" ${e.operation}: ${e.error}`);
});

fs.writeFileSync(path.join(SERVER_DIR, 'sql-audit-results.json'), JSON.stringify(columnErrors, null, 2));
process.exit(columnErrors.length > 0 ? 1 : 0);
