import os
import re
import json

# Format number as Lakh (Bangladeshi Taka format)
def format_taka(num):
    if not num: return ''
    n = int(num)
    s = str(n)
    if len(s) <= 3:
        return f"৳ {s}"
    last_three = s[-3:]
    remaining = s[:-3]
    chunks = []
    while len(remaining) > 2:
        chunks.insert(0, remaining[-2:])
        remaining = remaining[:-2]
    if remaining:
        chunks.insert(0, remaining)
    return f"৳ {','.join(chunks)},{last_three}"

products_path = 'server/db/seeds/data/products.json'
with open(products_path, 'r', encoding='utf-8') as f:
    products = json.load(f)

product_map = {}
for p in products:
    m = p.get('modelNumber')
    if m:
        product_map[m.upper()] = p

print(f'Loaded {len(product_map)} products in product_map')

pages_to_update = [
    'apartment-building.njk',
    'duplex-steel-building.njk',
    'simplex-steel-building.njk',
    'concrete-building.njk',
    'cottage-house.njk',
    'container-house.njk',
    'steel-house.njk',
    'tiny-house.njk',
    'wooden-house.njk'
]

total_updated_cards = 0

for page in pages_to_update:
    page_path = os.path.join('server', 'views', 'pages', page)
    if not os.path.exists(page_path):
        continue
    with open(page_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern for property cards
    # Each card contains "Model No-BH-..."
    # Let's find all cards
    cards = content.split('<div class="property-card')
    new_parts = [cards[0]]
    
    for card in cards[1:]:
        # extract model number
        model_match = re.search(r'Model\s*No-([A-Z0-9-]+)', card, re.IGNORECASE)
        if model_match:
            model_code = model_match.group(1).upper()
            if model_code in product_map:
                p = product_map[model_code]
                fixed_price = p.get('fixedPrice')
                total_area = p.get('totalFloorArea')
                floor_data = p.get('floorData', {})
                tier_data = list(floor_data.values())[0] if floor_data else {}
                bed_str = tier_data.get('bed', 'Bed')
                bath_str = tier_data.get('bath', 'Bath')
                
                # Format price string
                price_formatted = format_taka(fixed_price) if fixed_price else 'Contact for Quote'
                
                # 1. Update/Replace property-price block
                # Match <div class="property-price">...</div>
                price_block_pattern = r'<div class="property-price">.*?</div>'
                new_price_block = f'<div class="property-price" style="display:flex; flex-direction:column; align-items:flex-start; margin-bottom:12px;"><span class="property-price-label" style="font-size:0.75rem; color:var(--grey-500); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px;">Fixed Price</span><span class="property-price-value" style="font-size:1.25rem; color:var(--primary); font-weight:800; display:flex; align-items:baseline; gap:4px;">{price_formatted} <span style="font-size:0.8rem; color:var(--grey-500); font-weight:500;">BDT</span></span></div>'
                
                if re.search(price_block_pattern, card, re.DOTALL):
                    card = re.sub(price_block_pattern, new_price_block, card, flags=re.DOTALL)
                
                # 2. Update/Replace property-specs block if present
                specs_block_pattern = r'<div class="property-specs".*?</div>\s*</div>'
                if total_area:
                    area_formatted = f"{total_area:,} sqft"
                    new_specs_block = f'''<div class="property-specs" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; font-size: 0.82rem; color: var(--grey-700); margin: 8px 0 12px;">
  <div style="display: flex; align-items: center; gap: 6px; background: var(--off-white); padding: 6px 8px; border-radius: 6px;">
    <span style="font-size: 1rem; color: var(--primary);">📐</span> <strong>{area_formatted}</strong>
  </div>
  <div style="display: flex; align-items: center; gap: 6px; background: var(--off-white); padding: 6px 8px; border-radius: 6px;">
    <span style="font-size: 1rem; color: var(--primary);">🛏️</span> <strong>{bed_str}</strong>
  </div>
  <div style="display: flex; align-items: center; gap: 6px; background: var(--off-white); padding: 6px 8px; border-radius: 6px;">
    <span style="font-size: 1rem; color: var(--primary);">🚿</span> <strong>{bath_str}</strong>
  </div>
</div>'''
                    if re.search(r'<div class="property-specs".*?</div>\s*</div>', card, re.DOTALL):
                        card = re.sub(r'<div class="property-specs".*?</div>\s*</div>', new_specs_block + '</div>', card, flags=re.DOTALL)
                    elif '<p class="property-desc">' in card:
                        # Insert specs before property-price or description
                        card = card.replace('<p class="property-desc">', f'{new_specs_block}\n<p class="property-desc">')
                
                total_updated_cards += 1
                
        new_parts.append(card)
        
    updated_content = '<div class="property-card'.join(new_parts)
    with open(page_path, 'w', encoding='utf-8') as f:
        f.write(updated_content)
    print(f'Updated {page} successfully.')

print(f'Total model cards updated across all category overview pages: {total_updated_cards}')
