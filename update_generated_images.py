import os
import shutil
import glob
import re

brain_dir = r'C:\Users\munna\.gemini\antigravity-ide\brain\90aa9df8-a491-434e-92ab-dc355b131725'
dest_dir = r'e:\web\Bongshaihousing\images\products'

# Map wooden house generated images (808 to 812)
wh_map = {
    '808': glob.glob(os.path.join(brain_dir, 'bh_wh_808_wooden_house*.png')),
    '809': glob.glob(os.path.join(brain_dir, 'bh_wh_809_wooden_house*.png')),
    '810': glob.glob(os.path.join(brain_dir, 'bh_wh_810_wooden_house*.png')),
    '811': glob.glob(os.path.join(brain_dir, 'bh_wh_811_wooden_house*.png')),
    '812': glob.glob(os.path.join(brain_dir, 'bh_wh_812_wooden_house*.png')),
}

for num, files in wh_map.items():
    if files:
        src = files[0]
        dest1 = os.path.join(dest_dir, f'Model No-BH-WH-{num}.png')
        dest2 = os.path.join(dest_dir, f'Model No-BH-WH-{num}.jpg')
        shutil.copy(src, dest1)
        shutil.copy(src, dest2)
        print(f'Copied Wooden House {num} -> {dest1}')

# Map concrete house generated images (901 to 908)
for i in range(901, 909):
    num = str(i)
    files = glob.glob(os.path.join(brain_dir, f'bh_cb_{num}_concrete_house*.png'))
    if files:
        src = files[0]
        dest1 = os.path.join(dest_dir, f'bh-cb-{num}.png')
        dest2 = os.path.join(dest_dir, f'Model No-BH-CB-{num}.png')
        dest3 = os.path.join(dest_dir, f'Model No-BH-CB-{num}.jpg')
        shutil.copy(src, dest1)
        shutil.copy(src, dest2)
        shutil.copy(src, dest3)
        print(f'Copied Concrete House {num} -> {dest1}')

# Update concrete-building.html cards for 901-908
with open(r'e:\web\Bongshaihousing\concrete-building.html', 'r', encoding='utf-8') as f:
    cb_html = f.read()

for i in range(901, 909):
    num = str(i)
    old_pattern = rf'<img alt="Bongshai Housing Model No-BH-CB-{num}" loading="lazy" src="https://images.unsplash.com/[^"]+"'
    new_src = f'<img alt="Bongshai Housing Model No-BH-CB-{num}" loading="lazy" src="images/products/bh-cb-{num}.png"'
    cb_html = re.sub(old_pattern, new_src, cb_html)

with open(r'e:\web\Bongshaihousing\concrete-building.html', 'w', encoding='utf-8') as f:
    f.write(cb_html)
print('Updated concrete-building.html cards.')
