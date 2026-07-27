import os
import glob
import re

def update_wooden_houses():
    # 1. Update wooden-house.html main page
    wooden_main = 'wooden-house.html'
    if os.path.exists(wooden_main):
        with open(wooden_main, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

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
        
        with open(wooden_main, 'w', encoding='utf-8') as f:
            f.write(content_updated)
        print("Updated wooden-house.html specs.")

    # 2. Update individual bh-wh-8*.html files
    wh_files = glob.glob('bh-wh-8*.html')
    print(f"Updating {len(wh_files)} wooden house detail pages...")

    for file in wh_files:
        model_num = file.replace('bh-wh-', '').replace('.html', '')
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

        # Replace Quick Specs Bar values
        c = re.sub(r'id="spec-bed-\d+".*?>.*?</div>', f'id="spec-bed-{model_num}" style="font-weight: 700; color: var(--grey-900); font-size: 1.05rem;">1 Bedroom</div>', c)
        c = re.sub(r'id="spec-bath-\d+".*?>.*?</div>', f'id="spec-bath-{model_num}" style="font-weight: 700; color: var(--grey-900); font-size: 1.05rem;">1 Bathroom</div>', c)
        c = re.sub(r'id="spec-kitchen-\d+".*?>.*?</div>', f'id="spec-kitchen-{model_num}" style="font-weight: 700; color: var(--grey-900); font-size: 1.05rem;">1 Kitchen</div>', c)

        # Clean up any leftover 2 Kitchens in HTML text
        c = c.replace('2 Kitchens', '1 Kitchen')

        with open(file, 'w', encoding='utf-8') as f:
            f.write(c)

    print("All wooden house pages updated successfully.")

if __name__ == "__main__":
    update_wooden_houses()
