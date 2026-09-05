# Bongshai Housing — Agent Handoff Log

> **Purpose:** Running log of changes made each session so the next Claude instance has full context.  
> **Rule:** Always append a new entry at the top (newest first). Never delete old entries.

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
