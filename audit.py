import os
import re
import glob

def audit_site():
    print("--- SITE AUDIT START ---\n")
    html_files = glob.glob('*.html')
    print(f"Total HTML files found: {len(html_files)}")
    
    all_files = set(os.listdir('.'))
    
    broken_links = {}
    missing_images = {}
    
    link_pattern = re.compile(r'href="([^"#\?]+)(?:[#\?].*)?"')
    img_pattern = re.compile(r'src="([^"]+)"')
    
    for file in html_files:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        links = link_pattern.findall(content)
        for link in links:
            if link.startswith('http') or link.startswith('mailto:') or link.startswith('tel:'):
                continue
            if not os.path.exists(link):
                broken_links.setdefault(file, set()).add(link)
                
        images = img_pattern.findall(content)
        for img in images:
            if img.startswith('http') or img.startswith('data:'):
                continue
            if not os.path.exists(img):
                missing_images.setdefault(file, set()).add(img)
                
    if broken_links:
        print("\n--- BROKEN LINKS ---")
        for file, links in broken_links.items():
            print(f"{file}:")
            for link in links:
                print(f"  - {link}")
    else:
        print("\nNo broken links found!")
        
    if missing_images:
        print("\n--- MISSING IMAGES (Top 20) ---")
        count = 0
        for file, imgs in missing_images.items():
            if count > 20:
                print("  ... and more")
                break
            print(f"{file}:")
            for img in imgs:
                print(f"  - {img}")
            count += 1
    else:
        print("\nNo missing local images found!")

if __name__ == "__main__":
    audit_site()
