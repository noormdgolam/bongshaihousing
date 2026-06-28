import os, glob, re

for filepath in glob.glob('*.html'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove Desktop Dropdown (two possible classes)
    content = re.sub(r'<!-- Language Dropdown -->.*?</div>\s*</div>', '', content, flags=re.DOTALL)
    content = re.sub(r'<div class="lang-selector-wrap".*?</div>\s*</div>', '', content, flags=re.DOTALL)
    content = re.sub(r'<div class="dropdown" role="menu" style="position:relative; margin-right:1rem; display:flex; align-items:center;">.*?</div>\s*</div>', '', content, flags=re.DOTALL)

    # 2. Remove Mobile Dropdown
    content = re.sub(r'<div style="margin-bottom:var\(--space-3\);">\s*<button class="btn btn-outline" style="width:100%; justify-content:space-between; padding:var\(--space-3\);" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display===\'block\'\?\'none\':\'block\'">\s*<span>🌐 <span id="mobile-lang-text".*?</div>\s*</div>', '', content, flags=re.DOTALL)
    
    # Another variation in case it was modified
    content = re.sub(r'<div style="margin-bottom:var\(--space-3\);">.*?<span id="mobile-lang-text".*?</div>\s*</div>', '', content, flags=re.DOTALL)

    # 3. Remove Modal
    content = re.sub(r'<!-- Language Selection Modal -->.*?</div>\s*</div>\s*</div>', '', content, flags=re.DOTALL)
    # Also variation without the comment
    content = re.sub(r'<div class="lang-modal-overlay" id="langModal">.*?</div>\s*</div>\s*</div>', '', content, flags=re.DOTALL)

    # 4. Remove Google Translate and Scripts at end of body
    content = re.sub(r'<!-- ======================================================\s*GOOGLE TRANSLATE & IP AUTO-SELECTION\s*====================================================== -->.*?(?=</body>)', '', content, flags=re.DOTALL)
    content = re.sub(r'<div id="google_translate_element" style="display:none;"></div>.*?(?=</body>)', '', content, flags=re.DOTALL)

    # Cleanup some extra whitespaces
    content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Cleaned', filepath)
