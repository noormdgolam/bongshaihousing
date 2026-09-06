-- ==============================================================================
-- Technical Specifications & Codes Seed for Product Level (product_specs)
-- ==============================================================================
-- Target Database: abongsha_bongshai_prod (PRODUCTION - not staging abongsha_bongshai_app)
-- 
-- Purpose:
--   Populates the missing "5. TECHNICAL SPECIFICATION & CODES" section (BNBC compliance,
--   earthquake/wind rating, cement/steel grade) for all products across 9 categories.
--   The table product-detail.njk actually renders is `product_specs` (per-product).
--
-- Source of Truth:
--   - Tecnical Spec 1 2 3.docx -> Categories 37, 41, 44
--   - Tecnical Spec 4 5 6.docx -> Categories 40, 39, 45
--   - Tecnical Spec 7 8 9.docx -> Categories 46, 47, 51
--   Re-derived and confirmed word-for-word against the client docx files in Downloads.
--
-- Safety & Invariants:
--   1. Purely additive — ZERO DELETE or UPDATE statements; never touches existing rows.
--   2. Idempotent — Skips any product that already contains a row with
--      spec_key = '5. TECHNICAL SPECIFICATION & CODES'.
--   3. Sort order continuity — Computes sort_order continuing from:
--      (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM product_specs WHERE product_id = <this product>)
--   4. Excludes corrupted slugs — Filters with slug REGEXP '^[a-z0-9-]+\\.html$' to ignore
--      remnants like 'bh-ch-401.html-copy-9b110d'.
-- ==============================================================================

USE `abongsha_bongshai_prod`;

-- ------------------------------------------------------------------------------
-- Group 1: Categories 37, 41, 44 (Tecnical Spec 1 2 3.docx)
--   - 37: Apartment Building
--   - 41: Duplex Steel Building
--   - 44: Simplex Prefab Building
-- ------------------------------------------------------------------------------
INSERT INTO `product_specs` (`product_id`, `spec_key`, `spec_value`, `sort_order`)
SELECT
  p.id AS product_id,
  specs.spec_key,
  specs.spec_value,
  (COALESCE(m.max_sort, -1) + 1 + specs.offset_num) AS sort_order
FROM `products` p
LEFT JOIN (
  SELECT product_id, MAX(sort_order) AS max_sort
  FROM `product_specs`
  GROUP BY product_id
) m ON m.product_id = p.id
CROSS JOIN (
  SELECT '5. TECHNICAL SPECIFICATION & CODES' AS spec_key, '' AS spec_value, 0 AS offset_num
  UNION ALL SELECT 'CODES AND STANDARD', 'Comply with Bangladesh Nation Building Code (BNBC)', 1
  UNION ALL SELECT 'EARTHQUAKE CONDITIONS', 'Earthquake resistant to magnitude 7.5', 2
  UNION ALL SELECT 'WIND SPEED VALUE', 'Cyclone resistant 250 km/h (Must be fixed to the ground)', 3
  UNION ALL SELECT 'CEMENT', 'Ordinary Portland Cement (OPC / CEM-I): Contains 95-100% clinker and 0-5% gypsum; graded by compressive strength (52.5 MPa). Brand SHAH CEMENT, AKIJ, CROWN, COSTAL PLAZ.', 4
  UNION ALL SELECT 'MILD STEEL RODS', 'ASTM A36 grade Tensile Strength: 410 to 510 MPa. Brand BSRM/AKS/KSRM.', 5
  UNION ALL SELECT 'STRUCTURAL STEEL', 'ASTM A36/SS400 grade Tensile Strength: 250 to 345 MPa.', 6
) specs
WHERE p.category_id IN (37, 41, 44)
  AND p.slug REGEXP '^[a-z0-9-]+\\.html$'
  AND NOT EXISTS (
    SELECT 1 FROM `product_specs` ps
    WHERE ps.product_id = p.id
      AND ps.spec_key = '5. TECHNICAL SPECIFICATION & CODES'
  )
