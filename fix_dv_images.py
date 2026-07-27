import os
import glob
import re

def fix_dv_detail_pages():
    # Duplex Villa detail pages map: bh-dv-201 -> dv-101.png, bh-dv-202 -> dv-102.png, ... bh-dv-213 -> dv-113.png
    dv_files = glob.glob('bh-dv-2*.html')
    print(f"Fixing image sources in {len(dv_files)} Duplex Villa detail pages...")

    for file in dv_files:
        model_num = file.replace('bh-dv-2', '').replace('.html', '') # e.g. 01, 02... 12
        if len(model_num) == 2:
            dv_img = f"images/products/dv-1{model_num}.png"
            if os.path.exists(dv_img.replace('/', os.sep)):
                with open(file, 'r', encoding='utf-8', errors='ignore') as f:
                    c = f.read()
                
                # Replace src="images/products/bh-dv-202.png" or similar with dv-102.png
                c = re.sub(r'src=["\']images/products/bh-dv-2\d+\.png["\']', f'src="{dv_img}"', c)
                
                with open(file, 'w', encoding='utf-8') as f:
                    f.write(c)

    print("Duplex Villa detail pages image sources fixed!")

if __name__ == "__main__":
    fix_dv_detail_pages()
