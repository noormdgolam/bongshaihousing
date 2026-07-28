import os
import shutil
import re
from PIL import Image, ImageEnhance, ImageOps

products_dir = r'e:\web\Bongshaihousing\images\products'
base1 = os.path.join(products_dir, 'industrial_shed_1_1782293275650.png')
base2 = os.path.join(products_dir, 'industrial_shed_2_1782293288591.png')

print(f"Base 1 exists: {os.path.exists(base1)}")
print(f"Base 2 exists: {os.path.exists(base2)}")

def generate_warehouse_image(idx, num):
    src_path = base1 if (idx % 2 == 0) else base2
    dest_name = f'Model No-BH-IS-{num}.png'
    dest_path = os.path.join(products_dir, dest_name)
    
    img = Image.open(src_path).convert('RGB')
    
    # Mirror alternate models for structural layout diversity
    if idx >= 6:
        img = ImageOps.mirror(img)
        
    # Apply custom professional architectural warehouse color tuning
    color_factor = 1.0 + ((idx % 4) * 0.04)
    contrast_factor = 1.02 + ((idx % 3) * 0.03)
    bright_factor = 1.01 + ((idx % 2) * 0.02)
    
    enh_color = ImageEnhance.Color(img)
    img = enh_color.enhance(color_factor)
    
    enh_contrast = ImageEnhance.Contrast(img)
    img = enh_contrast.enhance(contrast_factor)
    
    enh_bright = ImageEnhance.Brightness(img)
    img = enh_bright.enhance(bright_factor)
    
    img.save(dest_path)
    print(f"Generated warehouse shed image for Model No-BH-IS-{num}")

for idx in range(12):
    num = 1001 + idx
    generate_warehouse_image(idx, num)

# Update industrial-sheds.html cards
with open(r'e:\web\Bongshaihousing\industrial-sheds.html', 'r', encoding='utf-8') as f:
    is_html = f.read()

for num in range(1001, 1013):
    img_src = f'images/products/Model No-BH-IS-{num}.png'
    is_html = re.sub(
        rf'<img alt="Bongshai Housing Model No-BH-IS-{num}" loading="lazy" src="[^"]+"',
        f'<img alt="Bongshai Housing Model No-BH-IS-{num}" loading="lazy" src="{img_src}"',
        is_html
    )

with open(r'e:\web\Bongshaihousing\industrial-sheds.html', 'w', encoding='utf-8') as f:
    f.write(is_html)

# Update detail pages bh-is-1001.html to bh-is-1012.html
for num in range(1001, 1013):
    detail_file = rf'e:\web\Bongshaihousing\bh-is-{num}.html'
    if os.path.exists(detail_file):
        with open(detail_file, 'r', encoding='utf-8', errors='ignore') as f:
            c = f.read()
        c = re.sub(
            rf'<img alt="Model No-BH-IS-{num} Exterior View"[^>]+>',
            f'<img alt="Model No-BH-IS-{num} Exterior View" loading="lazy" src="images/products/Model No-BH-IS-{num}.png" style="width: 100%; object-fit: cover; display: block;" title="Model No-BH-IS-{num} Exterior View" width="1024" height="1024">',
            c
        )
        with open(detail_file, 'w', encoding='utf-8') as f:
            f.write(c)

print("Updated industrial-sheds.html and all bh-is-10*.html detail pages.")
