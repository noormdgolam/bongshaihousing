import re, json

# Detailed descriptions & specs for BH-SB-301..312
specs_dict = {
    301: {"area": "1,200", "beds": "4", "baths": "2", "price": "30,00,000", "desc": "Spacious 4-bedroom simplex steel building with solid framing and modern finishes across 1,200 sq.ft."},
    302: {"area": "1,050", "beds": "4", "baths": "2", "price": "27,00,000", "desc": "Comfortable 4-bedroom single-story layout on 1,050 sq.ft with light steel framing and turnkey completion."},
    303: {"area": "900", "beds": "3", "baths": "2", "price": "24,00,000", "desc": "Efficient 3-bedroom simplex steel home covering 900 sq.ft, ideal for modern suburban living."},
    304: {"area": "750", "beds": "2", "baths": "2", "price": "20,00,000", "desc": "Compact 2-bedroom simplex steel cottage covering 750 sq.ft, fast assembly with premium thermal insulation."},
    305: {"area": "1,250", "beds": "4", "baths": "2", "price": "31,25,000", "desc": "Grand 1,250 sq.ft single-story steel residence with open-concept living and 4 expansive bedrooms."},
    306: {"area": "1,100", "beds": "4", "baths": "2", "price": "28,50,000", "desc": "Well-balanced 4-bedroom simplex home across 1,100 sq.ft with galvanized anti-corrosive steel superstructure."},
    307: {"area": "950", "beds": "3", "baths": "2", "price": "25,00,000", "desc": "Charming 3-bedroom single-level home spanning 950 sq.ft with rapid prefabricated construction."},
    308: {"area": "800", "beds": "2", "baths": "2", "price": "21,00,000", "desc": "Smart 2-bedroom simplex design on 800 sq.ft with insulated wall panels and energy-efficient lighting."},
    309: {"area": "1,300", "beds": "4", "baths": "3", "price": "33,50,000", "desc": "Luxury 4-bedroom simplex steel building spanning 1,300 sq.ft with 3 modern bathrooms and expansive porch."},
    310: {"area": "1,150", "beds": "4", "baths": "2", "price": "29,50,000", "desc": "Family-friendly 4-bedroom simplex home over 1,150 sq.ft engineered for high wind and seismic resistance."},
    311: {"area": "1,000", "beds": "3", "baths": "2", "price": "26,00,000", "desc": "Contemporary 3-bedroom single-story steel building across 1,000 sq.ft with turnkey completion."},
    312: {"area": "850", "beds": "3", "baths": "2", "price": "22,50,000", "desc": "Practical 3-bedroom simplex steel home across 850 sq.ft offering high affordability and rapid delivery."}
}

def generate_cards_html():
    cards = []
    for i in range(301, 313):
        slug = f"bh-sb-{i}"
        idx = i - 301
        spec = specs_dict[i]
        loading = 'loading="eager" fetchpriority="high"' if idx == 0 else 'loading="lazy"'
        card = f'''<div class="property-card reveal" data-tilt data-aos="fade-up" style="--i:{idx}">
<div class="property-img-wrap"><img alt="Bongshai Housing Model No-BH-SB-{i}" {loading} src="images/products/{slug}.webp" srcset="images/products/{slug}-400w.webp 400w, images/products/{slug}-700w.webp 700w, images/products/{slug}.webp 1024w" sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 500px" title="Bongshai Housing Model No-BH-SB-{i}" width="1024" height="1024"></div>
<div class="property-card-body" data-aos="fade-up" style="display: flex; flex-direction: column; gap: 8px; padding: 16px; background: white;">
  <div style="display: flex; justify-content: space-between; align-items: center;">
    <span class="property-type" style="margin-bottom: 0; font-size: 0.78rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px;">Simplex Steel Building</span>
    <span style="background: rgba(30, 64, 175, 0.08); color: var(--primary); font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 12px; letter-spacing: 0.3px;">⚡ Turnkey</span>
  </div>
  <h2 class="property-name" style="font-size: 1.25rem; font-weight: 800; color: var(--grey-900); margin: 0; line-height: 1.2; font-family: var(--font-heading);">Model No-BH-SB-{i}</h2>
  <div class="property-specs" style="display: flex; flex-wrap: wrap; gap: 6px; font-size: 0.8rem; color: var(--grey-700); margin: 2px 0;">
    <span style="background: var(--off-white); padding: 4px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">📐 <strong>{spec["area"]} sqft</strong></span>
    <span style="background: var(--off-white); padding: 4px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">🛏️ <strong>{spec["beds"]} Bedrooms</strong></span>
    <span style="background: var(--off-white); padding: 4px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">🚿 <strong>{spec["baths"]} Bathrooms</strong></span>
  </div>
  <p class="property-desc" style="font-size: 0.84rem; color: var(--grey-600); line-height: 1.4; margin: 0;">{spec["desc"]}</p>
  <div class="property-price" style="display: flex; flex-direction: column; align-items: flex-start; padding: 8px 12px; background: #f8fafc; border-radius: 8px; border-left: 3px solid var(--primary); margin-top: auto;">
    <span class="property-price-label" style="font-size: 0.68rem; color: var(--grey-500); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Fixed Package Price</span>
    <span class="property-price-value" style="font-size: 1.25rem; color: var(--primary); font-weight: 800; display: flex; align-items: baseline; gap: 4px;">৳{spec["price"]} <span style="font-size: 0.75rem; color: var(--grey-500); font-weight: 600;">BDT</span></span>
  </div>
  <a class="btn btn-primary" href="{slug}.html" style="width: 100%; justify-content: center; padding: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px;">View Details →</a>
</div></div>'''
        cards.append(card)
    return '\n'.join(cards)

cards_block = generate_cards_html()

# Apply to simplex-steel-building.html
with open('simplex-steel-building.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Replace product-grid content
pattern = r'(<div class="stagger product-grid">)(.*?)(</div>\s*</div>\s*<!-- Technical Specs & Why Choose Us -->)'
replacement = r'\1\n' + cards_block.replace('\\', '\\\\') + r'\n\3'

# If the comment doesn't exist, let's find the closing section
if 'product-grid' in html_content:
    grid_start = html_content.find('<div class="stagger product-grid">')
    # Find next section or closing tag
    section_end = html_content.find('<section', grid_start)
    if section_end != -1:
        # Find closing divs before section
        before_section = html_content[:section_end]
        after_section = html_content[section_end:]
        # Replace between grid_start and section_end
        new_before = html_content[:grid_start + len('<div class="stagger product-grid">')] + '\n' + cards_block + '\n</div>\n</div>\n</div>\n'
        new_html = new_before + after_section
        with open('simplex-steel-building.html', 'w', encoding='utf-8') as f:
            f.write(new_html)
        print("Updated simplex-steel-building.html successfully!")

# Apply to server/views/pages/simplex-steel-building.njk
with open('server/views/pages/simplex-steel-building.njk', 'r', encoding='utf-8') as f:
    njk_content = f.read()

if 'product-grid' in njk_content:
    grid_start = njk_content.find('<div class="stagger product-grid">')
    section_end = njk_content.find('<section', grid_start)
    if section_end != -1:
        after_section = njk_content[section_end:]
        new_before = njk_content[:grid_start + len('<div class="stagger product-grid">')] + '\n' + cards_block + '\n</div>\n</div>\n</div>\n'
        new_njk = new_before + after_section
        with open('server/views/pages/simplex-steel-building.njk', 'w', encoding='utf-8') as f:
            f.write(new_njk)
        print("Updated server/views/pages/simplex-steel-building.njk successfully!")
