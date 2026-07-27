import os
import glob
import re

def fix_image_references():
    html_files = glob.glob('*.html')
    print(f"Auditing image paths across {len(html_files)} HTML files...")

    # Build map of available files in images/products (lowercase filename -> actual relative path)
    prod_dir = os.path.join('images', 'products')
    available_files = {}
    if os.path.exists(prod_dir):
        for fname in os.listdir(prod_dir):
            available_files[fname.lower()] = os.path.join('images', 'products', fname).replace(os.sep, '/')

    fixed_files_count = 0
    missing_paths = {}

    for html_file in html_files:
        with open(html_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        updated_content = content
        # Find src="images/products/..."
        imgs = re.findall(r'src=["\'](images/products/[^"\']+)["\']', content)
        
        for img_src in set(imgs):
            # Check if file exists as-is
            real_path = img_src.replace('/', os.sep)
            if not os.path.exists(real_path):
                filename = os.path.basename(img_src)
                
                # Check alternative names: e.g. bh-dv-202.png -> dv-102.png or Model No-BH-DV-102.jpg
                matched_replacement = None
                
                # Try exact case-insensitive match first
                if filename.lower() in available_files:
                    matched_replacement = available_files[filename.lower()]
                else:
                    # Try matching serial number (e.g., 202, 102, etc.)
                    match_num = re.search(r'(\d+)', filename)
                    if match_num:
                        num = match_num.group(1)
                        # Look for file in available_files containing num
                        for avail_name, avail_path in available_files.items():
                            if num in avail_name:
                                matched_replacement = avail_path
                                break

                if matched_replacement:
                    updated_content = updated_content.replace(img_src, matched_replacement)
                else:
                    missing_paths.setdefault(html_file, []).append(img_src)

        if updated_content != content:
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            fixed_files_count += 1

    print(f"\nFixed image path references in {fixed_files_count} HTML files!")

    if missing_paths:
        print(f"\nRemaining unresolvable missing image references ({len(missing_paths)} pages):")
        for f, path_list in list(missing_paths.items())[:15]:
            print(f"  {f}: {path_list}")

if __name__ == "__main__":
    fix_image_references()
