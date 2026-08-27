import os
import re
import json

def format_taka(n):
    if not n: return 'Contact for Quote'
    s = str(int(n))
    last3 = s[-3:]
    rest = s[:-3]
    if rest:
        chunks = []
        while len(rest) > 2:
            chunks.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            chunks.insert(0, rest)
        return '৳' + ','.join(chunks) + ',' + last3
    return '৳' + last3

with open('server/db/seeds/data/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

product_map = {}
for p in products:
    m = p.get('modelNumber')
    if m:
        product_map[m.upper()] = p

print(f'Loaded {len(product_map)} models from products.json')

category_files = [
    ('apartment-building.html', 'server/views/pages/apartment-building.njk', 'Apartment Building'),
    ('duplex-steel-building.html', 'server/views/pages/duplex-steel-building.njk', 'Duplex Steel Building'),
    ('simplex-steel-building.html', 'server/views/pages/simplex-steel-building.njk', 'Simplex Steel Building'),
    ('concrete-building.html', 'server/views/pages/concrete-building.njk', 'Concrete Building'),
    ('cottage-house.html', 'server/views/pages/cottage-house.njk', 'Cottage House'),
    ('container-house.html', 'server/views/pages/container-house.njk', 'Container House'),
    ('steel-house.html', 'server/views/pages/steel-house.njk', 'Steel House'),
    ('tiny-house.html', 'server/views/pages/tiny-house.njk', 'Tiny House'),
    ('wooden-house.html', 'server/views/pages/wooden-house.njk', 'Wooden House')
]

def update_file(filepath, is_template=False, cat_title=''):
    if not os.path.exists(filepath):
        return 0
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split on opening of property-card (excluding property-card-body)
    # Using regex split with lookahead
    pattern = r'(?=<div class="property-card\b(?!-body))'
    blocks = re.split(pattern, content)
    new_blocks = [blocks[0]]
    count = 0

    for block in blocks[1:]:
        model_match = re.search(r'Model\s*No-([A-Z0-9-]+)', block, re.IGNORECASE)
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
                price_str = format_taka(fixed_price)
                
                # Extract target URL
                link_match = re.search(r'href="([^"]+\.html)"', block)
                target_url = link_match.group(1) if link_match else f"{model_code.lower()}.html"
                
                # Extract description
                desc_match = re.search(r'<p class="property-desc"[^>]*>(.*?)</p>', block, re.DOTALL)
                desc_text = desc_match.group(1).strip() if desc_match else (p.get('description') or f"Modern prefabricated {cat_title.lower()} engineered for durability and fast construction.")
                
                area_display = f"{total_area:,} sqft" if total_area else "Designated Area"
                
                # Find <div class="property-card-body"...
                body_start = block.find('<div class="property-card-body"')
                if body_start != -1:
                    prefix = block[:body_start]
                    
                    # Find trailing content after this card
                    # A card ends with </div></div> or </div> (closing card)
                    # Let's find the closing of the card
                    # If there is another tag like </div></div>
                    card_suffix = ''
                    # Let's see if there is closing </div>
                    # In our layout, property-card wraps property-img-wrap and property-card-body.
                    # We replace property-card-body and close property-card.
                    
                    # Check if there is extra content after card closing (e.g. closing grid tags </div></div></main>)
                    # Find the last </div> in the block if it contains trailing wrappers
                    trailing = ''
                    # If this is the last card in the file, it will have trailing grid & footer tags
                    body_section = block[body_start:]
                    # Match <div class="property-card-body"...</div>\s*</div>(.*)$
                    body_match = re.search(r'<div class="property-card-body"[^>]*>.*?</div>\s*</div>(.*)$', body_section, re.DOTALL)
                    if body_match:
                        trailing = body_match.group(1)
                    
                    new_card_body = f'''<div class="property-card-body" data-aos="fade-up" style="display: flex; flex-direction: column; gap: 8px; padding: 16px; background: white;">
  <div style="display: flex; justify-content: space-between; align-items: center;">
    <span class="property-type" style="margin-bottom: 0; font-size: 0.78rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px;">{cat_title or p.get('categoryName', 'Prefab Building')}</span>
    <span style="background: rgba(30, 64, 175, 0.08); color: var(--primary); font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 12px; letter-spacing: 0.3px;">⚡ Turnkey</span>
  </div>
  <h2 class="property-name" style="font-size: 1.25rem; font-weight: 800; color: var(--grey-900); margin: 0; line-height: 1.2; font-family: var(--font-heading);">Model No-{model_code}</h2>
  <div class="property-specs" style="display: flex; flex-wrap: wrap; gap: 6px; font-size: 0.8rem; color: var(--grey-700); margin: 2px 0;">
    <span style="background: var(--off-white); padding: 4px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">📐 <strong>{area_display}</strong></span>
    <span style="background: var(--off-white); padding: 4px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">🛏️ <strong>{bed_str}</strong></span>
    <span style="background: var(--off-white); padding: 4px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">🚿 <strong>{bath_str}</strong></span>
  </div>
  <p class="property-desc" style="font-size: 0.84rem; color: var(--grey-600); line-height: 1.4; margin: 0;">{desc_text}</p>
  <div class="property-price" style="display: flex; flex-direction: column; align-items: flex-start; padding: 8px 12px; background: #f8fafc; border-radius: 8px; border-left: 3px solid var(--primary); margin-top: auto;">
    <span class="property-price-label" style="font-size: 0.68rem; color: var(--grey-500); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Fixed Package Price</span>
    <span class="property-price-value" style="font-size: 1.25rem; color: var(--primary); font-weight: 800; display: flex; align-items: baseline; gap: 4px;">{price_str} <span style="font-size: 0.75rem; color: var(--grey-500); font-weight: 600;">BDT</span></span>
  </div>
  <a class="btn btn-primary" href="{target_url}" style="width: 100%; justify-content: center; padding: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px;">View Details →</a>
</div></div>{trailing}'''
                    block = prefix + new_card_body
                    count += 1
        new_blocks.append(block)

    updated_content = ''.join(new_blocks)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(updated_content)
    print(f'Updated {filepath} -> {count} cards')
    return count

total = 0
for html_f, njk_f, title in category_files:
    total += update_file(html_f, False, title)
    total += update_file(njk_f, True, title)

print(f'=== Total updated cards: {total} ===')
