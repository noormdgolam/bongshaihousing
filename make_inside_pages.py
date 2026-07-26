import os
import re

template_file = 'dv-101.html'
with open(template_file, 'r', encoding='utf-8') as f:
    template_content = f.read()

serials = [str(i) for i in range(301, 313)]

for serial in serials:
    new_content = template_content
    # Replace texts
    new_content = new_content.replace('Model DV-101', f'Model No-BH-SB-{serial}')
    new_content = new_content.replace('DV-101', f'BH-SB-{serial}')
    new_content = new_content.replace('dv-101', f'bh-sb-{serial}')
    new_content = new_content.replace('101', serial)
    new_content = new_content.replace('Duplex Villa', 'Single Story Building')
    
    # Optional SEO and minor fixes
    new_content = new_content.replace('Low-Cost Steel Prefab Villa', 'Single Story Steel Building')
    
    # Save the file
    out_file = f'bh-sb-{serial}.html'
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f'Created {out_file}')

# Update single-story-building.html links
index_file = 'single-story-building.html'
with open(index_file, 'r', encoding='utf-8') as f:
    index_content = f.read()

# I need to replace href="#" with href="bh-sb-{serial}.html" for each property card
# Let's match the blocks
def repl_href(match):
    serial = match.group(1)
    # The matched group is the serial, we want to replace the href="#" in this card
    # Wait, the match object will give us the serial, but we need to replace the exact href="#" in that block.
    return match.group(0)

# A simpler way is to split the content by property-card, find the serial, and replace href="#"
parts = index_content.split('<div class="property-card reveal"')
for i in range(1, len(parts)):
    # Find the serial in this part
    match = re.search(r'Model No-BH-SB-(\d+)', parts[i])
    if match:
        serial = match.group(1)
        # replace href="#" with href="bh-sb-XXX.html"
        parts[i] = parts[i].replace('href="#"', f'href="bh-sb-{serial}.html"')

new_index_content = '<div class="property-card reveal"'.join(parts)

with open(index_file, 'w', encoding='utf-8') as f:
    f.write(new_index_content)

print('Updated single-story-building.html links')
