# Category Specifications Deployment Guide for Claude Code

## Overview
All technical and building specifications for the **9 product categories** have been extracted from the client `.docx` files, validated, and generated into an idempotent SQL script ready for database execution.

Per user instruction: **Do not deploy now — saved locally for Claude to deploy.**

---

## 1. Category Mapping Reference

The categories map 1–9 from top to bottom based on the website navigation order:

| Serial | Category ID | Category Name | Source Spec Docx | Key Specs Summary |
|---|---|---|---|---|
| **1** | `37` | Apartment Building | Tecnical Spec 1 2 3 | Mehagoni doors, RC roof slab, homogenous tiles 24x24, metal fittings |
| **2** | `41` | Duplex Steel Building | Tecnical Spec 1 2 3 | Mehagoni doors, RC roof slab, homogenous tiles 24x24, metal fittings |
| **3** | `44` | Simplex Prefab Building | Tecnical Spec 1 2 3 | Mehagoni doors, RC roof slab, homogenous tiles 24x24, metal fittings |
| **4** | `40` | Cottage House | Tecnical Spec 4 5 6 | Steel doors, 0.4mm profile sheet roof, net cement floor, uPVC fittings |
| **5** | `39` | Container House | Tecnical Spec 4 5 6 | Steel doors, 0.4mm profile sheet roof, net cement floor, uPVC fittings |
| **6** | `45` | Steel House | Tecnical Spec 4 5 6 | Steel doors, 0.4mm profile sheet roof, net cement floor, uPVC fittings |
| **7** | `46` | Tiny House | Tecnical Spec 7 8 9 | Mehagoni doors, 0.4mm profile sheet roof, homogenous tiles, metal fittings |
| **8** | `47` | Wooden House | Tecnical Spec 7 8 9 | Mehagoni doors, 0.4mm profile sheet roof, homogenous tiles, metal fittings |
| **9** | `51` | Low Cost House | Tecnical Spec 7 8 9 | Mehagoni doors, 0.4mm profile sheet roof, homogenous tiles, metal fittings |

Each category has **6 Technical Specs** and **13 Building Specs** = 19 specs per category × 9 categories = **171 total rows**.

---

## 2. Prepared Files (Saved Locally)

1. **SQL Seed File:** `scratch/seed_category_specs.sql`
   - Step 1: Deletes all previous specs for all 9 categories:
     ```sql
     DELETE FROM `category_specs` WHERE `category_id` IN (37, 41, 44, 40, 39, 45, 46, 47, 51);
     ```
   - Step 2: Inserts all 171 clean, verified rows.
   - Step 3: Includes verification query.

2. **Generator Script:** `scratch/generate_spec_sql.js`
   - Can regenerate `scratch/seed_category_specs.sql` at any time if edits are needed:
     ```bash
     node scratch/generate_spec_sql.js
     ```

3. **Frontend & Admin Verification:**
   - Frontend template: `server/views/pages/product-detail.njk` (already queries and displays `category_specs`).
   - Admin UI: `/admin/categories/:id` (supports viewing and editing specs).

---

## 3. How to Deploy (When Claude Runs)

### Target Database Credentials:
- **cPanel URL:** `https://bongshaihousing.com:2083`
- **User:** `abongsha`
- **Database:** `abongsha_bongshai_app`
- **Table:** `category_specs`

### Option A: Via cPanel phpMyAdmin (Recommended)
1. Log in to cPanel at `https://bongshaihousing.com:2083`.
2. Click **phpMyAdmin** → select database `abongsha_bongshai_app`.
3. Open the **SQL** tab.
4. Copy and paste the entire content of `scratch/seed_category_specs.sql`.
5. Click **Go** to execute.

### Option B: Via Server Terminal / SSH
If SSH access or cPanel terminal is open:
```bash
mysql -u abongsha -p abongsha_bongshai_app < scratch/seed_category_specs.sql
```

---

## 4. Verification After Deployment

Run this query in phpMyAdmin or MySQL to verify exact counts:
```sql
SELECT c.id, c.name, cs.spec_type, COUNT(*) AS row_count
FROM `categories` c
LEFT JOIN `category_specs` cs ON cs.category_id = c.id
WHERE c.id IN (37, 41, 44, 40, 39, 45, 46, 47, 51)
GROUP BY c.id, c.name, cs.spec_type
ORDER BY c.id, cs.spec_type;
```

**Expected Result:**
Every single category (37, 41, 44, 40, 39, 45, 46, 47, 51) MUST return:
- `building`: 13 rows
- `technical`: 6 rows
Total: 171 rows across all 9 categories.