ORDER BY p.id, specs.offset_num;


-- ------------------------------------------------------------------------------
-- Group 2: Categories 40, 39, 45 (Tecnical Spec 4 5 6.docx)
--   - 40: Cottage House
--   - 39: Container House
--   - 45: Steel House
-- ------------------------------------------------------------------------------
INSERT INTO `product_specs` (`product_id`, `spec_key`, `spec_value`, `sort_order`)
SELECT
  p.id AS product_id,
  specs.spec_key,
  specs.spec_value,
  (COALESCE(m.max_sort, -1) + 1 + specs.offset_num) AS sort_order
FROM `products` p
LEFT JOIN (
  SELECT product_id, MAX(sort_order) AS max_sort
  FROM `product_specs`
  GROUP BY product_id
) m ON m.product_id = p.id
CROSS JOIN (
  SELECT '5. TECHNICAL SPECIFICATION & CODES' AS spec_key, '' AS spec_value, 0 AS offset_num
  UNION ALL SELECT 'CODES AND STANDARD', 'Comply with Bangladesh Nation Building Code (BNBC)', 1
  UNION ALL SELECT 'EARTHQUAKE CONDITIONS', 'Earthquake resistant to magnitude 7.5', 2
  UNION ALL SELECT 'WIND SPEED VALUE', 'Cyclone resistant 250 km/h (Must be fixed to the ground)', 3
  UNION ALL SELECT 'CEMENT', 'Ordinary Portland Cement (OPC / CEM-I): Contains 95-100% clinker and 0-5% gypsum; graded by compressive strength (52.5 MPa). Brand SHAH CEMENT, AKIJ, CROWN, COSTAL PLAZ.', 4
  UNION ALL SELECT 'MILD STEEL RODS', 'ASTM A36 grade Tensile Strength: 410 to 510 MPa. Brand BSRM/AKS/KSRM.', 5
  UNION ALL SELECT 'STRUCTURAL STEEL', 'ASTM A36/SS400 grade Tensile Strength: 250 to 345 MPa.', 6
) specs
WHERE p.category_id IN (40, 39, 45)
  AND p.slug REGEXP '^[a-z0-9-]+\\.html$'
  AND NOT EXISTS (
    SELECT 1 FROM `product_specs` ps
    WHERE ps.product_id = p.id
      AND ps.spec_key = '5. TECHNICAL SPECIFICATION & CODES'
  )
ORDER BY p.id, specs.offset_num;


-- ------------------------------------------------------------------------------
-- Group 3: Categories 46, 47, 51 (Tecnical Spec 7 8 9.docx)
--   - 46: Tiny House
--   - 47: Wooden House
--   - 51: Low Cost House
-- ------------------------------------------------------------------------------
INSERT INTO `product_specs` (`product_id`, `spec_key`, `spec_value`, `sort_order`)
SELECT
  p.id AS product_id,
  specs.spec_key,
  specs.spec_value,
  (COALESCE(m.max_sort, -1) + 1 + specs.offset_num) AS sort_order
