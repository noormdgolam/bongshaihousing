import os
import shutil
import glob
import re

brain_dir = r'C:\Users\munna\.gemini\antigravity-ide\brain\90aa9df8-a491-434e-92ab-dc355b131725'
dest_dir = r'e:\web\Bongshaihousing\images\products'

print("Copying 12 newly generated Nano Banana AI warehouse renders...")

for idx in range(1, 13):
    num = 1000 + idx
    pattern = os.path.join(brain_dir, f'bh_is_{num}_industrial_shed*.png')
    matches = glob.glob(pattern)
    if matches:
        src = matches[0]
        dest = os.path.join(dest_dir, f'Model No-BH-IS-{num}.png')
        shutil.copy(src, dest)
        print(f"[{num}] Copied AI image {os.path.basename(src)} -> Model No-BH-IS-{num}.png")

# Update industrial-sheds.html
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

print("Applied all 12 Nano Banana AI renders to industrial-sheds.html and bh-is-10*.html detail pages!")
