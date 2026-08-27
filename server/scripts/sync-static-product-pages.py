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

print(f'Loaded {len(product_map)} models for static page sync')

updated_count = 0

for root_file in os.listdir('.'):
    if not root_file.endswith('.html'):
        continue
    
    # Check if this is a product page (e.g. bh-*.html, dv-*.html, lcv-*.html)
    with open(root_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find model code
    model_match = re.search(r'Model\s*No-([A-Z0-9-]+)', content, re.IGNORECASE)
    if not model_match:
        continue
    
    model_code = model_match.group(1).upper()
    if model_code not in product_map:
        continue
    
    p = product_map[model_code]
    fixed_price = p.get('fixedPrice')
    total_area = p.get('totalFloorArea')
    floor_data = p.get('floorData', {})
    tier_data = list(floor_data.values())[0] if floor_data else {}
    rooms = tier_data.get('rooms', [])
    price_str = format_taka(fixed_price)
    
    # 1. Update Price block
    # Match <span id="spec-price-...">...</span> or <span class="bh-variant-price">...</span>
    content = re.sub(r'<span id="spec-price-[^"]*"[^>]*>.*?</span>', f'<span id="spec-price-val" style="font-size: 1.7rem; font-weight: 800; color: var(--primary);">{price_str}</span>', content)
    content = re.sub(r'<span class="bh-variant-price"[^>]*>.*?</span>', f'<span class="bh-variant-price" style="font-size: 1.7rem; font-weight: 800; color: var(--primary);">{price_str}</span>', content)
    
    # 2. Update/Generate Overview (Area Details) Table
    if rooms:
        table_rows = []
        for r in rooms:
            sec = str(r.get('section', '')).replace('<b>', '').replace('</b>', '')
            area_val = str(r.get('area', '')).replace('<b>', '').replace('</b>', '')
            if 'total' in sec.lower():
                table_rows.append(f'<tr style="background: #d9e2f3; font-weight: 700;"><td style="border: 1px solid #000; padding: 4px 10px;">Total</td><td style="border: 1px solid #000; padding: 4px 10px; text-align: center;">{total_area or area_val}</td></tr>')
            else:
                table_rows.append(f'<tr><td style="border: 1px solid #000; padding: 4px 10px;">{sec}</td><td style="border: 1px solid #000; padding: 4px 10px; text-align: center;">{area_val}</td></tr>')
        
        table_html = f'''<div style="margin-bottom: var(--space-4);">
  <h3 style="font-family: Arial, sans-serif; font-size: 1.15rem; color: #000; margin-bottom: 6px; font-weight: normal;">Overview (Area Details)</h3>
  <div style="overflow-x: auto; width: 100%;">
    <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 0.92rem; color: #000;">
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
        # Replace existing Overview table if present
        if 'Overview (Area Details)' in content:
            content = re.sub(r'<div style="margin-bottom:\s*var\(--space-4\);">\s*<h3[^>]*>Overview \(Area Details\)</h3>.*?</table>\s*(?:</div>)?\s*</div>', table_html, content, flags=re.DOTALL)
            
    with open(root_file, 'w', encoding='utf-8') as f:
        f.write(content)
    updated_count += 1

print(f'Successfully updated {updated_count} static product HTML files in root directory!')
