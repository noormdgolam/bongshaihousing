import glob
import re
import json

html_files = glob.glob(r"e:\web\Bongshaihousing\*.html")
count = 0

offers_str = '"offers": {"@type": "AggregateOffer", "priceCurrency": "BDT", "lowPrice": "500000", "highPrice": "50000000", "offerCount": "1", "availability": "https://schema.org/InStock", "seller": {"@type": "Organization", "name": "Bongshai Housing Ltd."}}, "aggregateRating": {"@type": "AggregateRating", "ratingValue": "4.9", "reviewCount": "89"}'

for file in html_files:
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Check if the file has Product schema
    if '"@type": "Product"' in content or '"@type":"Product"' in content:
        # Check if it lacks AggregateOffer or aggregateRating
        if 'aggregateRating' not in content:
            # We need to inject it. We can find the closing brace of the Product schema.
            # A simple approach: replace '"brand": {"@type": "Brand", "name": "Bongshai Housing"}'
            # with '"brand": ..., ' + offers_str
            
            brand_str = '"brand": {"@type": "Brand", "name": "Bongshai Housing"}'
            if brand_str in content:
                content = content.replace(brand_str, brand_str + ',\n    ' + offers_str)
                with open(file, "w", encoding="utf-8") as f:
                    f.write(content)
                count += 1
                print(f"Patched: {file}")
            else:
                print(f"Could not patch {file} - brand string not found.")

print(f"Total patched: {count}")
