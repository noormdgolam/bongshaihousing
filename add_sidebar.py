#!/usr/bin/env python3
"""
Inject a category sidebar into all inner product pages.
For each page, wraps the first <section class="section"> content in a
.page-with-sidebar layout and prepends the category sidebar.
"""
import re

# Map of filename -> active cat-item href
PAGE_ACTIVE = {
    # Residential
    "low-cost-villa.html":              "low-cost-villa.html",
    "luxury-villa.html":                  "luxury-villa.html",
    "multi-story-homes.html":             "multi-story-homes.html",
    # Commercial & Industrial
    "single-story-building.html":         "single-story-building.html",
    "industrial-sheds.html":              "industrial-sheds.html",
    "worker-accommodation.html":          "worker-accommodation.html",
    # Site Solutions
    "site-offices.html":                  "site-offices.html",
    "security-kiosks.html":               "security-kiosks.html",
    # Security sub-pages
    "guard-house.html":                   "guard-house.html",
    "gatehouses.html":                    "gatehouses.html",
    "security-huts.html":                 "security-huts.html",
    "modular-kiosks.html":                "modular-kiosks.html",
    "prefabricated-booths.html":          "prefabricated-booths.html",
    "bullet-resistant-guard-booths.html": "bullet-resistant-guard-booths.html",
    "portable-toilets-and-showers.html":  "portable-toilets-and-showers.html",
    "team-client-service.html":           None,
}

def make_sidebar(active_href):
    """Return the full sidebar HTML with correct .active class set."""

    ALL_ITEMS = [
        # (href, label, group, is_sub)
        ("low-cost-villa.html",              "Low-Cost Villa",           "residential", False),
        ("luxury-villa.html",                  "Luxury Villa",               "residential", False),
        ("multi-story-homes.html",             "Multi-Story Homes",          "residential", False),
        ("single-story-building.html",         "Single Story Building",      "commercial",  False),
        ("industrial-sheds.html",              "Industrial Steel Sheds",     "commercial",  False),
        ("worker-accommodation.html",          "Worker Accommodation",       "commercial",  False),
        ("site-offices.html",                  "Site Offices",               "site",        False),
        ("security-kiosks.html",               "Security Kiosks",            "site",        False),
        ("guard-house.html",                   "Guard House",                "security",    True),
        ("gatehouses.html",                    "Gatehouses",                 "security",    True),
        ("security-huts.html",                 "Security Huts",              "security",    True),
        ("modular-kiosks.html",                "Modular Kiosks",             "security",    True),
        ("prefabricated-booths.html",          "Prefabricated Booths",       "security",    True),
        ("bullet-resistant-guard-booths.html", "Bullet Resistant Booths",    "security",    True),
        ("portable-toilets-and-showers.html",  "Portable Toilets & Showers", "security",    True),
    ]

    GROUP_LABELS = {
        "residential": "Residential Prefab",
        "commercial":  "Commercial & Industrial",
        "site":        "Site Solutions",
        "security":    "Security & Guard Units",
    }

    items_html = []
    last_group = None

    for (href, label, group, is_sub) in ALL_ITEMS:
        # Print group label when group changes
        if group != last_group:
            first = "first-child" if last_group is None else ""
            items_html.append(f'          <div class="cat-group-label">{GROUP_LABELS[group]}</div>')
            last_group = group

        is_active = (href == active_href)
        active_cls = " active" if is_active else ""
        sub_cls = " sub" if is_sub else ""
        cls = f"cat-item{sub_cls}{active_cls}"

        if is_sub:
            items_html.append(
                f'          <a href="{href}" class="{cls}">'
                f'<span class="cat-bullet"></span>{label}'
                f'<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>'
                f'</a>'
            )
        else:
            items_html.append(
                f'          <a href="{href}" class="{cls}">'
                f'{label}'
                f'<svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>'
                f'</a>'
            )

    items_str = "\n".join(items_html)

    sidebar = f"""
        <!-- ===== CATEGORY SIDEBAR ===== -->
        <aside class="cat-sidebar" aria-label="Product categories">
          <!-- Mobile toggle -->
          <button class="cat-sidebar-toggle" id="catSidebarToggle" aria-expanded="false" aria-controls="catSidebarBody">
            <span>All Products</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <!-- Desktop header -->
          <div class="cat-sidebar-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            All Products
          </div>
          <div class="cat-sidebar-body" id="catSidebarBody">
{items_str}
            <div class="cat-sidebar-cta">
              <a href="contact.html">📞 Get a Free Quote</a>
            </div>
          </div>
        </aside>"""

    return sidebar


