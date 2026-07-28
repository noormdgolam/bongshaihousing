import os
import re
from PIL import Image, ImageEnhance, ImageOps

products_dir = r'e:\web\Bongshaihousing\images\products'
src = os.path.join(products_dir, 'ai-duplex-awesome.png')
dest = os.path.join(products_dir, 'bh-tsb-110.png')

img = Image.open(src)
img = ImageOps.mirror(img)
enhancer_color = ImageEnhance.Color(img)
img = enhancer_color.enhance(1.18)
img.save(dest)

# Update two-story-building.html
with open(r'e:\web\Bongshaihousing\two-story-building.html', 'r', encoding='utf-8') as f:
    tsb_html = f.read()

tsb_html = re.sub(
    r'<img alt="Bongshai Housing Model No-BH-TSB-110" loading="lazy" src="[^"]+"',
    '<img alt="Bongshai Housing Model No-BH-TSB-110" loading="lazy" src="images/products/bh-tsb-110.png"',
    tsb_html
)

with open(r'e:\web\Bongshaihousing\two-story-building.html', 'w', encoding='utf-8') as f:
    f.write(tsb_html)

# Update bh-tsb-110.html
if os.path.exists(r'e:\web\Bongshaihousing\bh-tsb-110.html'):
    with open(r'e:\web\Bongshaihousing\bh-tsb-110.html', 'r', encoding='utf-8', errors='ignore') as f:
        c110 = f.read()
    c110 = re.sub(
        r'<img alt="Model No-BH-TSB-110 Exterior View"[^>]+>',
        '<img alt="Model No-BH-TSB-110 Exterior View" loading="lazy" src="images/products/bh-tsb-110.png" style="width: 100%; object-fit: cover; display: block;" title="Model No-BH-TSB-110 Exterior View" width="1024" height="1024">',
        c110
    )
    with open(r'e:\web\Bongshaihousing\bh-tsb-110.html', 'w', encoding='utf-8') as f:
        f.write(c110)

print("Updated TSB-110 uniquely!")
