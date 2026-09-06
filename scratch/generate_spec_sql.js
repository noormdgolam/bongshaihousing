// generate_spec_sql.js — run from repo root: node scratch/generate_spec_sql.js
'use strict';
const fs = require('fs');
const path = require('path');

const TECH_SPECS = [
  ['CODES AND STANDARD',    'Comply with Bangladesh Nation Building Code (BNBC)'],
  ['EARTHQUAKE CONDITIONS', 'Earthquake resistant to magnitude 7.5'],
  ['WIND SPEED VALUE',      'Cyclone resistant 250 km/h (Must be fixed to the ground)'],
  ['CEMENT',                'Ordinary Portland Cement (OPC / CEM-I): Contains 95-100% clinker and 0-5% gypsum; graded by compressive strength (52.5 MPa). Brand SHAH CEMENT, AKIJ, CROWN, COSTAL PLAZ.'],
  ['MILD STEEL RODS',       'ASTM A36 grade Tensile Strength: 410 to 510 MPa. Brand BSRM/AKS/KSRM.'],
  ['STRUCTURAL STEEL',      'ASTM A36/SS400 grade Tensile Strength: 250 to 345 MPa.'],
];

const B123 = [
  ['FOOTING & SHORT COLUMN', 'Pre-cast footing is made of reinforced concrete; spreads the weight of a structure over a larger area on ground.'],
  ['GROUND FLOOR',           '3 inch pre-cast cement concrete block strength 12 MPa is used'],
  ['OUTER WALL',             '3 inch Reinforcement cement concrete panel/block is to be used'],
  ['INNER WALL',             '3 inch concrete solid block is to be used'],
  ['ROOF SLAB',              'Pre-cast 90mm reinforcement cement concrete panel is to be used.'],
  ['MAIN DOOR',              'Chowkat Mehagoni wood and Mehagoni palla is to be used'],
  ['BEDROOM DOOR',           'Chowkat: Mehagoni and Palla: ply wood flashdoor is to be used'],
  ['SECURITY GRILL',         '10mm square bar used'],
  ['WINDOW',                 'Standard size Thai Aluminum glass to be used'],
  ['FLOOR TILES',            '24 x 24 inch homogenous tiles on floor is used'],
  ['BATHROOM TILES',         '12 x 12 inch on floor and 12 x 10 inch on wall is used'],
  ['BATHROOM FITTINGS',      'Standard metal fittings is to be used'],
  ['ELECTRICAL WIRING',      'Standard wiring is to be used.'],
];

const B456 = [
  ['FOOTING & SHORT COLUMN', 'Pre-cast footing is made of reinforced concrete; spreads the weight of a structure over a larger area on ground.'],
  ['GROUND FLOOR',           '3 inch pre-cast cement concrete block strength (1:3:6) is to be used'],
  ['OUTER WALL',             '3 inch concrete solid block is to be used'],
  ['INNER WALL',             '3 inch concrete solid block is to be used'],
  ['ROOF CLADDING',          'High strength colour coated 0.4mm profile sheet to be used'],
  ['MAIN DOOR',              'Chowkat Steel and palla steel is to be used'],
  ['BEDROOM DOOR',           'Chowkat: Steel and Palla: steel is to be used'],
  ['SECURITY GRILL',         '10mm square bar used'],
  ['WINDOW',                 '3 x 4 ft size steel frame glass window to be used'],
  ['FLOOR FINISHING',        'Net cement finishing on floor is used'],
  ['BATHROOM TILES',         '12 x 12 inch on floor and cement plaster on wall to be used'],
  ['BATHROOM FITTINGS',      'Standard uPVC fittings is to be used'],
  ['ELECTRICAL WIRING',      'Standard wiring is to be used.'],
];

