import os
import glob
import re

def fix_kitchen_counts():
    th_files = glob.glob('bh-th-7*.html')
    for file in th_files:
        with open(file, 'r', encoding='utf-8', errors='ignore') as f:
            c = f.read()

        c = c.replace('2 Kitchens', '1 Kitchen')
        c = c.replace('>2 Kitchens<', '>1 Kitchen<')
        c = c.replace('id="spec-kitchen-', 'data-kitchen-fixed="true" id="spec-kitchen-')
        c = re.sub(r'id="spec-kitchen-\d+".*?>.*?Kitchens?</div>', lambda m: m.group(0).replace('2 Kitchens', '1 Kitchen'), c)

        with open(file, 'w', encoding='utf-8') as f:
            f.write(c)

    print("Kitchen count updated to 1 Kitchen across all Tiny House detail pages.")

if __name__ == "__main__":
    fix_kitchen_counts()
