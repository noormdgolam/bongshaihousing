import os
import re
import glob

def find_image_issues():
    html_files = glob.glob('*.html')
    missing_images = {}
    placeholder_images = {}

    for file in html_files:
        with open(file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        imgs = re.findall(r'src=["\']([^"\']+)["\']', content)
        for img in imgs:
            if img.startswith('http') or img.startswith('data:'):
                continue
            # convert forward/backward slashes
            img_path = img.replace('/', os.sep)
            if not os.path.exists(img_path):
                missing_images.setdefault(file, set()).add(img)
            elif 'placeholder' in img.lower() or 'temp' in img.lower() or 'via.placeholder' in img.lower():
                placeholder_images.setdefault(file, set()).add(img)

    print("=== MISSING LOCAL IMAGES ===")
    if not missing_images:
        print("None found!")
    else:
        for f, imgs in missing_images.items():
            print(f"\n{f}:")
            for img in imgs:
                print(f"  - {img}")

    print("\n=== PLACEHOLDER IMAGES ===")
    if not placeholder_images:
        print("None found!")
    else:
        for f, imgs in placeholder_images.items():
            print(f"\n{f}:")
            for img in imgs:
                print(f"  - {img}")

if __name__ == "__main__":
    find_image_issues()
