import os
import glob

files_to_fix = glob.glob('lcv-*.html') + ['low-cost-villa.html']

for file in files_to_fix:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace 'images/user-villa' with 'images/user-cottage'
    new_content = content.replace('images/user-villa', 'images/user-cottage')
    
    if new_content != content:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed images in {file}")
