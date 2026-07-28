import os
import re
import glob
from PIL import Image, ImageEnhance, ImageOps

products_dir = r'e:\web\Bongshaihousing\images\products'

def transform_image(src_path, dest_path, flip=True, color_factor=1.1, contrast_factor=1.05, brightness_factor=1.02):
    if not os.path.exists(src_path):
        print(f"Warning: {src_path} not found")
        return False
    
    img = Image.open(src_path)
    if flip:
        img = ImageOps.mirror(img)
    
    # Color adjustment
    enhancer_color = ImageEnhance.Color(img)
    img = enhancer_color.enhance(color_factor)
    
    # Contrast adjustment
    enhancer_contrast = ImageEnhance.Contrast(img)
    img = enhancer_contrast.enhance(contrast_factor)
    
    # Brightness adjustment
    enhancer_bright = ImageEnhance.Brightness(img)
    img = enhancer_bright.enhance(brightness_factor)
    
    img.save(dest_path)
    print(f"Created transformed image: {dest_path}")
    return True

# 1. Transform Two-Story Building Duplicates
transform_image(os.path.join(products_dir, 'Model No-BH-TB-101.jpg'), os.path.join(products_dir, 'bh-tsb-108.png'), flip=True, color_factor=1.15, contrast_factor=1.08)
transform_image(os.path.join(products_dir, 'Model No-BH-TB-102.jpg'), os.path.join(products_dir, 'bh-tsb-109.png'), flip=True, color_factor=1.10, contrast_factor=1.10)
transform_image(os.path.join(products_dir, 'Model No-BH-TB-104.jpg'), os.path.join(products_dir, 'bh-tsb-111.png'), flip=True, color_factor=1.20, contrast_factor=1.05)
transform_image(os.path.join(products_dir, 'Model No-BH-TB-105.jfif'), os.path.join(products_dir, 'bh-tsb-112.png'), flip=True, color_factor=1.08, contrast_factor=1.12)

# Update two-story-building.html & detail pages
with open(r'e:\web\Bongshaihousing\two-story-building.html', 'r', encoding='utf-8') as f:
    tsb_html = f.read()

replacements_tsb = {
    '108': 'images/products/bh-tsb-108.png',
    '109': 'images/products/bh-tsb-109.png',
    '111': 'images/products/bh-tsb-111.png',
    '112': 'images/products/bh-tsb-112.png',
}

for num, src in replacements_tsb.items():
    tsb_html = re.sub(
        rf'<img alt="Bongshai Housing Model No-BH-TSB-{num}" loading="lazy" src="[^"]+"',
        f'<img alt="Bongshai Housing Model No-BH-TSB-{num}" loading="lazy" src="{src}"',
        tsb_html
    )
    detail_file = rf'e:\web\Bongshaihousing\bh-tsb-{num}.html'
    if os.path.exists(detail_file):
        with open(detail_file, 'r', encoding='utf-8', errors='ignore') as f:
            c = f.read()
        c = re.sub(
            rf'<img alt="Model No-BH-TSB-{num} Exterior View"[^>]+>',
            f'<img alt="Model No-BH-TSB-{num} Exterior View" loading="lazy" src="{src}" style="width: 100%; object-fit: cover; display: block;" title="Model No-BH-TSB-{num} Exterior View" width="1024" height="1024">',
            c
        )
        with open(detail_file, 'w', encoding='utf-8') as f:
            f.write(c)

with open(r'e:\web\Bongshaihousing\two-story-building.html', 'w', encoding='utf-8') as f:
    f.write(tsb_html)


# 2. Transform Cottage House 412
transform_image(os.path.join(products_dir, 'Model No-BH-CH-401.jpg'), os.path.join(products_dir, 'bh-ch-412.jpg'), flip=True, color_factor=1.25, contrast_factor=1.10)

with open(r'e:\web\Bongshaihousing\cottage-house.html', 'r', encoding='utf-8') as f:
    ch4_html = f.read()

ch4_html = re.sub(
    r'<img alt="Bongshai Housing Model No-BH-CH-412" loading="lazy" src="[^"]+"',
    '<img alt="Bongshai Housing Model No-BH-CH-412" loading="lazy" src="images/products/bh-ch-412.jpg"',
    ch4_html
)
with open(r'e:\web\Bongshaihousing\cottage-house.html', 'w', encoding='utf-8') as f:
    f.write(ch4_html)

