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

def get_room_icon(sec):
    s = (sec or '').lower()
    if any(k in s for k in ['wall', 'stair']): return ''
    if any(k in s for k in ['bath', 'toilet', 'washroom']): return '🚿'
    if 'kitchen' in s: return '🍳'
    if 'bed' in s: return '🛏️'
    if any(k in s for k in ['living', 'drawing', 'dining', 'family']): return '🛋️'
    if any(k in s for k in ['veranda', 'varanda', 'porch', 'portch', 'balcony']): return '🌤️'
    if any(k in s for k in ['store', 'storage']): return '📦'
    if any(k in s for k in ['garage', 'parking']): return '🚗'
    return '🏠'

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
        if 'TSB' in m.upper():
            product_by_model[m.upper().replace('TSB', 'TB')] = p
        elif 'TB' in m.upper():
            product_by_model[m.upper().replace('TB', 'TSB')] = p
    if fn:
        product_by_file[fn.lower()] = p
    if slug:
        product_by_file[slug.lower()] = p

print(f'Loaded {len(products)} products')

updated_count = 0

for filename in os.listdir('.'):
    if not filename.endswith('.html'):
        continue
    
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
    bed = tier_data.get('bed', p.get('bedrooms', ''))
    bath = tier_data.get('bath', p.get('bathrooms', ''))
    kitchen = tier_data.get('kitchen', '1 Kitchen')
    price_str = format_taka(fixed_price)
    
    # 1. Clean Quick Specs Chips for Hero Box
    chips_html = '<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: var(--space-4);">'
    if total_area:
        chips_html += f'<div style="display: inline-flex; align-items: center; gap: 6px; background: var(--off-white); border: 1px solid var(--grey-200); padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 0.9rem; color: var(--primary);"><span>📐</span> {total_area} sqft</div>'
    if bed:
        chips_html += f'<div style="display: inline-flex; align-items: center; gap: 6px; background: var(--off-white); border: 1px solid var(--grey-200); padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 0.9rem; color: var(--grey-800);"><span>🛏️</span> {bed}</div>'
    if bath:
        chips_html += f'<div style="display: inline-flex; align-items: center; gap: 6px; background: var(--off-white); border: 1px solid var(--grey-200); padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 0.9rem; color: var(--grey-800);"><span>🚿</span> {bath}</div>'
    if kitchen:
        chips_html += f'<div style="display: inline-flex; align-items: center; gap: 6px; background: var(--off-white); border: 1px solid var(--grey-200); padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 0.9rem; color: var(--grey-800);"><span>🍳</span> {kitchen}</div>'
    chips_html += '</div>'

    price_box_html = f'''<div style="background: var(--off-white); border-radius: 12px; padding: 14px 18px; margin-bottom: 14px;">
  <span style="display: block; font-size: 0.75rem; color: var(--grey-500); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Fixed Package Price</span>
  <span id="spec-price-{model_code.lower()}" style="font-size: 1.8rem; font-weight: 800; color: var(--primary);">{price_str}</span>
</div>'''

    trust_strip_html = '''<div class="pd-trust-strip" style="margin-bottom: 16px;">
  <span>⚡ 45–60 day build</span>
  <span>🛡️ Earthquake resistant</span>
  <span>🌪️ 200+ km/h wind rated</span>
</div>'''

    cta_html = f'''<div style="display: flex; flex-direction: column; gap: 12px;">
<a href="contact.html?model={model_code}" class="btn btn-primary btn-lg" style="width: 100%; justify-content: center;">Get a Free Quote</a>
<a class="btn btn-lg" href="https://wa.me/8801781636613?text=Hello%2C%20I%20am%20interested%20in%20Model%20{model_code}%20({price_str})." rel="noopener noreferrer" style="width: 100%; justify-content: center; background: #25D366; color: white; border: none; font-weight: 700; box-shadow: 0 4px 15px rgba(37,211,102,0.3);" target="_blank">💬 WhatsApp Now</a>
</div>'''

    new_hero_right = f'''<div class="reveal-right" style="flex: 1 1 400px; min-width: 0; max-width: 100%; background: white; padding: var(--space-6); border-radius: 16px; box-shadow: var(--shadow-xl); border: 1px solid var(--primary-light); display: flex; flex-direction: column; justify-content: center;">
<div style="display: inline-block; align-self: flex-start; background: rgba(212, 175, 55, 0.15); color: var(--accent-dark); padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 0.8rem; margin-bottom: 12px;">MOST POPULAR</div>
<h2 style="font-family: var(--font-heading); font-size: 2.2rem; color: var(--primary); margin-bottom: 12px; line-height: 1.1;">Model No-{model_code}</h2>
{chips_html}
{price_box_html}
{trust_strip_html}
{cta_html}
</div>'''

    # 2. Group rooms by Floor (Ground Floor vs First Floor vs Single Floor)
    groups = []
    current_group = {'label': 'Ground Floor Layout', 'rows': [], 'total': None}
    
    has_multiple_floors = any('first floor' in str(r.get('section', '')).lower() or '2nd floor' in str(r.get('section', '')).lower() for r in rooms)
    
    if not has_multiple_floors:
        current_group['label'] = 'Building Layout Details'

    for r in rooms:
        sec = str(r.get('section', '')).replace('<b>', '').replace('</b>', '').strip()
        area_val = str(r.get('area', '')).replace('<b>', '').replace('</b>', '').strip()
        l_val = r.get('length')
        w_val = r.get('width')
        dim_str = f"{l_val}' × {w_val}'" if (l_val and w_val) else '—'
        
        # Check if this row is a floor header
        if 'first floor' in sec.lower() or '1st floor' in sec.lower():
            if current_group['rows']:
                groups.append(current_group)
            current_group = {'label': 'First Floor Layout', 'rows': [], 'total': None}
            continue
        elif 'ground floor' in sec.lower() and not area_val:
            current_group['label'] = 'Ground Floor Layout'
            continue
        elif 'total' in sec.lower():
            if area_val:
                current_group['total'] = area_val
            continue
        
        if sec:
            icon = get_room_icon(sec)
            current_group['rows'].append({
                'section': sec,
                'area': area_val or '—',
                'dim': dim_str,
                'icon': icon
            })
            
    if current_group['rows']:
        groups.append(current_group)

    floor_cards_html = []
    for g in groups:
        rows_html = []
        for row in g['rows']:
            icon_span = f'<span style="margin-right: 6px;">{row["icon"]}</span>' if row["icon"] else ''
            rows_html.append(f'''<tr style="border-bottom: 1px solid var(--grey-100);">
  <td style="padding: 12px 16px; font-weight: 500; color: var(--grey-700);">{icon_span}{row['section']}</td>
  <td style="padding: 12px 16px; font-weight: 600; color: var(--grey-900); text-align: center;">{row['area']}</td>
  <td style="padding: 12px 16px; font-weight: 500; color: var(--grey-600); text-align: center;">{row['dim']}</td>
</tr>''')
        
        subtotal_badge = f'<span style="background: #eef4ff; color: var(--primary); font-weight: 700; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem;">{g["total"]} sqft</span>' if g.get("total") else ''
        subtotal_tfoot = f'''<tfoot>
  <tr style="background: #f8fafc; font-weight: 700;">
    <td style="padding: 12px 16px; color: var(--grey-900);">{g['label']} Subtotal</td>
    <td style="padding: 12px 16px; color: var(--primary); text-align: center;">{g['total']} sqft</td>
    <td></td>
  </tr>
</tfoot>''' if g.get("total") else ''

        card_html = f'''<div class="card reveal" style="background: white; border-radius: 16px; padding: var(--space-6); box-shadow: var(--shadow-sm); border: 1px solid var(--grey-100);">
  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--grey-100); padding-bottom: 12px; margin-bottom: 16px;">
    <h4 style="font-family: var(--font-heading); font-size: 1.3rem; color: var(--primary); margin: 0; display: flex; align-items: center; gap: 8px;">
      <span>🏢</span> {g['label']}
    </h4>
    {subtotal_badge}
  </div>
  <div style="overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch;">
    <table class="modern-table" style="width: 100%; border-collapse: separate; border-spacing: 0;">
      <thead>
        <tr style="background: var(--off-white);">
          <th scope="col" style="padding: 12px 16px; font-weight: 700; color: var(--grey-900); border-bottom: 2px solid var(--grey-200); text-align: left;">Section</th>
          <th scope="col" style="padding: 12px 16px; font-weight: 700; color: var(--grey-900); border-bottom: 2px solid var(--grey-200); text-align: center;">Area (sqft)</th>
          <th scope="col" style="padding: 12px 16px; font-weight: 700; color: var(--grey-900); border-bottom: 2px solid var(--grey-200); text-align: center;">Dimensions</th>
        </tr>
      </thead>
      <tbody>
        {"".join(rows_html)}
      </tbody>
      {subtotal_tfoot}
    </table>
  </div>
</div>'''
        floor_cards_html.append(card_html)

    # Dedicated Section HTML
    dedicated_overview_section = f'''<!-- Overview (Area Details) Section -->
<div class="reveal-up" style="margin-bottom: var(--space-8);">
  <div style="margin-bottom: var(--space-4);">
    <h3 style="font-family: var(--font-heading); font-size: 1.8rem; color: var(--primary); margin-bottom: 6px;">Overview (Area Details)</h3>
    <p style="color: var(--grey-600); font-size: 0.95rem; margin: 0;">Official floor-wise layout dimensions and area specifications for Model No-{model_code}.</p>
  </div>
  
  <div style="display: flex; flex-direction: column; gap: var(--space-5);">
    {"".join(floor_cards_html)}
    
    <!-- Total Building Area Card -->
    <div class="card reveal" style="background: linear-gradient(135deg, #21409a 0%, #172c68 100%); color: white; border-radius: 16px; padding: 18px var(--space-6); display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow-md);">
      <div>
        <div style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.85;">Total Covered Area</div>
        <div style="font-size: 1.1rem; font-weight: 600;">Full Building Structure ({'2 Floors' if has_multiple_floors else '1 Floor'})</div>
      </div>
      <div style="font-size: 1.8rem; font-weight: 800; color: #fde68a;">
        {total_area or ""} sqft
      </div>
    </div>
  </div>
</div>'''

    # Replace hero right and insert overview section below hero
    rr_start = content.find('<div class="reveal-right"')
    if rr_start != -1:
        spec_marker = 'Building Specifications'
        spec_pos = content.find(spec_marker, rr_start)
        
        if spec_pos != -1:
            div_spec_start = content.rfind('<div class="reveal-up"', rr_start, spec_pos)
            if div_spec_start != -1:
                content = content[:rr_start] + new_hero_right + '\n</div>\n' + dedicated_overview_section + '\n' + content[div_spec_start:]
            else:
                content = content[:rr_start] + new_hero_right + '\n</div>\n' + dedicated_overview_section + '\n' + content[spec_pos:]
        else:
            body_end = content.find('</div>\n</div>\n<!--', rr_start)
            if body_end != -1:
                content = content[:rr_start] + new_hero_right + '\n</div>\n' + dedicated_overview_section + '\n' + content[body_end+14:]

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
    updated_count += 1

print(f'Successfully updated {updated_count} static product HTML files with multi-floor duplex support!')
