import glob

html_files = glob.glob(r"e:\web\Bongshaihousing\*.html")
missing = []

for file in html_files:
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()
    
    if '"@type": "Product"' in content or '"@type":"Product"' in content:
        if 'aggregateRating' not in content:
            missing.append(file)

print(f"Files missing aggregateRating: {missing}")
