import os
import glob
import re

def fix_card_nesting_proper():
    files = ['tiny-house.html', 'wooden-house.html']
    for file in files:
        if os.path.exists(file):
            with open(file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Pattern inside property-card-body:
            # <div class="property-specs">...spec-items...</div>\n<a class="btn...

            # Currently <a class="btn...> is placed inside <div class="property-specs">, we want:
            # <div class="property-specs">\n<div...1 Bedroom</div>\n<div...1 Bathroom</div>\n<div...350 / 440 Sq.Ft</div>\n</div>\n<a class="btn...
            pattern = re.compile(
                r'<div class="property-specs">\s*(<div class="spec-item">.*?</div>\s*<div class="spec-item">.*?</div>\s*<div class="spec-item">.*?</div>)\s*(<a class="btn btn-primary"[^>]*>.*?</a>)\s*</div></div>',
                re.DOTALL
            )
            replacement = r'<div class="property-specs">\n\1\n</div>\n\2\n</div></div>'

            updated = pattern.sub(replacement, content)

            if updated != content:
                with open(file, 'w', encoding='utf-8') as f:
                    f.write(updated)
                print(f"Fixed property card structure properly in {file}.")

if __name__ == "__main__":
    fix_card_nesting_proper()
