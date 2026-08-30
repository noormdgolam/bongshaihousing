import re, glob, json

# 1. Extract specs from bh-sb-*.html
data = {}
for i in range(301, 313):
    slug = f"bh-sb-{i}"
    filename = f"{slug}.html"
    try:
        with open(filename, "r", encoding="utf-8") as f:
            c = f.read()
        
        # model title
        m = re.search(r'<h1[^>]*>(.*?)</h1>', c, re.S)
        title = m.group(1).strip() if m else f"Model No-BH-SB-{i}"
        
        # specs
        area_m = re.search(r'(\d[\d,]*)\s*sq\.?ft', c, re.I)
        area = area_m.group(1) if area_m else "1,000"
        
        bed_m = re.search(r'(\d+)\s*Bedrooms?', c, re.I)
        beds = bed_m.group(1) if bed_m else "3"
        
        bath_m = re.search(r'(\d+)\s*Bathrooms?', c, re.I)
        baths = bath_m.group(1) if bath_m else "2"
        
        price_m = re.search(r'৳\s*([\d,]+)', c)
        price = price_m.group(1) if price_m else "25,00,000"
        
        desc_m = re.search(r'<meta name="description" content="([^"]+)"', c)
        desc = desc_m.group(1) if desc_m else f"Bongshai Housing BH-SB-{i} Simplex Steel Building with pre-engineered construction."
        # Shorten desc if needed
        if len(desc) > 160:
            desc = desc[:157] + "..."
            
        img = f"images/products/{slug}.webp"
        
        data[slug] = {
            "slug": slug,
            "name": f"Model No-BH-SB-{i}",
            "area": area,
            "beds": beds,
            "baths": baths,
            "price": price,
            "desc": desc,
            "img": img
        }
        print(f"Loaded {slug}: area={area} sqft, {beds} beds, {baths} baths, price=৳{price}")
    except Exception as e:
        print(f"Error reading {filename}: {e}")

print(f"Total simplex models loaded: {len(data)}")
