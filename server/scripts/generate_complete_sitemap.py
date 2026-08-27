import glob, os, datetime

BASE_URL = "https://bongshaihousing.com"
TODAY = datetime.date.today().isoformat()

# Files to explicitly exclude
EXCLUDE_FILES = {
    '404.html', 'offline.html', '_footer.html', '_header.html', '_mobile_drawer.html',
    'career.html', 'career-apply.html', 'u8-2.html'
}

# Priorities & Change Frequencies
PAGE_CONFIGS = {
    'index.html': ('1.0', 'weekly'),
    'products-and-solutions.html': ('0.9', 'weekly'),
    'about.html': ('0.85', 'monthly'),
    'projects.html': ('0.85', 'weekly'),
    'gallery.html': ('0.8', 'weekly'),
    'contact.html': ('0.85', 'monthly'),
    'faq.html': ('0.8', 'monthly'),
    'certifications.html': ('0.8', 'monthly'),
    'service-areas.html': ('0.85', 'weekly'),
    'solutions.html': ('0.8', 'monthly'),
    'interactive-tools.html': ('0.8', 'monthly'),
    'agent/signup.html': ('0.7', 'monthly'),
    'agent/login.html': ('0.5', 'monthly'),
    'my-project/login.html': ('0.5', 'monthly'),
    'privacy-policy.html': ('0.3', 'yearly'),
    'terms.html': ('0.3', 'yearly'),
}

CATEGORIES = {
    'apartment-building.html', 'duplex-steel-building.html', 'simplex-steel-building.html',
    'cottage-house.html', 'container-house.html', 'steel-house.html', 'tiny-house.html',
    'wooden-house.html', 'concrete-building.html', 'industrial-sheds.html',
    'worker-accommodation.html', 'luxury-villa.html', 'multi-story-homes.html',
    'other-residential.html'
}

def get_url_entry(path, priority='0.7', changefreq='monthly', lastmod=TODAY):
    if path == 'index.html':
        loc = f"{BASE_URL}/"
    else:
        loc = f"{BASE_URL}/{path}"
    return f"""  <url>
    <loc>{loc}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>{changefreq}</changefreq>
    <priority>{priority}</priority>
  </url>"""

def build_sitemap():
    entries = []
    
    # 1. Root and Core pages
    core_ordered = [
        'index.html', 'products-and-solutions.html', 'about.html', 'projects.html',
        'gallery.html', 'contact.html', 'faq.html', 'certifications.html',
        'service-areas.html', 'solutions.html', 'interactive-tools.html'
    ]
    for p in core_ordered:
        if os.path.exists(p):
            priority, changefreq = PAGE_CONFIGS.get(p, ('0.8', 'monthly'))
            entries.append(get_url_entry(p, priority, changefreq))

    # 2. Categories
    for cat in sorted(list(CATEGORIES)):
        if os.path.exists(cat):
            entries.append(get_url_entry(cat, '0.85', 'weekly'))

    # 3. District Landing Pages
    districts = sorted(glob.glob('steel-building-*.html') + glob.glob('prefab-*.html'))
    for d in districts:
        if d not in EXCLUDE_FILES and d not in CATEGORIES:
            entries.append(get_url_entry(d, '0.8', 'monthly'))

    # 4. Product Models (BH-*, DV-*, LCV-*)
    models = sorted(glob.glob('bh-*.html') + glob.glob('dv-*.html') + glob.glob('lcv-*.html'))
    for m in models:
        if m not in EXCLUDE_FILES and m not in CATEGORIES:
            entries.append(get_url_entry(m, '0.75', 'monthly'))

    # 5. Projects
    projects = sorted(glob.glob('project-*.html'))
    for proj in projects:
        if proj not in EXCLUDE_FILES:
            entries.append(get_url_entry(proj, '0.7', 'monthly'))

    # 6. Supporting certification, comparison & team pages
    others = sorted(
        glob.glob('iso-*.html') + glob.glob('ohsas-*.html') + glob.glob('material-*.html') +
        glob.glob('steel-vs-*.html') + glob.glob('team-*.html') + ['privacy-policy.html', 'terms.html']
    )
    for o in others:
        if os.path.exists(o) and o not in EXCLUDE_FILES:
            priority, changefreq = PAGE_CONFIGS.get(o, ('0.6', 'monthly'))
            entries.append(get_url_entry(o, priority, changefreq))

    # 7. Agent & Portal Pages
    for portal in ['agent/signup.html', 'agent/login.html', 'my-project/login.html']:
        priority, changefreq = PAGE_CONFIGS.get(portal, ('0.5', 'monthly'))
        entries.append(get_url_entry(portal, priority, changefreq))

    # Deduplicate while preserving order
    seen_locs = set()
    deduped_entries = []
    for entry in entries:
        loc = entry.split('<loc>')[1].split('</loc>')[0]
        if loc not in seen_locs:
            seen_locs.add(loc)
            deduped_entries.append(entry)

    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    xml_content += '\n'.join(deduped_entries)
    xml_content += '\n</urlset>\n'

    return xml_content, len(deduped_entries)

xml, count = build_sitemap()

# Write sitemap.xml
with open('sitemap.xml', 'w', encoding='utf-8') as f:
    f.write(xml)
print(f"Generated sitemap.xml with {count} URLs.")

# Write server/data/static-sitemap.xml
os.makedirs('server/data', exist_ok=True)
with open('server/data/static-sitemap.xml', 'w', encoding='utf-8') as f:
    f.write(xml)
print(f"Generated server/data/static-sitemap.xml with {count} URLs.")
