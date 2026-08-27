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

product_by_file = {}
product_by_model = {}
for p in products:
    m = p.get('modelNumber')
    fn = p.get('filename')
    slug = p.get('slug')
    if m:
        product_by_model[m.upper()] = p
        # Add alias without S (e.g. BH-TB-101 -> BH-TSB-101)
        if 'TSB' in m.upper():
            product_by_model[m.upper().replace('TSB', 'TB')] = p
        elif 'TB' in m.upper():
            product_by_model[m.upper().replace('TB', 'TSB')] = p
    if fn:
        product_by_file[fn.lower()] = p
    if slug:
        product_by_file[slug.lower()] = p

print(f'Loaded {len(products)} products into filename & model maps')

updated_count = 0

for filename in os.listdir('.'):
    if not filename.endswith('.html'):
        continue
    
    # Check if filename or content matches a product
    p = product_by_file.get(filename.lower())
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    if not p:
        model_match = re.search(r'Model\s*No-([A-Z0-9-]+)', content, re.IGNORECASE)
        if model_match:
            model_code = model_match.group(1).upper()
            p = product_by_model.get(model_code)

    if not p:
        continue
    
    model_code = p.get('modelNumber', '').upper()
    fixed_price = p.get('fixedPrice')
    total_area = p.get('totalFloorArea')
    floor_data = p.get('floorData', {})
    tier_data = list(floor_data.values())[0] if floor_data else {}
    rooms = tier_data.get('rooms', [])
    price_str = format_taka(fixed_price)
    
    # Generate Overview table
    table_rows = []
    if rooms:
        for r in rooms:
            sec = str(r.get('section', '')).replace('<b>', '').replace('</b>', '')
            area_val = str(r.get('area', '')).replace('<b>', '').replace('</b>', '')
            if 'total' in sec.lower():
                table_rows.append(f'<tr style="background: #d9e2f3; font-weight: 700;"><td style="border: 1px solid #000; padding: 4px 10px;">Total</td><td style="border: 1px solid #000; padding: 4px 10px; text-align: center;">{total_area or area_val}</td></tr>')
            else:
                table_rows.append(f'<tr><td style="border: 1px solid #000; padding: 4px 10px;">{sec}</td><td style="border: 1px solid #000; padding: 4px 10px; text-align: center;">{area_val}</td></tr>')
    else:
        table_rows.append(f'<tr><td style="border: 1px solid #000; padding: 4px 10px;">Turnkey Design</td><td style="border: 1px solid #000; padding: 4px 10px; text-align: center;">{total_area or ""}</td></tr>')
        table_rows.append(f'<tr style="background: #d9e2f3; font-weight: 700;"><td style="border: 1px solid #000; padding: 4px 10px;">Total</td><td style="border: 1px solid #000; padding: 4px 10px; text-align: center;">{total_area or ""}</td></tr>')

    overview_table_html = f'''<div style="margin-bottom: var(--space-4);">
  <h3 style="font-family: Arial, sans-serif; font-size: 1.15rem; color: #000; margin-bottom: 6px; font-weight: normal;">Overview (Area Details)</h3>
  <div style="overflow-x: auto; width: 100%;">
    <table id="bh-overview-table" style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 0.92rem; color: #000;">
      <thead>
        <tr style="background-color: #d9e2f3;">
          <th style="border: 1px solid #000; padding: 4px 10px; text-align: left; font-weight: normal;">Section</th>
          <th style="border: 1px solid #000; padding: 4px 10px; text-align: center; font-weight: normal;">Area (sqft)</th>
        </tr>
      </thead>
      <tbody>
        {"".join(table_rows)}
      </tbody>
    </table>
  </div>
</div>'''

    price_box_html = f'''<div style="background: var(--off-white); border-radius: 12px; padding: 12px 18px; margin-bottom: 14px;">
  <span style="display: block; font-size: 0.75rem; color: var(--grey-500); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Fixed Package Price</span>
  <span id="spec-price-{model_code.lower()}" style="font-size: 1.7rem; font-weight: 800; color: var(--primary);">{price_str}</span>
</div>'''

    cta_html = f'''<div style="display: flex; flex-direction: column; gap: 12px;">
<a href="contact.html?model={model_code}" class="btn btn-primary btn-lg" style="width: 100%; justify-content: center;">Get a Free Quote</a>
<a class="btn btn-lg" href="https://wa.me/8801781636613?text=Hello%2C%20I%20am%20interested%20in%20Model%20{model_code}%20({price_str})." rel="noopener noreferrer" style="width: 100%; justify-content: center; background: #25D366; color: white; border: none; font-weight: 700; box-shadow: 0 4px 15px rgba(37,211,102,0.3);" target="_blank">💬 WhatsApp Now</a>
</div>'''

    new_reveal_right = f'''<div class="reveal-right" style="flex: 1 1 400px; min-width: 0; max-width: 100%; background: white; padding: 18px var(--space-6); border-radius: 16px; box-shadow: var(--shadow-xl); border: 1px solid var(--primary-light); display: flex; flex-direction: column; justify-content: center;">
<div style="display: inline-block; align-self: flex-start; background: rgba(212, 175, 55, 0.15); color: var(--accent-dark); padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 0.8rem; margin-bottom: 10px;">MOST POPULAR</div>
<h2 style="font-family: var(--font-heading); font-size: 2rem; color: var(--primary); margin-bottom: 10px; line-height: 1.1;">Model No-{model_code}</h2>
{overview_table_html}
{price_box_html}
{cta_html}
</div>'''

    # Replace reveal-right section
    rr_start = content.find('<div class="reveal-right"')
    if rr_start != -1:
        next_markers = [
            '<!-- 2. Horizontal Quick-Specs Bar -->',
            '<div class="reveal-up"',
            '<!-- 2. Floor Plan &',
            '<!-- 3. Key Specifications',
            '<!-- Specifications Table',
            '<!-- 2. Floor Plan Details'
        ]
        
        found_pos = -1
        for m in next_markers:
            p_pos = content.find(m, rr_start)
            if p_pos != -1:
                if found_pos == -1 or p_pos < found_pos:
                    found_pos = p_pos
        
        if found_pos != -1:
            content = content[:rr_start] + new_reveal_right + '\n</div>\n' + content[found_pos:]
        else:
            # If no marker, match till next </main> or </div></div>
            body_end = content.find('</div>\n</div>\n<!--', rr_start)
            if body_end != -1:
                content = content[:rr_start] + new_reveal_right + '\n</div>\n' + content[body_end+14:]

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
    updated_count += 1

print(f'Successfully updated {updated_count} static product HTML files!')
