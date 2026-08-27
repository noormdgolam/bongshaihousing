with open('apartment-building.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
parts = text.split('<div class="property-card')
print('Total parts:', len(parts))
for i, part in enumerate(parts[1:5]):
    print(f'--- Part {i+1} ---')
    m = re.search(r'Model\s*No-([A-Z0-9-]+)', part, re.IGNORECASE)
    print('Regex match:', m.groups() if m else 'None')
    print('First 150 chars:', repr(part[:150]))
