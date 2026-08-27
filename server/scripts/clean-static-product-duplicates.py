import os
import re

cleaned_count = 0

for filename in os.listdir('.'):
    if not filename.endswith('.html'):
        continue
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # Look for old 2. Horizontal Quick-Specs Bar or 3. Room Sizes Table
    has_specs_bar = '<!-- 2. Horizontal Quick-Specs Bar -->' in content or '<!-- 3. Room Sizes Table -->' in content
    if not has_specs_bar:
        continue
    
    # Remove from '<!-- 2. Horizontal Quick-Specs Bar -->' up to '<!-- 4. Materials & Finishes' or 'Building Specifications'
    # Pattern to find start of old multi-tier section
    start_pos = content.find('<!-- 2. Horizontal Quick-Specs Bar -->')
    if start_pos == -1:
        start_pos = content.find('<!-- 3. Room Sizes Table -->')
        
    if start_pos != -1:
        # Find where Building Specifications starts
        end_pos = content.find('Building Specifications', start_pos)
        if end_pos != -1:
            # Find the opening <div class="reveal-up" for Building Specifications
            div_start = content.rfind('<div class="reveal-up"', start_pos, end_pos)
            if div_start != -1:
                content = content[:start_pos] + content[div_start:]
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(content)
                cleaned_count += 1

print(f'Cleaned duplicate multi-tier room tables from {cleaned_count} static product HTML files!')
