#!/usr/bin/env python3
import os

PAGES_DIR = os.path.dirname(os.path.abspath(__file__))

# We will read low-cost-villa.html and modify it to create low-cost-villa.html
with open(os.path.join(PAGES_DIR, "low-cost-villa.html"), "r", encoding="utf-8") as f:
    template = f.read()

# Make substitutions for the category page
category_html = template.replace(
    "<title>Low-Cost Steel Prefab Cottage | Pre-Engineered Steel Building Bangladesh</title>",
    "<title>Low-Cost Villa | Pre-Engineered Steel Building Bangladesh</title>"
).replace(
    "Low-Cost Prefab Cottage Package", "Low-Cost Villa Package"
).replace(
    "Low-Cost Villa", "Low-Cost Villa"
).replace(
    "Low-Cost Prefab Cottage", "Low-Cost Villa"
).replace(
    "cottage", "villa"
).replace(
    "Cottage", "Villa"
)

# We also need to update the packages grid for the category page
packages_grid_start = category_html.find('<div class="properties-grid stagger">')
packages_grid_end = category_html.find('</section>', packages_grid_start)

grid_content = ""
for i in range(1, 10):
    model_num = f"10{i}" if i < 10 else str(100 + i)
    url = f"lcv-{model_num}.html"
    grid_content += f"""
          <div class="property-card reveal" style="--i:{i-1}">
            <div class="property-img-wrap" style="height:220px;background:linear-gradient(135deg,var(--primary),var(--primary-light));display:flex;align-items:center;justify-content:center">
              <div style="text-align:center;color:white">
                <div style="font-size:3.5rem;margin-bottom:var(--space-3)">🏡</div>
                <div style="font-size:var(--fs-lg);font-weight:700;font-family:var(--font-heading)">Model LCV-{model_num}</div>
              </div>
            </div>
            <div class="property-card-body">
              <span class="property-type">Low Cost Villa</span>
              <h3 class="property-name">Model LCV-{model_num}</h3>
              <p class="property-desc">Affordable luxury for families. This sub-model offers practical living space with premium finishes.</p>
              <div class="property-specs">
                <div class="spec-item"><span class="spec-icon" aria-hidden="true">🛏️</span> 2 Bedrooms</div>
                <div class="spec-item"><span class="spec-icon" aria-hidden="true">🚿</span> 1 Bathroom</div>
                <div class="spec-item"><span class="spec-icon" aria-hidden="true">🍳</span> Kitchen</div>
              </div>
              <a href="{url}" class="btn btn-primary" style="width:100%;justify-content:center;">View Details</a>
            </div>
          </div>
"""

new_section = f'<div class="properties-grid stagger">\n{grid_content}        </div>\n      '
category_html = category_html[:packages_grid_start] + new_section + category_html[packages_grid_end:]

with open(os.path.join(PAGES_DIR, "low-cost-villa.html"), "w", encoding="utf-8") as f:
    f.write(category_html)

print("Created low-cost-villa.html")

# Now generate individual model pages
# We will use the generated low-cost-villa.html as a base for individual product pages

model_template = category_html

