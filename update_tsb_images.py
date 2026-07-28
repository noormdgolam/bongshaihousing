import os
import shutil
import re

dest_dir = r'e:\web\Bongshaihousing\images\products'

# 1. Update BH-TSB-103 with ai-two-story-front.png
src_103 = os.path.join(dest_dir, 'ai-two-story-front.png')
dest_103_png = os.path.join(dest_dir, 'bh-tsb-103.png')
dest_103_jpeg = os.path.join(dest_dir, 'Model No-BH-TB-103.jpeg')

if os.path.exists(src_103):
    shutil.copy(src_103, dest_103_png)
    shutil.copy(src_103, dest_103_jpeg)
    print('Updated BH-TSB-103 image assets.')

# 2. Update BH-TSB-106 with ai-two-story-awesome.png
src_106 = os.path.join(dest_dir, 'ai-two-story-awesome.png')
dest_106_png = os.path.join(dest_dir, 'bh-tsb-106.png')
dest_106_jfif = os.path.join(dest_dir, 'Model No-BH-TB-106.jfif')

if os.path.exists(src_106):
    shutil.copy(src_106, dest_106_png)
    shutil.copy(src_106, dest_106_jfif)
    print('Updated BH-TSB-106 image assets.')

# 3. Update bh-tsb-103.html
with open(r'e:\web\Bongshaihousing\bh-tsb-103.html', 'r', encoding='utf-8', errors='ignore') as f:
    c103 = f.read()

c103 = re.sub(
    r'<img alt="Model No-BH-TSB-103 Exterior View"[^>]+>',
    '<img alt="Model No-BH-TSB-103 Exterior View" loading="lazy" src="images/products/bh-tsb-103.png" style="width: 100%; object-fit: cover; display: block;" title="Model No-BH-TSB-103 Exterior View" width="1024" height="1024">',
    c103
)
with open(r'e:\web\Bongshaihousing\bh-tsb-103.html', 'w', encoding='utf-8') as f:
    f.write(c103)

# 4. Update bh-tsb-106.html
with open(r'e:\web\Bongshaihousing\bh-tsb-106.html', 'r', encoding='utf-8', errors='ignore') as f:
    c106 = f.read()

c106 = re.sub(
    r'<img alt="Model No-BH-TSB-106 Exterior View"[^>]+>',
    '<img alt="Model No-BH-TSB-106 Exterior View" loading="lazy" src="images/products/bh-tsb-106.png" style="width: 100%; object-fit: cover; display: block;" title="Model No-BH-TSB-106 Exterior View" width="1024" height="1024">',
    c106
)
with open(r'e:\web\Bongshaihousing\bh-tsb-106.html', 'w', encoding='utf-8') as f:
    f.write(c106)

# 5. Update two-story-building.html cards
with open(r'e:\web\Bongshaihousing\two-story-building.html', 'r', encoding='utf-8', errors='ignore') as f:
    c_tsb = f.read()

c_tsb = re.sub(
    r'<img alt="Bongshai Housing Model No-BH-TSB-103"[^>]+>',
    '<img alt="Bongshai Housing Model No-BH-TSB-103" loading="lazy" src="images/products/bh-tsb-103.png" title="Bongshai Housing Model No-BH-TSB-103" width="1024" height="1024">',
    c_tsb
)
c_tsb = re.sub(
    r'<img alt="Bongshai Housing Model No-BH-TSB-106"[^>]+>',
    '<img alt="Bongshai Housing Model No-BH-TSB-106" loading="lazy" src="images/products/bh-tsb-106.png" title="Bongshai Housing Model No-BH-TSB-106" width="1024" height="1024">',
    c_tsb
)

with open(r'e:\web\Bongshaihousing\two-story-building.html', 'w', encoding='utf-8') as f:
    f.write(c_tsb)

print('Updated two-story-building.html, bh-tsb-103.html, and bh-tsb-106.html.')
