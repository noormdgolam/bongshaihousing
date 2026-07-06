import glob
import re

files = glob.glob(r"e:\web\Bongshaihousing\dv-*.html")

options_find = """<option value="650">650 Sq.Ft</option>
<option value="750">750 Sq.Ft</option>
<option value="950">950 Sq.Ft</option>
<option value="1200">1200 Sq.Ft</option>"""

options_replace = """<option value="650x2">650x2 Sq.Ft</option>
<option value="750x2">750x2 Sq.Ft</option>
<option value="950x2">950x2 Sq.Ft</option>
<option value="1200x2">1200x2 Sq.Ft</option>"""

for file_path in files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Replace options
    content = content.replace(options_find, options_replace)
    
    # Replace floorData keys
    content = content.replace('"650": {', '"650x2": {')
    content = content.replace('"750": {', '"750x2": {')
    content = content.replace('"950": {', '"950x2": {')
    content = content.replace('"1200": {', '"1200x2": {')

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Updated duplex villa floor areas to x2 format.")
