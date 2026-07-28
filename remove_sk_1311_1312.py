import os
import re
import glob

root_dir = r'e:\web\Bongshaihousing'

# 1. Delete detail page files bh-sk-1311.html and bh-sk-1312.html
files_to_delete = [
    os.path.join(root_dir, 'bh-sk-1311.html'),
    os.path.join(root_dir, 'bh-sk-1312.html')
]

for fpath in files_to_delete:
    if os.path.exists(fpath):
        os.remove(fpath)
        print(f"Deleted file: {fpath}")

# 2. Remove property cards from security-kiosks.html
sk_html_file = os.path.join(root_dir, 'security-kiosks.html')
if os.path.exists(sk_html_file):
    with open(sk_html_file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # Pattern to match property-card blocks containing BH-SK-1311 or BH-SK-1312
    card_regex = re.compile(
        r'<div class="property-card[^"]*"[^>]*>.*?Model No-BH-SK-131[12].*?</div>\s*</div>',
        re.DOTALL
    )
    content_updated = card_regex.sub('', content)

    with open(sk_html_file, 'w', encoding='utf-8') as f:
        f.write(content_updated)
    print("Removed Model No-BH-SK-1311 and 1312 cards from security-kiosks.html")

# 3. Clean options from contact.html if present
contact_file = os.path.join(root_dir, 'contact.html')
if os.path.exists(contact_file):
    with open(contact_file, 'r', encoding='utf-8', errors='ignore') as f:
        c_content = f.read()
    
    c_content = re.sub(r'\s*<option value="BH-SK-1311">.*?</option>', '', c_content)
    c_content = re.sub(r'\s*<option value="BH-SK-1312">.*?</option>', '', c_content)

    with open(contact_file, 'w', encoding='utf-8') as f:
        f.write(c_content)
    print("Cleaned contact.html model options for SK-1311 and SK-1312.")

# 4. Clean sitemap.xml if present
sitemap_file = os.path.join(root_dir, 'sitemap.xml')
if os.path.exists(sitemap_file):
    with open(sitemap_file, 'r', encoding='utf-8', errors='ignore') as f:
        sm_content = f.read()
        
    sm_content = re.sub(r'\s*<url>\s*<loc>[^<]*bh-sk-131[12]\.html</loc>.*?</url>', '', sm_content, flags=re.DOTALL)
    
    with open(sitemap_file, 'w', encoding='utf-8') as f:
        f.write(sm_content)
    print("Cleaned sitemap.xml entries for SK-1311 and SK-1312.")

print("Removal of Model No-BH-SK-1311 and 1312 complete!")
