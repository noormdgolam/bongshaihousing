import os
import glob

# SEO Tags to inject
geo_meta_tags = """
  <!-- ═══ LOCAL SEO – Dhaka / Bangladesh ═══ -->
  <meta name="geo.region" content="BD-C" />
  <meta name="geo.placename" content="Uttara, Dhaka, Bangladesh" />
  <meta name="geo.position" content="23.8728;90.3984" />
  <meta name="ICBM" content="23.8728, 90.3984" />
"""

json_ld_schema = """
  <!-- Schema.org Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": ["RealEstateAgent", "GeneralContractor", "HomeAndConstructionBusiness"],
    "name": "Bongshai Housing Ltd.",
    "alternateName": ["BongshaiHousing", "Bongshai Steel Building Company", "Bongshai Housing Bangladesh"],
    "url": "https://bongshaihousing.com",
    "description": "Bangladesh's #1 steel building company and EPC real estate developer. Specializing in steel composite buildings, prefab cottages, luxury villas, and single-story steel structures in Dhaka.",
    "telephone": ["+8801781636613"],
    "email": "sales@bongshai.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "House #18, Road #18, Sector #10",
      "addressLocality": "Uttara",
      "addressRegion": "Dhaka",
      "postalCode": "1230",
      "addressCountry": "BD"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "23.8728",
      "longitude": "90.3984"
    }
  }
  </script>
"""

html_files = glob.glob(r"e:\web\Bongshaihousing\*.html")

for file_path in html_files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Inject Geo Meta Tags
    if 'name="geo.region"' not in content:
        # Insert after <meta name="viewport"... if present, or just inside <head>
        if '<meta name="viewport"' in content:
            content = content.replace('<meta name="viewport" content="width=device-width, initial-scale=1.0" />', 
                                      '<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n' + geo_meta_tags)
        else:
            content = content.replace('<head>', '<head>\n' + geo_meta_tags)

    # 2. Inject JSON-LD
    if 'application/ld+json' not in content:
        # Insert just before </head>
        content = content.replace('</head>', json_ld_schema + '\n</head>')

    # 3. Update Title to include local keywords if missing
    # e.g., if title is <title>Duplex Villa</title>, change to <title>Duplex Villa in Bangladesh | Bongshai Housing</title>
    # Note: index.html already has a good title, so we skip if "Bangladesh" is already there.
    import re
    title_match = re.search(r'<title>(.*?)</title>', content)
    if title_match:
        title_text = title_match.group(1)
        if "Bangladesh" not in title_text and "Bongshai" not in title_text:
            new_title = f"<title>{title_text.strip()} in Bangladesh | Bongshai Housing</title>"
            content = content.replace(f"<title>{title_text}</title>", new_title)

    # 4. Inject Footer Microdata
    old_address = '<address class="footer-contact-items" style="font-style:normal">'
    new_address = '<address class="footer-contact-items" style="font-style:normal" itemscope itemtype="http://schema.org/LocalBusiness">\n<span itemprop="name" style="display:none;">Bongshai Housing Ltd.</span>'
    if old_address in content and 'itemscope' not in content:
        content = content.replace(old_address, new_address)
        # Add itemprops to address components
        content = content.replace('House #18, Road #18, Sector #10, Uttara, Dhaka – 1230', '<span itemprop="address">House #18, Road #18, Sector #10, Uttara, Dhaka – 1230</span>')
        content = content.replace('<a href="tel:+8801781636613"', '<a href="tel:+8801781636613" itemprop="telephone"')
        content = content.replace('<a href="mailto:sales@bongshai.com"', '<a href="mailto:sales@bongshai.com" itemprop="email"')

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

print(f"Processed {len(html_files)} HTML files for Local SEO injection.")
