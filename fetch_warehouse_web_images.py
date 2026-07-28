import urllib.request
import re
import os

urls = [
    'https://www.bongshaiengineering.com/warehouse/',
    'https://www.bongshaiengineering.com/pre-engineering-building/',
    'https://www.bongshaiengineering.com/executed-project/',
    'https://www.bongshaiengineering.com/potto-gallery/'
]

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

all_imgs = []

for url in urls:
    try:
        req = urllib.request.Request(url, headers=headers)
        html = urllib.request.urlopen(req, timeout=5).read().decode('utf-8', errors='ignore')
        matches = re.findall(r'src=["\'](https?://[^"\']+\.(?:jpg|png|jpeg|webp))["\']', html, re.IGNORECASE)
        lazy_matches = re.findall(r'data-(?:src|lazy-src)=["\'](https?://[^"\']+\.(?:jpg|png|jpeg|webp))["\']', html, re.IGNORECASE)
        for img in matches + lazy_matches:
            if not any(x in img.lower() for x in ['logo', 'icon', 'avatar', 'facebook', 'svg', 'banner-bg']):
                all_imgs.append(img)
    except Exception as e:
        print(f"Error fetching {url}: {e}")

all_imgs = sorted(list(set(all_imgs)))
print(f"Found {len(all_imgs)} unique product/project images on live sites:")
for img in all_imgs:
    print(img)

# Download these live warehouse/factory project images to images/products/
dest_dir = r'e:\web\Bongshaihousing\images\products'
downloaded = []

for i, img_url in enumerate(all_imgs, start=1):
    ext = os.path.splitext(img_url)[1]
    if not ext or len(ext) > 5:
        ext = '.jpg'
    target_filename = f'bongshai_warehouse_real_{i}{ext}'
    target_path = os.path.join(dest_dir, target_filename)
    try:
        req = urllib.request.Request(img_url, headers=headers)
        data = urllib.request.urlopen(req, timeout=8).read()
        with open(target_path, 'wb') as f:
            f.write(data)
        downloaded.append((target_filename, target_path))
        print(f"Downloaded: {img_url} -> {target_filename}")
    except Exception as e:
        print(f"Failed to download {img_url}: {e}")

print(f"Successfully downloaded {len(downloaded)} real project images!")
