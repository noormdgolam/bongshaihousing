import os
import re

pattern = re.compile(r'\s*<div class="pd-trust-strip"[^>]*>[\s\S]*?</div>', re.MULTILINE)

modified_files = []

for root, dirs, files in os.walk('.'):
    # skip .git, node_modules
    if '.git' in root or 'node_modules' in root or '.gemini' in root:
        continue
    for f in files:
        if f.endswith('.html') or f.endswith('.njk'):
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as fp:
                content = fp.read()
            if 'pd-trust-strip' in content or 'Faster Than Traditional Brick' in content or 'BNBC Code Certified' in content:
                new_content = pattern.sub('', content)
                # also fallback cleanup for any remaining loose tags
                new_content = re.sub(r'\s*<span[^>]*>[^<]*3[×xX]\s*Faster Than Traditional Brick[^<]*</span>', '', new_content)
                new_content = re.sub(r'\s*<span[^>]*>[^<]*200\+\s*km/h Cyclone[^<]*</span>', '', new_content)
                new_content = re.sub(r'\s*<span[^>]*>[^<]*100%\s*BNBC Code Certified[^<]*</span>', '', new_content)
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as fp:
                        fp.write(new_content)
                    modified_files.append(filepath)

print(f'Successfully removed trust badges from {len(modified_files)} files.')