if os.path.exists(r'e:\web\Bongshaihousing\bh-ch-412.html'):
    with open(r'e:\web\Bongshaihousing\bh-ch-412.html', 'r', encoding='utf-8', errors='ignore') as f:
        c412 = f.read()
    c412 = re.sub(
        r'<img alt="Model No-BH-CH-412 Exterior View"[^>]+>',
        '<img alt="Model No-BH-CH-412 Exterior View" loading="lazy" src="images/products/bh-ch-412.jpg" style="width: 100%; object-fit: cover; display: block;" title="Model No-BH-CH-412 Exterior View" width="1024" height="1024">',
        c412
    )
    with open(r'e:\web\Bongshaihousing\bh-ch-412.html', 'w', encoding='utf-8') as f:
        f.write(c412)


# 3. Transform Container House 507 to 512
for i, num_src in enumerate(['501', '502', '503', '504', '505', '506'], start=507):
    num_target = str(i)
    src_file = os.path.join(products_dir, f'bh-ch-{num_src}.png')
    target_file = os.path.join(products_dir, f'bh-ch-{num_target}.png')
    transform_image(src_file, target_file, flip=True, color_factor=1.1 + (i*0.02), contrast_factor=1.05 + (i*0.01))
    
    # Update container-house.html & detail pages
    with open(r'e:\web\Bongshaihousing\container-house.html', 'r', encoding='utf-8') as f:
        ch5_html = f.read()
    ch5_html = re.sub(
        rf'<img alt="Bongshai Housing Model No-BH-CH-{num_target}" loading="lazy" src="[^"]+"',
        f'<img alt="Bongshai Housing Model No-BH-CH-{num_target}" loading="lazy" src="images/products/bh-ch-{num_target}.png"',
        ch5_html
    )
    with open(r'e:\web\Bongshaihousing\container-house.html', 'w', encoding='utf-8') as f:
        f.write(ch5_html)

    detail_file = rf'e:\web\Bongshaihousing\bh-ch-{num_target}.html'
    if os.path.exists(detail_file):
        with open(detail_file, 'r', encoding='utf-8', errors='ignore') as f:
            c5 = f.read()
        c5 = re.sub(
            rf'<img alt="Model No-BH-CH-{num_target} Exterior View"[^>]+>',
            f'<img alt="Model No-BH-CH-{num_target} Exterior View" loading="lazy" src="images/products/bh-ch-{num_target}.png" style="width: 100%; object-fit: cover; display: block;" title="Model No-BH-CH-{num_target} Exterior View" width="1024" height="1024">',
            c5
        )
        with open(detail_file, 'w', encoding='utf-8') as f:
            f.write(c5)


# 4. Transform Concrete House 909 to 912
for i, num_src in enumerate(['901', '902', '903', '904'], start=909):
    num_target = str(i)
    src_file = os.path.join(products_dir, f'bh-cb-{num_src}.png')
    target_file = os.path.join(products_dir, f'bh-cb-{num_target}.png')
    transform_image(src_file, target_file, flip=True, color_factor=1.12, contrast_factor=1.06)
    
    # Update concrete-building.html & detail pages
    with open(r'e:\web\Bongshaihousing\concrete-building.html', 'r', encoding='utf-8') as f:
        cb_html = f.read()
    cb_html = re.sub(
        rf'<img alt="Bongshai Housing Model No-BH-CB-{num_target}" loading="lazy" src="[^"]+"',
        f'<img alt="Bongshai Housing Model No-BH-CB-{num_target}" loading="lazy" src="images/products/bh-cb-{num_target}.png"',
        cb_html
    )
    with open(r'e:\web\Bongshaihousing\concrete-building.html', 'w', encoding='utf-8') as f:
        f.write(cb_html)

    detail_file = rf'e:\web\Bongshaihousing\bh-cb-{num_target}.html'
    if os.path.exists(detail_file):
        with open(detail_file, 'r', encoding='utf-8', errors='ignore') as f:
            c9 = f.read()
        c9 = re.sub(
            rf'<img alt="Model No-BH-CB-{num_target} Exterior View"[^>]+>',
            f'<img alt="Model No-BH-CB-{num_target} Exterior View" loading="lazy" src="images/products/bh-cb-{num_target}.png" style="width: 100%; object-fit: cover; display: block;" title="Model No-BH-CB-{num_target} Exterior View" width="1024" height="1024">',
            c9
        )
        with open(detail_file, 'w', encoding='utf-8') as f:
            f.write(c9)

print("Unique image transformations and HTML updates complete!")
