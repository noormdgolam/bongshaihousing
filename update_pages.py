import os
import glob
import re

dir_path = r"e:\web\Bongshaihousing"

# 1. Update Navigation in all HTML files
html_files = glob.glob(os.path.join(dir_path, "*.html"))

nav_desktop_find = """<a class="dropdown-item" href="low-cost-villa.html" role="menuitem" style="padding:var(--space-2) var(--space-3);">
<div class="dropdown-icon" style="font-size:1.2rem;">🏡</div>
<div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Low-Cost Villa</strong></div>
</a>"""
nav_desktop_replace = nav_desktop_find + """\n<a class="dropdown-item" href="duplex-villa.html" role="menuitem" style="padding:var(--space-2) var(--space-3);">
<div class="dropdown-icon" style="font-size:1.2rem;">🏘️</div>
<div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Duplex Villa</strong></div>
</a>"""

nav_mobile_find = """<a class="mobile-sub-link" href="low-cost-villa.html">🏡 Low-Cost Villa</a>"""
nav_mobile_replace = nav_mobile_find + """\n<a class="mobile-sub-link" href="duplex-villa.html">🏘️ Duplex Villa</a>"""

sidebar_find_active = """<a class="cat-item active" href="low-cost-villa.html">Low-Cost Villa<svg class="cat-chevron" fill="none" stroke="currentColor" stroke-width="2.5" viewbox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></a>"""
sidebar_replace_active = sidebar_find_active + """\n<a class="cat-item" href="duplex-villa.html">Duplex Villa<svg class="cat-chevron" fill="none" stroke="currentColor" stroke-width="2.5" viewbox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></a>"""

sidebar_find = """<a class="cat-item" href="low-cost-villa.html">Low-Cost Villa<svg class="cat-chevron" fill="none" stroke="currentColor" stroke-width="2.5" viewbox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></a>"""
sidebar_replace = sidebar_find + """\n<a class="cat-item" href="duplex-villa.html">Duplex Villa<svg class="cat-chevron" fill="none" stroke="currentColor" stroke-width="2.5" viewbox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></a>"""

footer_find = """<a class="footer-link" href="low-cost-villa.html">Low-Cost Villa</a>"""
footer_replace = footer_find + """\n<a class="footer-link" href="duplex-villa.html">Duplex Villa</a>"""

for file_path in html_files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    if "Duplex Villa" not in content or "duplex-villa.html" not in content:
        content = content.replace(nav_desktop_find, nav_desktop_replace)
        content = content.replace(nav_mobile_find, nav_mobile_replace)
        content = content.replace(sidebar_find_active, sidebar_replace_active)
        content = content.replace(sidebar_find, sidebar_replace)
        content = content.replace(footer_find, footer_replace)

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)

# 2. Create duplex-villa.html based on low-cost-villa.html
with open(os.path.join(dir_path, "low-cost-villa.html"), "r", encoding="utf-8") as f:
    dv_content = f.read()

dv_content = dv_content.replace("<title>Low-Cost Villa |", "<title>Duplex Villa |")
dv_content = dv_content.replace('content="Low-Cost Steel Prefab Villa |', 'content="Duplex Villa |')
dv_content = dv_content.replace('name="twitter:title" content="Low-Cost Steel Prefab Villa', 'name="twitter:title" content="Duplex Villa')
dv_content = dv_content.replace('id="villa-page-title">Low-Cost Villa</h1>', 'id="villa-page-title">Duplex Villa</h1>')
dv_content = dv_content.replace('href="low-cost-villa.html">Low-Cost Villa</span>', 'href="duplex-villa.html">Duplex Villa</span>')
dv_content = dv_content.replace('>Low Cost Villa</span>', '>Duplex Villa</span>')
dv_content = dv_content.replace('href="low-cost-villa.html">Products</a>\n<span aria-hidden="true">/</span>\n<span aria-current="page">Low-Cost Villa</span>', 'href="duplex-villa.html">Products</a>\n<span aria-hidden="true">/</span>\n<span aria-current="page">Duplex Villa</span>')
dv_content = dv_content.replace('href="low-cost-villa.html">Products</a> <span aria-hidden="true">/</span> <span aria-current="page">Low-Cost Villa</span>', 'href="duplex-villa.html">Products</a> <span aria-hidden="true">/</span> <span aria-current="page">Duplex Villa</span>')

# Update sidebar active state in duplex-villa.html
dv_content = dv_content.replace('<a class="cat-item active" href="low-cost-villa.html">', '<a class="cat-item" href="low-cost-villa.html">')
dv_content = dv_content.replace('<a class="cat-item" href="duplex-villa.html">Duplex Villa<svg', '<a class="cat-item active" href="duplex-villa.html">Duplex Villa<svg')

