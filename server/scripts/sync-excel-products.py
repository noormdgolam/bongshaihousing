import os
import json
import pandas as pd

excel_path = r'C:\Users\munna\Downloads\Floor area.XLSX'
xls = pd.ExcelFile(excel_path)

# 1. Parse Sheet8
sheet8_df = pd.read_excel(excel_path, sheet_name='Sheet8')
model_pricing = {}
for idx, row in sheet8_df.iterrows():
    m = row.iloc[0]
    area = row.iloc[1]
    price = row.iloc[2]
    if pd.notna(m) and str(m).strip() != 'Model No':
        m_code = str(m).strip().replace('Model No-', '').replace('Model No', '').strip()
        model_pricing[m_code.upper()] = {
            'model_number': m_code,
            'area_sqft': int(area),
            'fixed_price': int(price),
            'price_per_sqft': round(int(price) / int(area), 2)
        }

print(f'Parsed {len(model_pricing)} models from Sheet8')

# 2. Parse room sheets
def parse_room_sheet(sheet_name):
    df = pd.read_excel(excel_path, sheet_name=sheet_name)
    rooms = []
    # Identify header row
    start_idx = 0
    for idx, row in df.iterrows():
        txt = str(row.iloc[0]).lower()
        if 'section' in txt or 'overview' in txt or 'details' in txt:
            start_idx = idx + 1
    
    current_floor = None
    for idx in range(start_idx, len(df)):
        row = df.iloc[idx]
        section = row.iloc[0]
        area = row.iloc[1]
        length = row.iloc[2] if len(row) > 2 else None
        width = row.iloc[3] if len(row) > 3 else None
        
        if pd.isna(section) and pd.isna(area):
            continue
            
        sec_str = str(section).strip() if pd.notna(section) else ''
        if 'MATERIALS SPECIFICATION' in sec_str or 'Category:' in sec_str:
            break
            
        if sec_str in ['Ground Floor', 'First floor', 'First Floor']:
            current_floor = sec_str
            rooms.append({
                'floor': current_floor,
                'section': f'<b>{sec_str}</b>',
                'length': '',
                'width': '',
                'area': '',
                'is_header': True
            })
            continue
            
        if 'total' in sec_str.lower() or (pd.isna(section) and pd.notna(area)):
            total_val = int(area) if pd.notna(area) and str(area).replace('.','').isdigit() else area
            rooms.append({
                'floor': current_floor,
                'section': f'<b>Total ({current_floor or "Building"})</b>',
                'length': '',
                'width': '',
                'area': f'<b>{total_val}</b>',
                'is_total': True
            })
            continue
            
        area_num = float(area) if pd.notna(area) and str(area).replace('.','').isdigit() else (int(area) if isinstance(area, (int, float)) and not pd.isna(area) else None)
        len_num = float(length) if pd.notna(length) and str(length).replace('.','').isdigit() else (int(length) if isinstance(length, (int, float)) and not pd.isna(length) else '')
        wid_num = float(width) if pd.notna(width) and str(width).replace('.','').isdigit() else (int(width) if isinstance(width, (int, float)) and not pd.isna(width) else '')
        
        rooms.append({
            'floor': current_floor,
            'section': sec_str,
            'length': len_num if len_num != '' else '',
            'width': wid_num if wid_num != '' else '',
            'area': int(area_num) if area_num is not None and area_num == int(area_num) else (area_num or '')
        })
    return rooms

sheets_data = {}
for s in xls.sheet_names:
    if s == 'Sheet8': continue
    sheets_data[s] = parse_room_sheet(s)

print(f'Parsed {len(sheets_data)} detail sheets')

# Helper to summarize bed, bath, kitchen, living counts
def compute_counts(rooms):
    bed_count = 0
    bath_count = 0
    kitchen_count = 0
    living_count = 0
    drawing_count = 0
    for r in rooms:
        sec = r['section'].lower()
        if 'master bed' in sec or 'bed room' in sec or 'child bed' in sec or 'bed' in sec and 'drawing' not in sec:
            bed_count += 1
        elif 'bath' in sec or 'toilet' in sec or 'washroom' in sec:
            bath_count += 1
        elif 'kitchen' in sec:
            kitchen_count += 1
        elif 'living' in sec:
            living_count += 1
        elif 'drawing' in sec:
            drawing_count += 1
            
    return {
        'bed': f'{bed_count} Bedrooms' if bed_count > 0 else '1 Bedroom',
        'bath': f'{bath_count} Bathrooms' if bath_count > 1 else ('1 Bathroom' if bath_count == 1 else '1 Bathroom'),
        'living': f'{living_count} Living Room' if living_count > 0 else ('1 Living Room' if drawing_count > 0 else 'N/A'),
        'drawing': f'{drawing_count} Drawing Room' if drawing_count > 0 else 'N/A',
        'dining': 'N/A',
        'kitchen': f'{kitchen_count} Kitchens' if kitchen_count > 1 else ('1 Kitchen' if kitchen_count == 1 else '1 Kitchen')
    }

# 3. Load existing products.json
products_json_path = os.path.join(os.path.dirname(__file__), '..', 'db', 'seeds', 'data', 'products.json')
with open(products_json_path, 'r', encoding='utf-8') as f:
    products = json.load(f)

# Sheet selection logic based on area and category
def select_room_sheet(category_slug, area_sqft):
    # Duplex / Triplex categories
    is_multistory = category_slug in ['duplex-steel-building', 'apartment-building', 'steel-house']
    if is_multistory:
        # Match duplex sheet
        if area_sqft >= 1800:
            return '900D' # 900D is ~1800-1900 sqft duplex (924+936)
        elif area_sqft >= 1600:
            return '800D' # 800D is ~1600 sqft duplex (806+806)
        elif area_sqft >= 1200:
            return '600D' # 600D is ~1200 sqft duplex (616+616)
        elif area_sqft >= 1000:
            return '500D' # 500D is ~1000 sqft duplex (462+462)
        else:
            return '400D' # 400D is ~800 sqft duplex (440+440)
    else:
        # Simplex categories
        candidates = [1200, 1050, 900, 850, 800, 700, 600, 550, 400, 320]
        closest = min(candidates, key=lambda c: abs(c - area_sqft))
        return str(closest)

updated_count = 0
for p in products:
    m_num = (p.get('modelNumber') or p.get('filename', '').replace('.html', '')).upper()
    if m_num in model_pricing:
        mp = model_pricing[m_num]
        area = mp['area_sqft']
        price = mp['fixed_price']
        
        p['fixedPrice'] = price
        p['totalFloorArea'] = area
        p['pricePerSqft'] = mp['price_per_sqft']
        
        sheet_key = select_room_sheet(p['categorySlug'], area)
        raw_rooms = sheets_data.get(sheet_key, sheets_data['600'])
        counts = compute_counts(raw_rooms)
        
        # Format rooms
        formatted_rooms = []
        for r in raw_rooms:
            formatted_rooms.append({
                'section': r['section'],
                'length': r['length'],
                'width': r['width'],
                'area': r['area']
            })
            
        # Single designated variant key!
        p['floorData'] = {
            str(area): {
                'bed': counts['bed'],
                'bath': counts['bath'],
                'living': counts['living'],
                'drawing': counts['drawing'],
                'dining': counts['dining'],
                'kitchen': counts['kitchen'],
                'sheetSource': sheet_key,
                'rooms': formatted_rooms
            }
        }
        updated_count += 1

print(f'Successfully updated {updated_count} models in products dataset.')

# Save updated products.json
with open(products_json_path, 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print('Saved products.json cleanly!')
