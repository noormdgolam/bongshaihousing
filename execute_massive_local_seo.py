import os
import glob
import re
import xml.etree.ElementTree as ET

root_dir = r'e:\web\Bongshaihousing'
html_files = glob.glob(os.path.join(root_dir, '*.html'))

print(f"==================================================")
print(f"   MASSIVE LOCAL SEO OPTIMIZATION - BONGSHAI HOUSING")
print(f"==================================================")
print(f"Scanning and optimizing {len(html_files)} HTML pages based on Local SEO PDF principles...\n")

# Local SEO Geo-Meta Tags Template
local_geo_tags = '''  <!-- ═══ LOCAL SEO & GEO TARGETING – Dhaka / Bangladesh ═══ -->
  <meta name="geo.region" content="BD-C" />
  <meta name="geo.placename" content="Uttara, Dhaka, Bangladesh" />
  <meta name="geo.position" content="23.8728;90.3984" />
  <meta name="ICBM" content="23.8728, 90.3984" />
  <meta name="DC.title" content="Bongshai Housing - Steel Building & Prefab House Manufacturer Bangladesh" />
  <meta name="DC.subject" content="Steel Building Company Bangladesh, Prefab House Dhaka, Composite Building" />'''

# Local Business Schema JSON-LD Template
local_business_schema = '''  <!-- LocalBusiness & RealEstateAgent Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": ["RealEstateAgent", "GeneralContractor", "HomeAndConstructionBusiness"],
    "name": "Bongshai Housing Ltd.",
    "alternateName": ["BongshaiHousing", "Bongshai Steel Building Company Bangladesh"],
    "url": "https://bongshaihousing.com",
    "logo": "https://bongshaihousing.com/images/logo.png",
    "description": "Bangladesh's #1 steel building company and EPC real estate developer. Specializing in steel composite buildings, prefab cottages, luxury villas, and single-story steel structures in Dhaka.",
    "telephone": "+8801781636613",
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
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
      "opens": "09:00",
      "closes": "19:00"
    },
    "sameAs": [
      "https://www.facebook.com/bongshaihousing",
      "https://wa.me/8801781636613"
    ]
  }
  </script>'''

updated_pages = 0

for filepath in html_files:
    fname = os.path.basename(filepath)
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    modified = False
    
    # 1. Add / Standardize Geo-Meta Tags if missing
    if 'name="geo.region"' not in content and "name='geo.region'" not in content:
        # Insert inside <head> after charset/viewport
        content = re.sub(
            r'(<meta [^>]*name=["\']viewport["\'][^>]*>)',
            r'\1\n' + local_geo_tags,
            content,
            flags=re.IGNORECASE
        )
        modified = True

    # 2. Add LocalBusiness Schema if missing in head
    if 'application/ld+json' not in content:
        content = re.sub(
            r'(</head>)',
            local_business_schema + '\n\\1',
            content,
            flags=re.IGNORECASE
        )
        modified = True

    # 3. Ensure Canonical Tag exists
    if 'rel="canonical"' not in content and "rel='canonical'" not in content:
        canonical_tag = f'  <link rel="canonical" href="https://bongshaihousing.com/{fname}" />'
        content = re.sub(
            r'(</head>)',
            canonical_tag + '\n\\1',
            content,
            flags=re.IGNORECASE
        )
        modified = True

    # 4. Enhance Image Alt & Title Tags for Local SEO Keywords
    # Ensure every local <img> tag has alt and title containing Bongshai Housing
    def img_replacer(match):
        img_str = match.group(0)
        if 'alt=' not in img_str.lower():
            img_str = img_str.replace('<img ', '<img alt="Bongshai Housing Prefab Structure Bangladesh" ')
        if 'title=' not in img_str.lower():
            img_str = img_str.replace('<img ', '<img title="Bongshai Housing Bangladesh" ')
        return img_str
        
    content_new = re.sub(r'<img [^>]+>', img_replacer, content)
    if content_new != content:
        content = content_new
        modified = True

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        updated_pages += 1

print(f"Applied Local SEO Geo-Tags, Schemas, Canonicals, and Local Keyword Alt Attributes to {updated_pages} pages!")

# 5. Generate / Update sitemap.xml with high priority for all active local landing pages
sitemap_file = os.path.join(root_dir, 'sitemap.xml')
url_entries = []

for filepath in sorted(html_files):
    fname = os.path.basename(filepath)
    if fname in ['404.html', 'maintenance.html', 'maintenance_backup.html']:
        continue
        
    if fname == 'index.html':
        priority = '1.0'
        changefreq = 'daily'
    elif any(k in fname for k in ['wooden', 'concrete', 'container', 'duplex', 'single', 'cottage', 'steel', 'tiny', 'projects', 'solutions', 'about', 'contact']):
        priority = '0.9'
        changefreq = 'weekly'
    elif fname.startswith('project-') or fname.startswith('prefab-') or fname.startswith('steel-building-'):
        priority = '0.8'
        changefreq = 'weekly'
    else:
        priority = '0.7'
        changefreq = 'monthly'
        
    url_entries.append(f'''  <url>
    <loc>https://bongshaihousing.com/{fname}</loc>
    <lastmod>2026-07-28</lastmod>
    <changefreq>{changefreq}</changefreq>
    <priority>{priority}</priority>
  </url>''')

sitemap_xml_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join(url_entries)}
</urlset>'''

with open(sitemap_file, 'w', encoding='utf-8') as f:
    f.write(sitemap_xml_content)

print(f"Generated optimized sitemap.xml with {len(url_entries)} local pages and priority mappings.")

# 6. Ensure robots.txt references sitemap.xml cleanly
robots_file = os.path.join(root_dir, 'robots.txt')
robots_content = '''User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/
Disallow: /temp/

Sitemap: https://bongshaihousing.com/sitemap.xml
'''

with open(robots_file, 'w', encoding='utf-8') as f:
    f.write(robots_content)

print("Updated robots.txt with sitemap reference.")
