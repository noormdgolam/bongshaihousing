# Bongshai Housing — Agent Handoff Log

> **Purpose:** Running log of changes made each session so the next Claude instance has full context.  
> **Rule:** Always append a new entry at the top (newest first). Never delete old entries.

---

## Session: 2026-09-06 (Sunday morning, BDT) — Category Specifications (All 9 Categories) & Free Claude Code Setup

### Done ✅

| # | What | File(s) changed | Notes |
|---|------|-----------------|-------|
| 1 | **Extracted specs from 3 client .docx files** | Sourced from `Tecnical Spec 1 2 3.docx`, `Tecnical Spec 4 5 6.docx`, `Tecnical Spec 7 8 9.docx` in Downloads. | Mapped to categories 1–9 top-to-bottom. |
| 2 | **Generated complete SQL seed file** | `scratch/seed_category_specs.sql` | 171 rows: 6 technical + 13 building specs per category. Deletes all old data for all 9 categories first. |
| 3 | **Generated SQL generator script** | `scratch/generate_spec_sql.js` | Re-runnable script to regenerate `seed_category_specs.sql` whenever needed. |
| 4 | **Created Claude Deployment Guide** | `CLAUDE_DEPLOY_CATEGORY_SPECS.md` | Clear, detailed instructions, category ID mappings, and verification SQL for Claude Code to deploy. |
| 5 | **Cloned & configured Free Claude Code** | `e:\web\free-claude-code`, `run-claude.bat` | Installed dependencies via `uv sync`, created `.env`, `start-proxy.bat`, and `run-claude.bat`. |

### Next Steps for Claude 📋

- [ ] Run `scratch/seed_category_specs.sql` in phpMyAdmin on `abongsha_bongshai_app` (or via MySQL).
- [ ] Run verification query from `CLAUDE_DEPLOY_CATEGORY_SPECS.md` to confirm all 9 categories have 13 building + 6 technical specs.
- [ ] Verify live rendering on product detail pages (e.g. `bh-tsb-101.html`).

---

## Session: 2026-09-05 (Saturday night, BDT)

### Done ✅

| # | What | File(s) changed | Commit |
|---|------|-----------------|--------|
| 1 | **Homepage `<title>` rebranded** — changed from *"Steel Building Company Bangladesh \| Bongshai Housing"* to **"The first prefab steel-concrete building manufacturer in Bangladesh \| Bongshai Housing"**. Applied to `title`, `ogTitle`, and `twitterTitle` so the WhatsApp link card preview also shows the new tagline. | `server/page-registry.json` (lines 4, 10, 15) | `ecfafa50` on branch `v0/security-fixes` |

### Deploy Notes 🚀

- Branch **`v0/security-fixes`** was pushed to GitHub.  
- This branch deploys to **`test.bongshaihousing.com`** (staging), NOT `main`.  
- To go live: merge `v0/security-fixes` → `main` (GitHub Actions FTP auto-deploys on every `main` push).
- After deploy, share the bongshaihousing.com homepage link in WhatsApp again and verify the link-preview card shows the new title.

### Pending / Next Steps 📋

- [ ] Verify WhatsApp link card title after staging deploy (clear WhatsApp cache or use a fresh device).
- [ ] Consider updating the visible **hero headline** on the homepage (`index.njk`) to match, e.g. the `.hero-title` element — currently the page title and the on-page H1 may be inconsistent.
- [ ] Optionally update the JSON-LD `"slogan"` field in `index.njk` (line 18) from *"Bangladesh's Premier Steel Building Company"* to match the new positioning.

---

*Add new sessions above this line.*
