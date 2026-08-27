import json
import os
import re

# Import templates
from reconcile_all_floor_areas import reconciled_templates

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
    if any(k in s for k in ['living', 'drawing', 'dining', 'family', 'lounge']): return '🛋️'
    if any(k in s for k in ['veranda', 'varanda', 'porch', 'portch', 'balcony', 'terrace']): return '🌤️'
    if any(k in s for k in ['store', 'storage']): return '📦'
    if any(k in s for k in ['garage', 'parking']): return '🚗'
    return '🏠'

with open('server/db/seeds/data/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

# Helper to find matching template based on model and nominal total floor area
def find_template(p):
    tot = p.get('totalFloorArea')
    cat = (p.get('categorySlug') or '').lower()
    m_num = (p.get('modelNumber') or '').upper()
    is_duplex_cat = any(k in cat for k in ['duplex', 'apartment', 'villa']) or any(k in m_num for k in ['TSB', 'DV', 'DB', 'WA', 'DH'])
    
    # Direct match by nominal area
    if is_duplex_cat:
        if tot == 2500: return reconciled_templates['2500']
        if tot == 2100: return reconciled_templates['2100']
        if tot == 1800: return reconciled_templates['900D']
        if tot == 1600: return reconciled_templates['800D']
        if tot == 1200: return reconciled_templates['600D']
        if tot == 1000: return reconciled_templates['500D']
        if tot == 800: return reconciled_templates['400D']
        # Fallback to closest duplex
        if tot and tot >= 2000: return reconciled_templates['2500']
        if tot and tot >= 1500: return reconciled_templates['900D']
        return reconciled_templates['600D']
    else:
        # Simplex
        if tot == 1200: return reconciled_templates['1200']
        if tot == 1050: return reconciled_templates['1050']
        if tot == 900: return reconciled_templates['900']
        if tot == 850: return reconciled_templates['850']
        if tot == 800: return reconciled_templates['800']
        if tot == 700: return reconciled_templates['700']
        if tot == 600: return reconciled_templates['600']
        if tot == 550: return reconciled_templates['550']
        if tot == 400: return reconciled_templates['400']
        if tot == 320 or tot == 300: return reconciled_templates['320']
        if tot and tot > 1000: return reconciled_templates['1200']
        if tot and tot > 750: return reconciled_templates['800']
        if tot and tot > 500: return reconciled_templates['600']
        return reconciled_templates['400']

# 1. Update products.json
for p in products:
    tmpl = find_template(p)
    tot = tmpl['nominal_total']
    p['totalFloorArea'] = tot
    
    # Count bedrooms & bathrooms
    bed_count = 0
    bath_count = 0
    kitchen_count = 0
    
    # Build floorData
    tier_rooms = []
    for fl_name, fl_data in tmpl['floors'].items():
        if tmpl['is_duplex']:
            tier_rooms.append({'section': f'<b>{fl_name}</b>', 'length': '', 'width': '', 'area': ''})
        
        for r in fl_data['rooms']:
            sec = r['section']
            if 'bed' in sec.lower(): bed_count += 1
            if 'bath' in sec.lower(): bath_count += 1
            if 'kitchen' in sec.lower(): kitchen_count += 1
            tier_rooms.append({
                'section': sec,
                'length': r['length'],
                'width': r['width'],
                'area': r['area']
            })
            
        if tmpl['is_duplex']:
            tier_rooms.append({
                'section': f'<b>Total ({fl_name})</b>',
                'length': '',
                'width': '',
                'area': f"<b>{fl_data['target_subtotal']}</b>"
            })
            
    p['floorData'] = {
        str(tot): {
            'bed': f'{bed_count} Bedrooms' if bed_count > 1 else '1 Bedroom',
            'bath': f'{bath_count} Bathrooms' if bath_count > 1 else '1 Bathroom',
            'kitchen': f'{kitchen_count} Kitchen' if kitchen_count else '1 Kitchen',
            'rooms': tier_rooms
        }
    }
    p['bedrooms'] = f'{bed_count} Bedrooms' if bed_count > 1 else '1 Bedroom'
    p['bathrooms'] = f'{bath_count} Bathrooms' if bath_count > 1 else '1 Bathroom'

with open('server/db/seeds/data/products.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2)

print('Updated products.json with reconciled architectural room schedules!')

# 2. Update all static product HTML files
product_map = {p['modelNumber'].upper(): p for p in products if p.get('modelNumber')}
for p in products:
    fn = p.get('filename')
    if fn: product_map[fn.lower()] = p

updated_count = 0
for filename in os.listdir('.'):
    if not filename.endswith('.html'): continue
    
    p = product_map.get(filename.lower())
    if not p:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        m_match = re.search(r'Model\s*No-([A-Z0-9-]+)', content, re.IGNORECASE)
        if m_match:
            p = product_map.get(m_match.group(1).upper())
            
    if not p: continue
    
    model_code = p['modelNumber'].upper()
    fixed_price = p.get('fixedPrice')
    total_area = p.get('totalFloorArea')
    bed = p.get('bedrooms', '')
    bath = p.get('bathrooms', '')
    kitchen = '1 Kitchen'
    price_str = format_taka(fixed_price)
    tmpl = find_template(p)
    
    # Hero Chips
    chips_html = f'''<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: var(--space-4);">
  <div style="display: inline-flex; align-items: center; gap: 6px; background: var(--off-white); border: 1px solid var(--grey-200); padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 0.9rem; color: var(--primary);"><span>📐</span> {total_area} sqft</div>
  <div style="display: inline-flex; align-items: center; gap: 6px; background: var(--off-white); border: 1px solid var(--grey-200); padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 0.9rem; color: var(--grey-800);"><span>🛏️</span> {bed}</div>
  <div style="display: inline-flex; align-items: center; gap: 6px; background: var(--off-white); border: 1px solid var(--grey-200); padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 0.9rem; color: var(--grey-800);"><span>🚿</span> {bath}</div>
  <div style="display: inline-flex; align-items: center; gap: 6px; background: var(--off-white); border: 1px solid var(--grey-200); padding: 6px 14px; border-radius: 20px; font-weight: 600; font-size: 0.9rem; color: var(--grey-800);"><span>🍳</span> {kitchen}</div>
</div>'''

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

    # Build Floor Cards
    floor_cards_html = []
    for fl_name, fl_data in tmpl['floors'].items():
        rows_html = []
        for r in fl_data['rooms']:
            icon = get_room_icon(r['section'])
            icon_span = f'<span style="margin-right: 6px;">{icon}</span>' if icon else ''
            dim_str = f"{r['length']}' × {r['width']}'" if r['length'] and r['width'] else '—'
            rows_html.append(f'''<tr style="border-bottom: 1px solid var(--grey-100);">
  <td style="padding: 12px 16px; font-weight: 500; color: var(--grey-700);">{icon_span}{r['section']}</td>
  <td style="padding: 12px 16px; font-weight: 600; color: var(--grey-900); text-align: center;">{r['area']}</td>
  <td style="padding: 12px 16px; font-weight: 500; color: var(--grey-600); text-align: center;">{dim_str}</td>
</tr>''')
            
        subtotal_badge = f'<span style="background: #eef4ff; color: var(--primary); font-weight: 700; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem;">{fl_data["target_subtotal"]} sqft</span>'
        subtotal_tfoot = f'''<tfoot>
  <tr style="background: #f8fafc; font-weight: 700;">
    <td style="padding: 12px 16px; color: var(--grey-900);">{fl_name} Subtotal</td>
    <td style="padding: 12px 16px; color: var(--primary); text-align: center;">{fl_data["target_subtotal"]} sqft</td>
    <td></td>
  </tr>
</tfoot>'''

        card_html = f'''<div class="card reveal" style="background: white; border-radius: 16px; padding: var(--space-6); box-shadow: var(--shadow-sm); border: 1px solid var(--grey-100);">
  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--grey-100); padding-bottom: 12px; margin-bottom: 16px;">
    <h4 style="font-family: var(--font-heading); font-size: 1.3rem; color: var(--primary); margin: 0; display: flex; align-items: center; gap: 8px;">
      <span>🏢</span> {fl_name} Layout
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

    # Dedicated Section
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
        <div style="font-size: 1.1rem; font-weight: 600;">Full Building Structure ({'2 Floors' if tmpl['is_duplex'] else '1 Floor'})</div>
      </div>
      <div style="font-size: 1.8rem; font-weight: 800; color: #fde68a;">
        {total_area} sqft
      </div>
    </div>
  </div>
</div>'''

    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

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

print(f'Successfully updated {updated_count} static product HTML files with 100% architecturally reconciled schedules!')
