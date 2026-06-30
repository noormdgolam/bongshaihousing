#!/usr/bin/env python3
"""
Add "Container House" to all existing product pages:
1. After multi-story-homes in the category sidebar
2. After multi-story-homes in the navbar dropdown
3. After multi-story-homes in the mobile drawer
"""
import os, glob

PAGES_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Sidebar insertion ────────────────────────────────────────────────────────
SIDEBAR_OLD = '<a href="multi-story-homes.html" class="cat-item">Multi-Story Homes<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>'
SIDEBAR_NEW = SIDEBAR_OLD + '\n          <a href="container-house.html" class="cat-item">Container House<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>'

# Same but with active class (for multi-story-homes.html, keep multi-story active; we just need to insert after it)
SIDEBAR_OLD_ACTIVE = '<a href="multi-story-homes.html" class="cat-item active">Multi-Story Homes<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>'
SIDEBAR_NEW_ACTIVE = SIDEBAR_OLD_ACTIVE + '\n          <a href="container-house.html" class="cat-item">Container House<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></a>'

# ── Navbar dropdown insertion ────────────────────────────────────────────────
NAV_OLD = """            <a href="multi-story-homes.html" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">
              <div class="dropdown-icon" style="font-size:1.2rem;">🏢</div>
              <div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Multi-Story Homes</strong></div>
            </a>
            <div style="padding:var(--space-3) var(--space-3) 0;font-size:0.7rem;font-weight:700;color:var(--grey-500);text-transform:uppercase;border-top:1px solid var(--grey-100);">Commercial &amp; Industrial</div>"""

NAV_NEW = """            <a href="multi-story-homes.html" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">
              <div class="dropdown-icon" style="font-size:1.2rem;">🏢</div>
              <div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Multi-Story Homes</strong></div>
            </a>
            <a href="container-house.html" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">
              <div class="dropdown-icon" style="font-size:1.2rem;">📦</div>
              <div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Container House</strong></div>
            </a>
            <div style="padding:var(--space-3) var(--space-3) 0;font-size:0.7rem;font-weight:700;color:var(--grey-500);text-transform:uppercase;border-top:1px solid var(--grey-100);">Commercial &amp; Industrial</div>"""

# ── Mobile drawer insertion ──────────────────────────────────────────────────
MOBILE_OLD = '          <a href="multi-story-homes.html" class="mobile-sub-link">🏢 Multi-Story Homes</a>'
MOBILE_NEW = MOBILE_OLD + '\n          <a href="container-house.html" class="mobile-sub-link">📦 Container House</a>'

html_files = glob.glob(os.path.join(PAGES_DIR, "*.html"))

for fpath in sorted(html_files):
    fname = os.path.basename(fpath)
    if fname == 'container-house.html':
        continue  # already has it

    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if already updated
    if 'container-house.html' in content:
        print(f"  SKIP (already has container-house): {fname}")
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

    if changed:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  OK: {fname}")
    else:
        print(f"  no match: {fname}")

print("\nDone!")
