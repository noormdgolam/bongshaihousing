import os
import shutil
import re
from PIL import Image, ImageEnhance, ImageOps

products_dir = r'e:\web\Bongshaihousing\images\products'

def create_unique_variant(base_file, target_name, flip=False, color_factor=1.0, contrast_factor=1.0):
    src_path = os.path.join(products_dir, base_file)
    dest_path = os.path.join(products_dir, target_name)
    
    if not os.path.exists(src_path):
        print(f"Base file {base_file} missing!")
        return False
        
    img = Image.open(src_path).convert('RGB')
    if flip:
        img = ImageOps.mirror(img)
        
    if color_factor != 1.0:
        enhancer_color = ImageEnhance.Color(img)
        img = enhancer_color.enhance(color_factor)
        
    if contrast_factor != 1.0:
        enhancer_contrast = ImageEnhance.Contrast(img)
        img = enhancer_contrast.enhance(contrast_factor)
        
    img.save(dest_path)
    return True

categories = {
    'IS': ('industrial_shed_1_1782293275650.png', 'industrial_shed_2_1782293288591.png', 1001, 1012),
    'SK': ('security_kiosk_1_1782293365370.png', 'security_kiosk_2_1782293377452.png', 1301, 1312),
    'SO': ('site_office_1_1782293338638.png', 'site_office_2_1782293352132.png', 1201, 1212),
    'WA': ('worker_camp_1_1782293309610.png', 'worker_camp_2_1782293326181.png', 1101, 1112),
}

total_created = 0

for code, (base1, base2, start_num, end_num) in categories.items():
    for num in range(start_num, end_num + 1):
        idx = num - start_num
        base_file = base1 if (idx % 2 == 0) else base2
        flip_val = (idx >= 6)
        color_val = 1.0 + ((idx % 3) * 0.05)
        contrast_val = 1.0 + ((idx % 2) * 0.04)
        
        target_name = f'Model No-BH-{code}-{num}.png'
        if create_unique_variant(base_file, target_name, flip=flip_val, color_factor=color_val, contrast_factor=contrast_val):
            total_created += 1

print(f"Successfully created {total_created} unique product image files!")
