import glob
import re
import os
import hashlib
from collections import defaultdict

html_files = glob.glob('*.html')
card_pattern = re.compile(
    r'<div class="property-card[^"]*"[^>]*>.*?<img [^>]*src=["\']([^"\']+)["\'][^>]*>.*?<h3 class="property-name">([^<]+)</h3>',
    re.DOTALL
)

model_images = {}
image_to_models = defaultdict(list)
hash_to_models = defaultdict(list)

for file in sorted(html_files):
    if file.startswith('bh-'):
        continue  # Check category listing pages first
    with open(file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    matches = card_pattern.findall(content)
    for src, model_name in matches:
        model_name = model_name.strip()
        model_images[model_name] = src
        image_to_models[src].append((file, model_name))
        
        # Calculate file hash if local image
        if src.startswith('images/'):
            full_path = os.path.join(r'e:\web\Bongshaihousing', src.replace('/', '\\'))
            if os.path.exists(full_path):
                with open(full_path, 'rb') as fp:
                    h = hashlib.md5(fp.read()).hexdigest()
                hash_to_models[h].append((model_name, src, file))

print('=== 1. Models sharing the exact SAME image URL path ===')
shared_urls = {src: models for src, models in image_to_models.items() if len(models) > 1}
if not shared_urls:
    print('None found!')
else:
    for src, models in shared_urls.items():
        print(f'URL: {src}')
        for page, mname in models:
            print(f'  - [{page}] {mname}')
        print()

print('=== 2. Models sharing identical image content (MD5 Hash) ===')
shared_hashes = {h: models for h, models in hash_to_models.items() if len(set([m[0] for m in models])) > 1}
if not shared_hashes:
    print('None found!')
else:
    for h, models in shared_hashes.items():
        unique_models = list(set([m[0] for m in models]))
        print(f'Hash {h[:8]}: Models sharing image content -> {unique_models}')
        for mname, src, page in models:
            print(f'  - [{page}] {mname} -> {src}')
        print()