const B789 = [
  ['FOOTING & SHORT COLUMN', 'Pre-cast footing is made of reinforced concrete; spreads the weight of a structure over a larger area on ground.'],
  ['GROUND FLOOR',           '3 inch pre-cast cement concrete block strength (1:3:6) is to be used'],
  ['OUTER WALL',             '3 inch concrete solid block is to be used'],
  ['INNER WALL',             '3 inch concrete solid block is to be used'],
  ['ROOF CLADDING',          'High strength colour coated 0.4mm profile sheet to be used'],
  ['MAIN DOOR',              'Chowkat Mehagoni wood and Mehagoni palla is to be used'],
  ['BEDROOM DOOR',           'Chowkat: Mehagoni and Palla: ply wood flashdoor is to be used'],
  ['SECURITY GRILL',         '10mm square bar used'],
  ['WINDOW',                 'Standard size Thai Aluminum glass to be used'],
  ['FLOOR TILES',            '24 x 24 inch homogenous tiles on floor is used'],
  ['BATHROOM TILES',         '12 x 12 inch on floor and 12 x 10 inch on wall is used'],
  ['BATHROOM FITTINGS',      'Standard metal fittings is to be used'],
  ['ELECTRICAL WIRING',      'Standard wiring is to be used.'],
];

const CATS = [
  { id: 37, name: 'Apartment Building',      b: B123 },
  { id: 41, name: 'Duplex Steel Building',   b: B123 },
  { id: 44, name: 'Simplex Prefab Building', b: B123 },
  { id: 40, name: 'Cottage House',           b: B456 },
  { id: 39, name: 'Container House',         b: B456 },
  { id: 45, name: 'Steel House',             b: B456 },
  { id: 46, name: 'Tiny House',              b: B789 },
  { id: 47, name: 'Wooden House',            b: B789 },
  { id: 51, name: 'Low Cost House',          b: B789 },
];

// Escape single quotes for SQL
const q = s => s.replace(/'/g, "''");

const lines = [];
lines.push('-- =============================================================');
lines.push('-- Technical + Building Specs seed — 9 categories');
lines.push('-- Generated: ' + new Date().toISOString());
lines.push('-- Run in phpMyAdmin > SQL tab against: abongsha_bongshai_app');
lines.push('-- =============================================================');
lines.push('');
const ids = CATS.map(c => c.id).join(', ');
lines.push('-- Step 1: Remove ALL existing specs for these 9 categories');
lines.push('DELETE FROM `category_specs` WHERE `category_id` IN (' + ids + ');');
lines.push('');
lines.push('-- Step 2: Insert fresh Technical + Building specs');
lines.push('INSERT INTO `category_specs` (`category_id`, `spec_type`, `spec_key`, `spec_value`, `sort_order`, `created_at`, `updated_at`) VALUES');

const rows = [];
for (const cat of CATS) {
  TECH_SPECS.forEach(([k, v], i) => {
    rows.push(`  (${cat.id}, 'technical', '${q(k)}', '${q(v)}', ${i + 1}, NOW(), NOW())`);
  });
  cat.b.forEach(([k, v], i) => {
    rows.push(`  (${cat.id}, 'building', '${q(k)}', '${q(v)}', ${i + 1}, NOW(), NOW())`);
  });
}

lines.push(rows.join(',\n') + ';');
lines.push('');
lines.push('-- Step 3: Verify row counts per category + spec_type');
lines.push('SELECT c.id, c.name, cs.spec_type, COUNT(*) AS row_count');
lines.push('FROM `categories` c');
lines.push('LEFT JOIN `category_specs` cs ON cs.category_id = c.id');
lines.push('WHERE c.id IN (' + ids + ')');
lines.push('GROUP BY c.id, c.name, cs.spec_type');
lines.push('ORDER BY c.id, cs.spec_type;');

const outPath = path.join(__dirname, '..', 'scratch', 'seed_category_specs.sql');
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log('Written to:', outPath);
console.log('Total INSERT rows:', rows.length, '(' + CATS.length + ' categories x ~19 rows each)');
