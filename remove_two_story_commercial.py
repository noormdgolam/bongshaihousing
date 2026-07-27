import os
import glob
import re

def remove_two_story_from_commercial():
    html_files = glob.glob('*.html')
    print(f"Processing {len(html_files)} HTML files...")

    # Pattern for sidebar:
    # <a class="cat-item" href="two-story-building.html">Two Story Building...</a> under Commercial & Industrial
    sidebar_pattern = re.compile(
        r'(<div class="cat-group-label">Commercial &amp; Industrial</div>\s*)<a class="cat-item"[^>]*href="two-story-building\.html"[^>]*>.*?</a>\s*',
        re.DOTALL
    )

    updated_count = 0
    for file in html_files:
        with open(file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        new_content = sidebar_pattern.sub(r'\1', content)

        if new_content != content:
            with open(file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            updated_count += 1

    print(f"Successfully removed 'Two Story Building' from Commercial & Industrial section across {updated_count} HTML files.")

if __name__ == "__main__":
    remove_two_story_from_commercial()
