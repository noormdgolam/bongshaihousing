import os
import glob
import re

def update_tiny_houses():
    # 1. Update tiny-house.html main page
    tiny_main = 'tiny-house.html'
    if os.path.exists(tiny_main):
        with open(tiny_main, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        # Update spec items in property-card
        # Replace 3 Bedrooms / 2 Bathrooms with 1 Bedroom / Area 350 - 440 Sq.Ft
        # Pattern to replace property-specs in tiny-house.html
        new_specs = '''<div class="property-specs">
<div class="spec-item"><span aria-hidden="true" class="spec-icon">🛏️</span> 1 Bedroom</div>
<div class="spec-item"><span aria-hidden="true" class="spec-icon">🚿</span> 1 Bathroom</div>
<div class="spec-item"><span aria-hidden="true" class="spec-icon">📐</span> 350 / 440 Sq.Ft</div>
</div>'''
        
        content_updated = re.sub(
            r'<div class="property-specs">.*?</div>\s*</div>',
            new_specs + '\n</div>',
            content,
            flags=re.DOTALL
        )
        
        with open(tiny_main, 'w', encoding='utf-8') as f:
            f.write(content_updated)
        print("Updated tiny-house.html specs.")

    # 2. Update individual bh-th-7*.html files
    th_files = glob.glob('bh-th-7*.html')
    print(f"Updating {len(th_files)} tiny house detail pages...")

    for file in th_files:
        model_num = file.replace('bh-th-', '').replace('.html', '')
        with open(file, 'r', encoding='utf-8', errors='ignore') as f:
            c = f.read()

        # Replace area buttons HTML
        old_area_selector = f'id="area-selector-{model_num}">.*?</div>'
        new_area_selector = f'''id="area-selector-{model_num}">
<button type="button" class="area-btn active" onclick="selectArea('{model_num}', '350', this)">350 Sq.Ft</button>
<button type="button" class="area-btn " onclick="selectArea('{model_num}', '440', this)">440 Sq.Ft</button>
</div>'''
        c = re.sub(old_area_selector, new_area_selector, c, flags=re.DOTALL)

        # Replace floorData object in JS
        old_js = f'const floorData{model_num} = {{.*?}};'
        new_js = f'''const floorData{model_num} = {{
      "350": {{ bed: "1 Bedroom", bath: "1 Bathroom", dining: "Included", drawing: "Combined" }},
      "440": {{ bed: "1 Bedroom", bath: "1 Bathroom", dining: "Included", drawing: "Spacious Living" }}
    }};'''
        c = re.sub(old_js, new_js, c, flags=re.DOTALL)

        # Replace default bedroom display in Quick Specs
        c = re.sub(r'id="spec-bed-\d+".*?>.*?Rooms</div>', f'id="spec-bed-{model_num}" style="font-weight: 700; color: var(--grey-900); font-size: 1.05rem;">1 Bedroom</div>', c)
        c = re.sub(r'id="spec-bath-\d+".*?>.*?Rooms</div>', f'id="spec-bath-{model_num}" style="font-weight: 700; color: var(--grey-900); font-size: 1.05rem;">1 Bathroom</div>', c)

        with open(file, 'w', encoding='utf-8') as f:
            f.write(c)

    print("All tiny house pages updated successfully.")

if __name__ == "__main__":
    update_tiny_houses()
