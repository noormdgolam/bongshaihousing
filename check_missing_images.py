import os
import glob
import re
from urllib.parse import unquote

root_dir = r'e:\web\Bongshaihousing'
html_files = glob.glob(os.path.join(root_dir, '*.html'))
img_pattern = re.compile(r'<img [^>]*src=["\']([^"\']+)["\']', re.IGNORECASE)

missing_by_prefix = {}

for html_file in html_files:
    fname = os.path.basename(html_file)
    with open(html_file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    imgs = img_pattern.findall(content)
    for img_src in imgs:
        if img_src.startswith('http://') or img_src.startswith('https://') or img_src.startswith('//'):
            continue
        clean_src = unquote(img_src.split('?')[0].split('#')[0])
        local_path = os.path.join(root_dir, clean_src.replace('/', '\\'))
        if not os.path.exists(local_path):
            prefix = fname.split('-')[1] if '-' in fname else fname
            missing_by_prefix.setdefault(prefix, []).append((fname, clean_src))

print(f"Total missing image references: {sum(len(v) for v in missing_by_prefix.values())}")
for prefix, items in sorted(missing_by_prefix.items()):
    print(f"Category prefix '{prefix}': {len(items)} missing image links (e.g. {items[0][0]} -> {items[0][1]})")