FROM `products` p
LEFT JOIN (
  SELECT product_id, MAX(sort_order) AS max_sort
  FROM `product_specs`
  GROUP BY product_id
) m ON m.product_id = p.id
CROSS JOIN (
  SELECT '5. TECHNICAL SPECIFICATION & CODES' AS spec_key, '' AS spec_value, 0 AS offset_num
  UNION ALL SELECT 'CODES AND STANDARD', 'Comply with Bangladesh Nation Building Code (BNBC)', 1
  UNION ALL SELECT 'EARTHQUAKE CONDITIONS', 'Earthquake resistant to magnitude 7.5', 2
  UNION ALL SELECT 'WIND SPEED VALUE', 'Cyclone resistant 250 km/h (Must be fixed to the ground)', 3
  UNION ALL SELECT 'CEMENT', 'Ordinary Portland Cement (OPC / CEM-I): Contains 95-100% clinker and 0-5% gypsum; graded by compressive strength (52.5 MPa). Brand SHAH CEMENT, AKIJ, CROWN, COSTAL PLAZ.', 4
  UNION ALL SELECT 'MILD STEEL RODS', 'ASTM A36 grade Tensile Strength: 410 to 510 MPa. Brand BSRM/AKS/KSRM.', 5
  UNION ALL SELECT 'STRUCTURAL STEEL', 'ASTM A36/SS400 grade Tensile Strength: 250 to 345 MPa.', 6
) specs
WHERE p.category_id IN (46, 47, 51)
  AND p.slug REGEXP '^[a-z0-9-]+\\.html$'
  AND NOT EXISTS (
    SELECT 1 FROM `product_specs` ps
    WHERE ps.product_id = p.id
      AND ps.spec_key = '5. TECHNICAL SPECIFICATION & CODES'
  )
ORDER BY p.id, specs.offset_num;


-- ==============================================================================
-- POST-SEED VERIFICATION QUERIES
-- (Run these after running the INSERT queries above to verify exact counts)
-- ==============================================================================

-- Verification 1: Summary of products covered and technical rows inserted per category
-- Expected:
--   Cat 37: 12 products, 84 rows
--   Cat 41: 12 products, 84 rows
--   Cat 44: 12 products, 84 rows
--   Cat 40: 17 products, 119 rows (excluding corrupted bh-ch-401.html-copy-9b110d)
--   Cat 39: 12 products, 84 rows
--   Cat 45: 12 products, 84 rows
--   Cat 46: 12 products, 84 rows
--   Cat 47: 12 products, 84 rows
--   Cat 51: 20 products, 140 rows
--   Total: 121 products, 847 rows
SELECT
  c.id AS category_id,
  c.name AS category_name,
  COUNT(DISTINCT p.id) AS valid_products_count,
  COUNT(ps.id) AS tech_spec_rows_count
FROM `categories` c
JOIN `products` p ON p.category_id = c.id AND p.slug REGEXP '^[a-z0-9-]+\\.html$'
LEFT JOIN `product_specs` ps ON ps.product_id = p.id
  AND (ps.spec_key = '5. TECHNICAL SPECIFICATION & CODES' OR ps.spec_key IN (
    'CODES AND STANDARD',
    'EARTHQUAKE CONDITIONS',
    'WIND SPEED VALUE',
    'CEMENT',
    'MILD STEEL RODS',
    'STRUCTURAL STEEL'
  ))
WHERE c.id IN (37, 41, 44, 40, 39, 45, 46, 47, 51)
GROUP BY c.id, c.name
ORDER BY c.id;

-- Verification 2: Check any product that does NOT have exactly 7 technical spec rows
-- (Should return 0 rows)
SELECT
  p.id AS product_id,
  p.category_id,
  p.slug,
  COUNT(ps.id) AS tech_spec_count
FROM `products` p
LEFT JOIN `product_specs` ps ON ps.product_id = p.id
  AND (ps.spec_key = '5. TECHNICAL SPECIFICATION & CODES' OR ps.spec_key IN (
    'CODES AND STANDARD',
    'EARTHQUAKE CONDITIONS',
    'WIND SPEED VALUE',
    'CEMENT',
    'MILD STEEL RODS',
    'STRUCTURAL STEEL'
  ))
WHERE p.category_id IN (37, 41, 44, 40, 39, 45, 46, 47, 51)
  AND p.slug REGEXP '^[a-z0-9-]+\\.html$'
GROUP BY p.id, p.category_id, p.slug
HAVING tech_spec_count <> 7;

-- Verification 3: Sample inspection of product specs for product ID 537 (bh-tsb-101.html)
SELECT spec_key, spec_value, sort_order
FROM `product_specs`
WHERE product_id = 537
ORDER BY sort_order;
