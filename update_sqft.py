import glob
import os
import re

files = glob.glob(r"e:\web\Bongshaihousing\dv-*.html")

options_find = """<option value="440">440 Sq.Ft</option>
<option value="550">550 Sq.Ft</option>
<option value="750">750 Sq.Ft</option>
<option value="950">950 Sq.Ft</option>
<option value="1200">1200 Sq.Ft</option>
<option value="1500">1500 Sq.Ft</option>
<option value="1800">1800 Sq.Ft</option>"""

options_replace = """<option value="650">650 Sq.Ft</option>
<option value="750">750 Sq.Ft</option>
<option value="950">950 Sq.Ft</option>
<option value="1200">1200 Sq.Ft</option>"""

for file_path in files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    content = content.replace(options_find, options_replace)
    
    def replacer(match):
        num = match.group(1)
        return f"""    const floorData{num} = {{
      "650": {{ bed: "2 Rooms", bath: "2 Rooms", dining: "Included", drawing: "N/A" }},
      "750": {{ bed: "2 Rooms", bath: "2 Rooms", dining: "1 Space", drawing: "1 Room" }},
      "950": {{ bed: "2 Rooms", bath: "2 Rooms", dining: "1 Space", drawing: "1 Room" }},
      "1200": {{ bed: "3 Rooms", bath: "3 Rooms", dining: "1 Space", drawing: "1 Room" }}
    }};"""

    pattern = re.compile(r'    const floorData(\d+) = \{\s+"440".*?\};', re.DOTALL)
    content = pattern.sub(replacer, content)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Updated sqft for duplex villa models.")
