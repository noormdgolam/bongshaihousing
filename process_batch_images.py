import os
import glob
import shutil
import re

brain_dir = r'C:\Users\munna\.gemini\antigravity-ide\brain\7533b93a-ae87-424e-9325-5987e2ea630f'
dest_dir = r'e:\web\Bongshaihousing\images\products'

html_file = r'e:\web\Bongshaihousing\single-story-building.html'
with open(html_file, 'r', encoding='utf-8') as f:
    content = f.read()

# I will find all the generated images
images = glob.glob(os.path.join(brain_dir, 'bh_sb_*_b*.png'))

added_models = []

for img_path in images:
    # Extract the serial from filename e.g. bh_sb_302_b1_123.png -> 302
    filename = os.path.basename(img_path)
    match = re.search(r'bh_sb_(\d+)', filename)
    if match:
        serial = match.group(1)
        if serial == '301':
            continue # I already have 301
            
        new_name = f'bh-sb-{serial}.png'
        shutil.copy(img_path, os.path.join(dest_dir, new_name))
        added_models.append(serial)

added_models = sorted(list(set(added_models)))

# Generate HTML for new models
new_html = ''
for i, serial in enumerate(added_models, start=1):
    new_html += f'''
<div class="property-card reveal" style="--i:{i}">
<div class="property-img-wrap"><img alt="Bongshai Housing Model No-BH-SB-{serial}" loading="lazy" src="images/products/bh-sb-{serial}.png" title="Bongshai Housing Model No-BH-SB-{serial}" width="1024" height="1024"></div>
<div class="property-card-body">
<span class="property-type">Single Story Building</span>
<h3 class="property-name">Model No-BH-SB-{serial}</h3>
<p class="property-desc">A premium single story prefabricated building with a clean, modern view and an elegant walkway in front.</p>
<div class="property-specs">
<div class="spec-item"><span aria-hidden="true" class="spec-icon">???</span> 3 Bedrooms</div>
<div class="spec-item"><span aria-hidden="true" class="spec-icon">??</span> 2 Bathrooms</div>
<div class="spec-item"><span aria-hidden="true" class="spec-icon">??</span> Kitchen</div>
</div>
<a class="btn btn-primary" href="#" style="width:100%;justify-content:center;">View Details</a>
</div></div>
'''

# Find where to insert (before the closing tags of stagger)
# In single-story-building.html, I have:
# </div></div></div>
# <!-- OVERVIEW -->
# I will replace the last </div> before <!-- OVERVIEW --> with the new_html + </div>
pattern = re.compile(r'(</div></div>)(</div>\s*<!-- OVERVIEW -->)', re.DOTALL)
new_content = pattern.sub(r'\1' + new_html + r'\2', content)

with open(html_file, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Processed {len(added_models)} new models: {added_models}")
