import glob
import os
import re

files = glob.glob(r"e:\web\Bongshaihousing\dv-*.html")

for file_path in files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Update default bath in Quick Specs
    content = re.sub(
        r'(<div id="spec-bath-101" style="font-weight: 700; color: var\(--grey-900\); font-size: 1.05rem;">)1 Room(</div>)',
        r'\g<1>2 Rooms\2',
        content
    )
    
    # Update default bath in Space Allocation List
    content = re.sub(
        r'(<span style="font-weight: 700; color: var\(--primary\); background: var\(--off-white\); padding: 4px 12px; border-radius: 20px;">)1 Room(</span></div>)',
        r'\g<1>2 Rooms\2',
        content
    )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Updated default specs for duplex villa models.")
