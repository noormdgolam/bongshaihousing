import re

file_path = r"e:\web\Bongshaihousing\solutions.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace input/select inline styles to enforce white background and dark text
# Current pattern: border: 1px solid var(--grey-300);
# Or we can just insert `background: #ffffff; color: var(--grey-800); ` right before `width: 100%;`

content = content.replace('style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--grey-300);',
                          'style="background: #ffffff; color: #1e293b; width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--grey-300);')

# Also for the slider: style="width: 100%; cursor: pointer;"
content = content.replace('style="width: 100%; cursor: pointer;"',
                          'style="background: transparent; color: #1e293b; width: 100%; cursor: pointer;"')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed visibility styling for inputs in solutions.html.")
