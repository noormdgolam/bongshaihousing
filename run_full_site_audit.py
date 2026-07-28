import os
import glob
import re
import hashlib
from collections import defaultdict
from urllib.parse import unquote

root_dir = r'e:\web\Bongshaihousing'
html_files = glob.glob(os.path.join(root_dir, '*.html'))

print("==================================================")
print("           BONGSHAI HOUSING SITE AUDIT           ")
print("==================================================")
print(f"Total HTML pages scanned: {len(html_files)}\n")

# 1. Broken Images Audit
broken_images = []
total_img_tags = 0

img_pattern = re.compile(r'<img [^>]*src=["\']([^"\']+)["\']', re.IGNORECASE)

for html_file in html_files:
    fname = os.path.basename(html_file)
    with open(html_file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    imgs = img_pattern.findall(content)
    total_img_tags += len(imgs)
    
    for img_src in imgs:
        if img_src.startswith('http://') or img_src.startswith('https://') or img_src.startswith('//'):
            continue
        
        # Local image path
        clean_src = unquote(img_src.split('?')[0].split('#')[0])
        local_path = os.path.join(root_dir, clean_src.replace('/', '\\'))
        
        if not os.path.exists(local_path):
            broken_images.append((fname, img_src))

print(f"1. BROKEN IMAGES CHECK:")
print(f"   Total image tags checked: {total_img_tags}")
if not broken_images:
    print("   [OK] Clean! 0 broken local image paths.\n")
else:
    print(f"   [FAIL] Found {len(broken_images)} broken image links:")
    for fname, src in broken_images[:10]:
        print(f"      - Page [{fname}]: {src}")
    if len(broken_images) > 10:
        print(f"      ... and {len(broken_images) - 10} more.")
    print()

# 2. Internal Href Links Audit
broken_links = []
total_links = 0
href_pattern = re.compile(r'<a [^>]*href=["\']([^"\']+)["\']', re.IGNORECASE)

for html_file in html_files:
    fname = os.path.basename(html_file)
    with open(html_file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    links = href_pattern.findall(content)
    total_links += len(links)
    
    for href in links:
        if href.startswith('http://') or href.startswith('https://') or href.startswith('tel:') or href.startswith('mailto:') or href.startswith('javascript:') or href.startswith('#') or href.startswith('wa.me'):
            continue
        
        clean_href = unquote(href.split('?')[0].split('#')[0])
        if not clean_href:
            continue
            
        local_path = os.path.join(root_dir, clean_href.replace('/', '\\'))
        if not os.path.exists(local_path):
            broken_links.append((fname, href))

print(f"2. INTERNAL LINKS CHECK:")
print(f"   Total internal links checked: {total_links}")
if not broken_links:
    print("   [OK] Clean! 0 broken internal links.\n")
else:
    print(f"   [FAIL] Found {len(broken_links)} broken internal links:")
    for fname, href in broken_links[:10]:
        print(f"      - Page [{fname}]: {href}")
    if len(broken_links) > 10:
        print(f"      ... and {len(broken_links) - 10} more.")
    print()

# 3. Category Catalog Card & Image Hash Audit
card_pattern = re.compile(
    r'<div class="property-card[^"]*"[^>]*>.*?<img [^>]*src=["\']([^"\']+)["\'][^>]*>.*?<h3 class="property-name">([^<]+)</h3>',
    re.DOTALL
)

category_pages = [
    'wooden-house.html', 'concrete-building.html', 'container-house.html',
    'two-story-building.html', 'duplex-villa.html', 'single-story-building.html',
    'cottage-house.html', 'steel-house.html', 'tiny-house.html'
]

hash_to_models = defaultdict(list)
unsplash_count = 0

for cpage in category_pages:
    cpath = os.path.join(root_dir, cpage)
    if not os.path.exists(cpath):
        continue
    with open(cpath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    cards = card_pattern.findall(content)
    for src, mname in cards:
        mname = mname.strip()
        if 'unsplash.com' in src:
            unsplash_count += 1
        elif src.startswith('images/'):
            ipath = os.path.join(root_dir, src.replace('/', '\\'))
            if os.path.exists(ipath):
                with open(ipath, 'rb') as fp:
                    h = hashlib.md5(fp.read()).hexdigest()
                hash_to_models[h].append((mname, cpage))

duplicate_model_hashes = {h: mlist for h, mlist in hash_to_models.items() if len(set([m[0] for m in mlist])) > 1}

print(f"3. CATALOG MODEL DUPLICATE HASH AUDIT:")
print(f"   Unsplash external placeholder images: {unsplash_count}")
if not duplicate_model_hashes:
    print("   [OK] Clean! 0 duplicate model image hashes across catalog.\n")
else:
    print(f"   [FAIL] Found {len(duplicate_model_hashes)} duplicate model hashes:")
    for h, mlist in duplicate_model_hashes.items():
        print(f"      - Hash {h[:8]}: {set([m[0] for m in mlist])}")
    print()

# 4. SEO Essentials Audit (Title, Meta Description, Canonical)
missing_titles = []
missing_descs = []
missing_canonicals = []

for html_file in html_files:
    fname = os.path.basename(html_file)
    with open(html_file, 'r', encoding='utf-8', errors='ignore') as f:
        c = f.read()
    
    if '<title>' not in c.lower():
        missing_titles.append(fname)
    if 'name="description"' not in c.lower() and "name='description'" not in c.lower():
        missing_descs.append(fname)
    if 'rel="canonical"' not in c.lower() and "rel='canonical'" not in c.lower():
        missing_canonicals.append(fname)

print(f"4. SEO ESSENTIALS AUDIT:")
print(f"   Pages missing title tag: {len(missing_titles)}")
print(f"   Pages missing meta description: {len(missing_descs)}")
print(f"   Pages missing canonical link: {len(missing_canonicals)}")
if not missing_titles and not missing_descs and not missing_canonicals:
    print("   [OK] Clean! All pages have Title, Meta Description, and Canonical link.\n")
else:
    print("   [WARNING] Minor SEO tag gaps found.")
    if missing_titles:
        print(f"      Missing titles: {missing_titles}")
    if missing_descs:
        print(f"      Missing descriptions: {missing_descs}")
    if missing_canonicals:
        print(f"      Missing canonicals: {missing_canonicals}")
    print()
