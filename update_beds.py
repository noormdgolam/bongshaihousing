import glob
import re

files = glob.glob(r"e:\web\Bongshaihousing\dv-*.html")

for file_path in files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Update floorData keys
    content = content.replace('"650x2": { bed: "2 Rooms",', '"650x2": { bed: "4 Rooms",')
    content = content.replace('"750x2": { bed: "2 Rooms",', '"750x2": { bed: "4 Rooms",')
    content = content.replace('"950x2": { bed: "2 Rooms",', '"950x2": { bed: "6 Rooms",')
    content = content.replace('"1200x2": { bed: "3 Rooms",', '"1200x2": { bed: "8 Rooms",')

    # Update quick spec HTML for Bedrooms
    content = re.sub(
        r'(<div id="spec-bed-\d+" [^>]*>)2 Rooms(</div>)',
        r'\g<1>4 Rooms\2',
        content
    )

    # Update space allocation HTML for Bedrooms
    content = re.sub(
        r'(<span[^>]*>▪</span>Bedrooms</span><span[^>]*>)2 Rooms(</span></div>)',
        r'\g<1>4 Rooms\2',
        content
    )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Updated bedroom counts for duplex villas.")
