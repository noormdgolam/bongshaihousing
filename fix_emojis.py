import os
import re

html_file = r'e:\web\Bongshaihousing\single-story-building.html'
with open(html_file, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('???</span> 3 Bedrooms', '\U0001f6cf\ufe0f</span> 3 Bedrooms')
content = content.replace('??</span> 2 Bathrooms', '\U0001f6bf</span> 2 Bathrooms')
content = content.replace('??</span> Kitchen', '\U0001f373</span> Kitchen')

with open(html_file, 'w', encoding='utf-8') as f:
    f.write(content)

print('Emojis fixed successfully.')
