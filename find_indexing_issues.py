import glob
import re
import os

html_files = glob.glob(r"e:\web\Bongshaihousing\*.html")
filenames = [os.path.basename(f) for f in html_files]

# 1. Check sitemap
with open(r"e:\web\Bongshaihousing\sitemap.xml", "r", encoding="utf-8") as f:
    sitemap = f.read()

sitemap_urls = re.findall(r'<loc>(.*?)</loc>', sitemap)
print("--- Sitemap Check ---")
for url in sitemap_urls:
    basename = url.split('/')[-1]
    if not basename:
        basename = 'index.html'
    if basename not in filenames:
        print(f"Missing file from sitemap: {basename} ({url})")

# 2. Check internal links
print("\n--- Internal Link Check ---")
broken_links = set()
for file_path in html_files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    links = re.findall(r'href=["\'](.*?)["\']', content)
    for link in links:
        if link.endswith('.html') and not link.startswith('http') and not link.startswith('mailto:') and not link.startswith('tel:'):
            basename = link.split('#')[0]
            if basename and basename not in filenames:
                broken_links.add(f"{os.path.basename(file_path)} -> {link}")

for bl in broken_links:
    print(f"Broken link: {bl}")

# 3. Check for noindex
print("\n--- Noindex Check ---")
for file_path in html_files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    if 'noindex' in content.lower():
        print(f"Found noindex in {os.path.basename(file_path)}")