def inject_sidebar(filepath, active_href):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if already has sidebar
    if 'cat-sidebar' in content:
        print(f"  SKIP (already has sidebar): {filepath}")
        return

    sidebar_html = make_sidebar(active_href)

    # Pattern: find the FIRST <section class="section"...> → <div class="container">
    # We wrap the content of that container in .page-with-sidebar
    # We replace: <div class="container">\n        \n        <div class="about-grid">
    # with:       <div class="container">\n        <div class="page-with-sidebar">\n          {sidebar}\n          <div class="page-sidebar-content">\n            <div class="about-grid">

    # Strategy: find <section class="section" and inside it find the container and about-grid
    # Then wrap them

    # Find the first <section class="section"> block's container
    # Pattern: look for the about-grid inside container inside section.section
    pattern = re.compile(
        r'(<section\b[^>]*\bclass="section"[^>]*>)\s*'
        r'(<div class="container">)\s*'
        r'(\s*<div class="about-grid">)',
        re.DOTALL
    )

    def replacer(m):
        section_tag = m.group(1)
        container_div = m.group(2)
        about_grid = m.group(3)
        return (
            f'{section_tag}\n'
            f'      {container_div}\n'
            f'        <div class="page-with-sidebar">\n'
            f'{sidebar_html}\n'
            f'          <div class="page-sidebar-content">\n'
            f'{about_grid}'
        )

    new_content, count = re.subn(pattern, replacer, content, count=1)

    if count == 0:
        print(f"  WARN: pattern not found in {filepath}")
        return

    # Now we need to close the .page-sidebar-content and .page-with-sidebar divs
    # after the matching </div> that closes about-grid.
    # We look for the closing </div></div></section> after the about-grid.
    # Because we inserted 2 extra wrappers, we need to add 2 closing </div>s

    # Find the specific section containing page-with-sidebar and close it properly
    # Simple approach: find the pattern: </div>\n      </div>\n    </section> right after
    # the injected content (first occurrence after page-with-sidebar)

    sidebar_inserted_at = new_content.find('page-with-sidebar')

    # After inserting, find the container's closing pattern
    # The original structure was:
    #   </div>      ← closes about-grid
    # </div>        ← closes container
    # Then we need to add:
    # </div>        ← closes page-sidebar-content
    # </div>        ← closes page-with-sidebar

    # Find the section after sidebar insertion
    after_sidebar = new_content[sidebar_inserted_at:]

    # Pattern to find end of about-grid + container closing (first occurrence)
    end_pattern = re.compile(
        r'(</div>\s*\n\s*</div>\s*\n\s*</section>)',
    )

    def close_replacer(m):
        return m.group(1).replace(
            '</div>',
            '</div>\n          </div><!-- /page-sidebar-content -->\n        </div><!-- /page-with-sidebar -->',
            1  # only the FIRST </div> (the about-grid close)
        )

    new_after, c2 = end_pattern.subn(close_replacer, after_sidebar, count=1)

    if c2 == 0:
        print(f"  WARN: could not close wrappers in {filepath}")
        return

    new_content = new_content[:sidebar_inserted_at] + new_after

    # Add mobile toggle JS if not present
    sidebar_js = """
    // Category sidebar mobile toggle
    (function() {
      var toggle = document.getElementById('catSidebarToggle');
      var body   = document.getElementById('catSidebarBody');
      if (toggle && body) {
        toggle.addEventListener('click', function() {
          var isOpen = body.classList.toggle('open');
          toggle.classList.toggle('open', isOpen);
          toggle.setAttribute('aria-expanded', isOpen);
        });
      }
    })();"""

    # Insert before the closing </script> tag that has the reveal/intersection observer
    new_content = new_content.replace(
        "const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');",
        sidebar_js + "\n    const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');",
        1
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"  OK: {filepath}")


import os

pages_dir = os.path.dirname(os.path.abspath(__file__))

for filename, active_href in PAGE_ACTIVE.items():
    if active_href is None:
        continue
    fpath = os.path.join(pages_dir, filename)
    if os.path.exists(fpath):
        print(f"Processing {filename}...")
        inject_sidebar(fpath, active_href)
    else:
        print(f"  NOT FOUND: {fpath}")

print("\nDone!")
