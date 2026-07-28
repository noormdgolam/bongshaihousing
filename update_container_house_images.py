import os
import shutil
import glob
import re

brain_dir = r'C:\Users\munna\.gemini\antigravity-ide\brain\90aa9df8-a491-434e-92ab-dc355b131725'
dest_dir = r'e:\web\Bongshaihousing\images\products'

# Map container house generated images (501 to 506)
ch_map = {}
for i in range(501, 507):
    num = str(i)
    files = glob.glob(os.path.join(brain_dir, f'bh_ch_{num}_container_house*.png'))
    if files:
        src = files[0]
        dest1 = os.path.join(dest_dir, f'bh-ch-{num}.png')
        dest2 = os.path.join(dest_dir, f'Model No-BH-CH-{num}.png')
        dest3 = os.path.join(dest_dir, f'Model No-BH-CH-{num}.jpg')
        shutil.copy(src, dest1)
        shutil.copy(src, dest2)
        shutil.copy(src, dest3)
        ch_map[num] = f'images/products/bh-ch-{num}.png'
        print(f'Copied Container House {num} -> {dest1}')

# Update container-house.html cards for 501 to 512
with open(r'e:\web\Bongshaihousing\container-house.html', 'r', encoding='utf-8') as f:
    ch_html = f.read()

for i in range(501, 513):
    num = str(i)
    # Use mapped image or cycle through 501-506 images for 507-512
    if num in ch_map:
        img_src = ch_map[num]
    else:
        cycle_num = str(501 + ((i - 501) % 6))
        img_src = ch_map[cycle_num]
    
    old_pattern = rf'<img alt="Bongshai Housing Model No-BH-CH-{num}" loading="lazy" src="https://images.unsplash.com/[^"]+"'
    new_src = f'<img alt="Bongshai Housing Model No-BH-CH-{num}" loading="lazy" src="{img_src}"'
    ch_html = re.sub(old_pattern, new_src, ch_html)

with open(r'e:\web\Bongshaihousing\container-house.html', 'w', encoding='utf-8') as f:
    f.write(ch_html)
print('Updated container-house.html cards.')

# Update individual detail pages bh-ch-501.html to bh-ch-512.html
for i in range(501, 513):
    num = str(i)
    detail_file = rf'e:\web\Bongshaihousing\bh-ch-{num}.html'
    if os.path.exists(detail_file):
        with open(detail_file, 'r', encoding='utf-8', errors='ignore') as f:
            c = f.read()
        
        if num in ch_map:
            img_src = ch_map[num]
        else:
            cycle_num = str(501 + ((i - 501) % 6))
            img_src = ch_map[cycle_num]
            
        c = re.sub(
            rf'<img alt="Model No-BH-CH-{num} Exterior View"[^>]+>',
            f'<img alt="Model No-BH-CH-{num} Exterior View" loading="lazy" src="{img_src}" style="width: 100%; object-fit: cover; display: block;" title="Model No-BH-CH-{num} Exterior View" width="1024" height="1024">',
            c
        )
        with open(detail_file, 'w', encoding='utf-8') as f:
            f.write(c)
print('Updated all bh-ch-5*.html detail pages.')
