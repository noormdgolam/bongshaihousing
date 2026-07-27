import os
import glob
import re

def fix_card_nesting():
    files = ['tiny-house.html', 'wooden-house.html']
    for file in files:
        if os.path.exists(file):
            with open(file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Fix </div></div> placed before <a class="btn... inside property-card
            # Incorrect pattern:
            # </div>\n</div>\n<a class="btn btn-primary"...>View Details</a>\n</div></div>
            # Correct pattern:
            # <a class="btn btn-primary"...>View Details</a>\n</div></div>
            bad_pattern = re.compile(r'</div>\s*</div>\s*(<a class="btn btn-primary"[^>]*>.*?</a>)\s*</div></div>', re.DOTALL)
            good_replacement = r'\1\n</div></div>'

            updated = bad_pattern.sub(good_replacement, content)

            if updated != content:
                with open(file, 'w', encoding='utf-8') as f:
                    f.write(updated)
                print(f"Fixed property card HTML structure in {file}.")

if __name__ == "__main__":
    fix_card_nesting()
