#!/usr/bin/env python3
import os, glob

PAGES_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Sidebar insertion ────────────────────────────────────────────────────────
SIDEBAR_OLD = '<a href="low-cost-villa.html" class="cat-item">Low-Cost Villa<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>'
SIDEBAR_NEW = SIDEBAR_OLD + '\n          <a href="low-cost-villa.html" class="cat-item">Low-Cost Villa<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>'

SIDEBAR_OLD_ACTIVE = '<a href="low-cost-villa.html" class="cat-item active">Low-Cost Villa<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>'
SIDEBAR_NEW_ACTIVE = SIDEBAR_OLD_ACTIVE + '\n          <a href="low-cost-villa.html" class="cat-item">Low-Cost Villa<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>'

# ── Navbar dropdown insertion ────────────────────────────────────────────────
NAV_OLD = """            <a href="low-cost-villa.html" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">
              <div class="dropdown-icon" style="font-size:1.2rem;">🏡</div>
              <div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Low-Cost Villa</strong></div>
            </a>"""

NAV_NEW = """            <a href="low-cost-villa.html" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">
              <div class="dropdown-icon" style="font-size:1.2rem;">🏡</div>
              <div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Low-Cost Villa</strong></div>
            </a>
            <a href="low-cost-villa.html" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">
              <div class="dropdown-icon" style="font-size:1.2rem;">🏠</div>
              <div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Low-Cost Villa</strong></div>
            </a>"""

# ── Mobile drawer insertion ──────────────────────────────────────────────────
MOBILE_OLD = '          <a href="low-cost-villa.html" class="mobile-sub-link">🏡 Low-Cost Villa</a>'
MOBILE_NEW = MOBILE_OLD + '\n          <a href="low-cost-villa.html" class="mobile-sub-link">🏠 Low-Cost Villa</a>'

# ── Footer insertion ─────────────────────────────────────────────────────────
FOOTER_OLD = '<nav class="footer-links"><a href="low-cost-villa.html" class="footer-link">Low-Cost Villa</a><a href="luxury-villa.html"'
FOOTER_NEW = '<nav class="footer-links"><a href="low-cost-villa.html" class="footer-link">Low-Cost Villa</a><a href="low-cost-villa.html" class="footer-link">Low-Cost Villa</a><a href="luxury-villa.html"'


html_files = glob.glob(os.path.join(PAGES_DIR, "*.html"))

for fpath in sorted(html_files):
    fname = os.path.basename(fpath)

    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if already updated, but we want to make sure we don't skip the newly generated pages if they don't have it
    # Actually the new pages were generated from low-cost-cottage, so they only have low-cost-cottage, not low-cost-villa in their navs.
    # So we should apply this to all files.
    if '<a href="low-cost-villa.html" class="cat-item">' in content or '<a href="low-cost-villa.html" class="dropdown-item"' in content:
        print(f"  SKIP (already has low-cost-villa): {fname}")
        continue

    changed = False

    # 1. Sidebar (active variant first, then normal)
    if SIDEBAR_OLD_ACTIVE in content:
        content = content.replace(SIDEBAR_OLD_ACTIVE, SIDEBAR_NEW_ACTIVE, 1)
        changed = True
    elif SIDEBAR_OLD in content:
        content = content.replace(SIDEBAR_OLD, SIDEBAR_NEW, 1)
        changed = True

    # 2. Navbar dropdown
    if NAV_OLD in content:
        content = content.replace(NAV_OLD, NAV_NEW, 1)
        changed = True

    # 3. Mobile drawer
    if MOBILE_OLD in content:
        content = content.replace(MOBILE_OLD, MOBILE_NEW, 1)
        changed = True

    # 4. Footer
    if FOOTER_OLD in content:
        content = content.replace(FOOTER_OLD, FOOTER_NEW, 1)
        changed = True

    if changed:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  OK: {fname}")
    else:
        print(f"  no match: {fname}")

print("\nDone!")
