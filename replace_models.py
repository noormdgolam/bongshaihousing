import re

with open('single-story-building.html', 'r', encoding='utf-8') as f:
    content = f.read()

new_models = '''<div class="property-card reveal" style="--i:0">
<div class="property-img-wrap"><img alt="Bongshai Housing Model No-BH-SB-301" loading="lazy" src="images/products/bh-sb-301.png" title="Bongshai Housing Model No-BH-SB-301" width="1024" height="1024"></div>
<div class="property-card-body">
<span class="property-type">Single Story Building</span>
<h3 class="property-name">Model No-BH-SB-301</h3>
<p class="property-desc">A premium single story prefabricated building with a clean, modern view and an elegant walkway in front.</p>
<div class="property-specs">
<div class="spec-item"><span aria-hidden="true" class="spec-icon">???</span> 3 Bedrooms</div>
<div class="spec-item"><span aria-hidden="true" class="spec-icon">??</span> 2 Bathrooms</div>
<div class="spec-item"><span aria-hidden="true" class="spec-icon">??</span> Kitchen</div>
</div>
<a class="btn btn-primary" href="#" style="width:100%;justify-content:center;">View Details</a>
</div></div></div>
<!-- OVERVIEW -->'''

# Replace from <div class="stagger" ...> to <!-- OVERVIEW -->
pattern = re.compile(r'(<div class="stagger"[^>]*>).*?(<!-- OVERVIEW -->)', re.DOTALL)

replacement = r'\1\n' + new_models

new_content = pattern.sub(replacement, content)

with open('single-story-building.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Replaced successfully")
