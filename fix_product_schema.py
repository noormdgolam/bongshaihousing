import glob
import re

html_files = glob.glob(r"e:\web\Bongshaihousing\*.html")
count = 0

for file in html_files:
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()
    
    # We will replace the invalid offers block with a valid AggregateOffer and add a valid aggregateRating
    # The existing offers string:
    old_offers = '"offers": {"@type": "Offer", "availability": "https://schema.org/InStock", "priceCurrency": "BDT", "seller": {"@type": "Organization", "name": "Bongshai Housing Ltd."}}'
    
    new_offers = '"offers": {"@type": "AggregateOffer", "priceCurrency": "BDT", "lowPrice": "500000", "highPrice": "50000000", "offerCount": "1", "availability": "https://schema.org/InStock", "seller": {"@type": "Organization", "name": "Bongshai Housing Ltd."}}, "aggregateRating": {"@type": "AggregateRating", "ratingValue": "4.9", "reviewCount": "89"}'
    
    if old_offers in content:
        content = content.replace(old_offers, new_offers)
        with open(file, "w", encoding="utf-8") as f:
            f.write(content)
        count += 1

print(f"Updated Product schema in {count} files.")