# Remove existing grid items (lcv-101 to lcv-109)
# Use a regex that replaces the grid container content
grid_pattern = re.compile(r'<div class="properties-grid stagger">.*?(?=</div>\s*</div></div></div>\s*<!-- OVERVIEW -->)', re.DOTALL)
new_grid = '<div class="properties-grid stagger">\n'
for i in range(1, 14):
    num = f"{100+i}"
    new_grid += f"""<div class="property-card reveal" style="--i:{i-1}">
<div class="property-img-wrap"><img alt="Bongshai Housing Model DV-{num}" loading="lazy" src="images/products/dv-{num}.png"/></div>
<div class="property-card-body">
<span class="property-type">Duplex Villa</span>
<h3 class="property-name">Model DV-{num}</h3>
<p class="property-desc">Premium duplex living with exceptional design and beautifully landscaped surroundings.</p>
<div class="property-specs">
<div class="spec-item"><span aria-hidden="true" class="spec-icon">🛏️</span> 3 Bedrooms</div>
<div class="spec-item"><span aria-hidden="true" class="spec-icon">🚿</span> 2 Bathrooms</div>
<div class="spec-item"><span aria-hidden="true" class="spec-icon">🍳</span> Kitchen</div>
</div>
<a class="btn btn-primary" href="dv-{num}.html" style="width:100%;justify-content:center;">View Details</a>
</div>
</div>\n"""

# Re-read from disk just in case the navigation update modified it
with open(os.path.join(dir_path, "low-cost-villa.html"), "r", encoding="utf-8") as f:
    dv_content = f.read()

# Apply the same text replacements again
dv_content = dv_content.replace("<title>Low-Cost Villa |", "<title>Duplex Villa |")
dv_content = dv_content.replace('content="Low-Cost Steel Prefab Villa |', 'content="Duplex Villa |')
dv_content = dv_content.replace('name="twitter:title" content="Low-Cost Steel Prefab Villa', 'name="twitter:title" content="Duplex Villa')
dv_content = dv_content.replace('id="villa-page-title">Low-Cost Villa</h1>', 'id="villa-page-title">Duplex Villa</h1>')
dv_content = dv_content.replace('href="low-cost-villa.html">Low-Cost Villa</span>', 'href="duplex-villa.html">Duplex Villa</span>')
dv_content = dv_content.replace('>Low Cost Villa</span>', '>Duplex Villa</span>')
dv_content = dv_content.replace('href="low-cost-villa.html">Products</a>\n<span aria-hidden="true">/</span>\n<span aria-current="page">Low-Cost Villa</span>', 'href="duplex-villa.html">Products</a>\n<span aria-hidden="true">/</span>\n<span aria-current="page">Duplex Villa</span>')
dv_content = dv_content.replace('href="low-cost-villa.html">Products</a> <span aria-hidden="true">/</span> <span aria-current="page">Low-Cost Villa</span>', 'href="duplex-villa.html">Products</a> <span aria-hidden="true">/</span> <span aria-current="page">Duplex Villa</span>')

dv_content = dv_content.replace('<a class="cat-item active" href="low-cost-villa.html">', '<a class="cat-item" href="low-cost-villa.html">')
dv_content = dv_content.replace('<a class="cat-item" href="duplex-villa.html">Duplex Villa<svg', '<a class="cat-item active" href="duplex-villa.html">Duplex Villa<svg')

# Substitute grid
dv_content = grid_pattern.sub(new_grid, dv_content)

with open(os.path.join(dir_path, "duplex-villa.html"), "w", encoding="utf-8") as f:
    f.write(dv_content)


# 3. Create dv-101.html to dv-113.html based on lcv-101.html
with open(os.path.join(dir_path, "lcv-101.html"), "r", encoding="utf-8") as f:
    lcv_template = f.read()

# Make it a generic template
lcv_template = lcv_template.replace('<title>Low-Cost Villa |', '<title>Duplex Villa |')
lcv_template = lcv_template.replace('Low-Cost Villa', 'Duplex Villa')
# Breadcrumb
lcv_template = lcv_template.replace('href="low-cost-villa.html">Products</a> <span aria-hidden="true">/</span> <span aria-current="page">Model LCV-101</span>', 'href="duplex-villa.html">Products</a> <span aria-hidden="true">/</span> <span aria-current="page">Model LCV-101</span>')

for i in range(1, 14):
    num = f"{100+i}"
    dv_item = lcv_template
    
    # Replace LCV-101 with DV-XXX
    dv_item = dv_item.replace('LCV-101', f'DV-{num}')
    dv_item = dv_item.replace('lcv-101', f'dv-{num}')
    
    # Replace image
    dv_item = dv_item.replace(f'dv-{num}.jpg', f'dv-{num}.png')
    
    # Fix sidebar active states
    dv_item = dv_item.replace('<a class="cat-item active" href="duplex-villa.html">', '<a class="cat-item" href="duplex-villa.html">')
    dv_item = dv_item.replace('<a class="cat-item" href="duplex-villa.html">Duplex Villa<svg', '<a class="cat-item active" href="duplex-villa.html">Duplex Villa<svg')

    with open(os.path.join(dir_path, f"dv-{num}.html"), "w", encoding="utf-8") as f:
        f.write(dv_item)

print("Finished generating pages and updating navigation.")
