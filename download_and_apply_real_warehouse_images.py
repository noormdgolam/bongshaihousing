import os
import urllib.request
import re

products_dir = r'e:\web\Bongshaihousing\images\products'

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

real_urls = [
    'https://www.bongshaiengineering.com/wp-content/uploads/2022/11/GHATAIL-CANTONMENT4.jpg',
    'https://www.bongshaiengineering.com/wp-content/uploads/2022/11/SAIDPUR-CANTONMENT1.jpg',
    'https://www.bongshaiengineering.com/wp-content/uploads/2022/11/SAIDPUR-CANTONMENT2.jpg',
    'https://www.bongshaiengineering.com/wp-content/uploads/2022/11/SAIDPUR-CANTONMENT3.jpg',
    'https://www.bongshaiengineering.com/wp-content/uploads/2022/11/SAIDPUR-CANTONMENT4.jpg',
    'https://www.bongshaiengineering.com/wp-content/uploads/2022/11/RANGPUR-CANTONMENT1.jpg',
    'https://www.bongshaiengineering.com/wp-content/uploads/2022/11/RANGPUR-CANTONMENT2.jpg',
    'https://www.bongshaiengineering.com/wp-content/uploads/2022/11/RANGPUR-CANTONMENT3.jpg',
    'https://www.bongshaiengineering.com/wp-content/uploads/2022/11/RANGPUR-CANTONMENT4.jpg',
    'https://www.bongshaiengineering.com/wp-content/uploads/2022/11/EXERIOR-PLASTISOL-STEEL-1-COLOUR-570x400.jpg',
    'https://www.bongshaiengineering.com/wp-content/uploads/2022/11/empty-steel-structure-workshop-interior-abandoned-factory-buildings-warehouse-background_631068-795-1-570x400.jpg',
    'https://bongshaisteel.com/wp-content/uploads/elementor/thumbs/Factory-building-r8icb528xftdrqn3lagsa1mjefjrqn7ne6sibhq9iw.jpg'
]

print(f"Downloading {len(real_urls)} real project warehouse images from bongshaiengineering.com...")

for idx, url in enumerate(real_urls):
    num = 1001 + idx
    dest_path = os.path.join(products_dir, f'Model No-BH-IS-{num}.png')
    try:
        req = urllib.request.Request(url, headers=headers)
        data = urllib.request.urlopen(req, timeout=10).read()
        with open(dest_path, 'wb') as f:
            f.write(data)
        print(f"[{num}] Downloaded {url} -> Model No-BH-IS-{num}.png ({len(data)} bytes)")
    except Exception as e:
        print(f"Error downloading {url}: {e}")

# Update industrial-sheds.html and detail pages
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

print("Applied all real Bongshai Engineering warehouse images to industrial-sheds.html and bh-is-10*.html pages!")