for i in range(1, 10):
    model_num = f"10{i}" if i < 10 else str(100 + i)
    file_name = f"lcv-{model_num}.html"
    
    # Replace the packages grid with the specific model details
    # For LCV-101 we use specific data
    if model_num == "101":
        details = """
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-8);">
            <div class="property-card reveal" style="padding:var(--space-6); background:white;">
                <h3 style="color:var(--primary); margin-bottom:var(--space-4); border-bottom:1px solid var(--grey-100); padding-bottom:var(--space-3);">Floor Description</h3>
                <ul style="list-style:none; padding:0; display:flex; flex-direction:column; gap:var(--space-3); color:var(--grey-700);">
                    <li><strong>Floor Area:</strong> 440 sft</li>
                    <li><strong>Width:</strong> 20 ft</li>
                    <li><strong>Length:</strong> 22 ft</li>
                    <li><strong>Eave Height:</strong> 9.5 ft</li>
                    <li><strong>Master Bed Room:</strong> 11ft x 10ft</li>
                    <li><strong>Child Bed:</strong> 11ft x 10ft</li>
                    <li><strong>Living Room:</strong> 18ft x 8ft</li>
                    <li><strong>Kitchen:</strong> 6ft x 6ft</li>
                    <li><strong>Common Toilet:</strong> 5ft x 4ft</li>
                    <li><strong>Veranda:</strong> 6ft x 4ft</li>
                </ul>
            </div>
            
            <div class="property-card reveal" style="padding:var(--space-6); background:white;">
                <h3 style="color:var(--primary); margin-bottom:var(--space-4); border-bottom:1px solid var(--grey-100); padding-bottom:var(--space-3);">Materials Description</h3>
                <ul style="list-style:none; padding:0; display:flex; flex-direction:column; gap:var(--space-3); color:var(--grey-700);">
                    <li><strong>Footing:</strong> pre cast Rcc</li>
                    <li><strong>Tie Beam:</strong> pre cast Rcc</li>
                    <li><strong>Structure:</strong> Prefab steel</li>
                    <li><strong>Roof:</strong> 0.42mm Color coated steel sheet</li>
                    <li><strong>Heat Insulation:</strong> 5mm pe foam</li>
                    <li><strong>Outer wall:</strong> 2.5'' pre cast Rcc panel</li>
                    <li><strong>Inner wall:</strong> 2'' pre cast Rcc panel</li>
                    <li><strong>Main Door:</strong> Steel flash Door</li>
                    <li><strong>Toilet & Kitchen:</strong> PVC Door</li>
                    <li><strong>Window:</strong> Glass with MS frame</li>
                    <li><strong>Grill:</strong> 10 mm Square bar</li>
                    <li><strong>Indoor paint:</strong> Off-white plastic Emulsion</li>
                    <li><strong>Outdoor paint:</strong> Light gray weather coat</li>
                    <li><strong>Commode:</strong> Star band</li>
                    <li><strong>Bath room fitting:</strong> uPVC</li>
                    <li><strong>Floor finishing:</strong> Ner cement and color</li>
                    <li><strong>Safety tank:</strong> 2 set x 3ftx5ft ring well</li>
                    <li><strong>Water Tank:</strong> 500 ltr with steel stand</li>
                </ul>
            </div>
        </div>
        """
    else:
        details = f"""
        <div class="property-card reveal" style="padding:var(--space-6); background:white;">
            <h3 style="color:var(--primary); margin-bottom:var(--space-4);">Specifications for LCV-{model_num}</h3>
            <p>Details for Model LCV-{model_num} will be available soon. It follows the high standards and quality of our Low Cost Villa series.</p>
        </div>
        """
    
    # We will replace the "Our Villa Packages" section with the model details
    section_start = model_template.find('<section class="section" style="background:var(--off-white)"')
    section_end = model_template.find('</section>', section_start) + 10
    
    new_section = f"""
    <section class="section" style="background:var(--off-white)" aria-labelledby="model-specs-title">
      <div class="container">
        <div class="section-header reveal">
          <div class="section-label">Model Details</div>
          <h2 class="section-title" id="model-specs-title">Model LCV-{model_num}</h2>
          <p class="section-subtitle">Detailed specifications and material descriptions for this sub-model.</p>
        </div>
        {details}
      </div>
    </section>
    """
    
    page_html = model_template[:section_start] + new_section + model_template[section_end:]
    
    # Update page titles and hero
    page_html = page_html.replace(
        '<h1 class="page-hero-title" id="cottage-page-title">Low-Cost Villa</h1>',
        f'<h1 class="page-hero-title" id="cottage-page-title">Model LCV-{model_num}</h1>'
    )
    page_html = page_html.replace(
        '<span class="page-hero-label">Housing Package</span>',
        '<span class="page-hero-label">Low Cost Villa Sub-Model</span>'
    )
    
    with open(os.path.join(PAGES_DIR, file_name), "w", encoding="utf-8") as f:
        f.write(page_html)
        
    print(f"Created {file_name}")

