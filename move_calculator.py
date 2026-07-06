import glob
import os
import re

files = glob.glob(r"e:\web\Bongshaihousing\*.html")

for file_path in files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Clean up old top-level links created in previous script
    content = re.sub(r'<a class="nav-link(?: active)?" href="solutions\.html">Solutions</a>\s*', '', content)
    content = re.sub(r'<a class="mobile-nav-link(?: active)?" href="solutions\.html">Solutions</a>\s*', '', content)
    
    # Update footer link text
    content = content.replace('<li><a href="solutions.html">Calculators</a></li>', '<li><a href="solutions.html">Calculator</a></li>')

    # 2. Insert into Desktop Dropdown (if not already there)
    if 'href="solutions.html" class="dropdown-item"' not in content:
        desktop_dropdown_pattern = r'(<div><strong style="display:block;font-size:0\.8rem;color:var\(--primary\)">Security Kiosks</strong></div>\s*</a>\s*)(</div>)'
        
        desktop_dropdown_insert = r'\1<div style="padding:var(--space-3) var(--space-3) 0;font-size:0.7rem;font-weight:700;color:var(--grey-500);text-transform:uppercase;border-top:1px solid var(--grey-100);">Interactive Tools</div>\n            <a href="solutions.html" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">\n              <div class="dropdown-icon" style="font-size:1.2rem;">🧮</div>\n              <div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Calculator</strong></div>\n            </a>\n          \2'
        
        content = re.sub(desktop_dropdown_pattern, desktop_dropdown_insert, content)

    # 3. Insert into Mobile Dropdown (if not already there)
    if 'href="solutions.html" class="mobile-sub-link"' not in content:
        mobile_dropdown_pattern = r'(<a href="security-kiosks\.html" class="mobile-sub-link">.*?Security Kiosks</a>\s*)(</div>)'
        
        mobile_dropdown_insert = r'\1<div style="padding:var(--space-2) 0 0;font-size:0.7rem;font-weight:700;color:var(--grey-500);text-transform:uppercase;">Interactive Tools</div>\n          <a href="solutions.html" class="mobile-sub-link">🧮 Calculator</a>\n        \2'
        
        content = re.sub(mobile_dropdown_pattern, mobile_dropdown_insert, content)

    # 4. Insert into Sidebar (if the file has a sidebar and it's not already there)
    if 'class="cat-sidebar"' in content and 'href="solutions.html">Calculator<svg' not in content:
        sidebar_pattern = r'(<a class="cat-item" href="security-kiosks\.html">Security Kiosks<svg.*?</svg></a>\s*)(<div class="cat-group-label">Security &amp; Guard Units</div>)'
        
        sidebar_insert = r'\1<div class="cat-group-label">Interactive Tools</div>\n<a class="cat-item" href="solutions.html">Calculator<svg class="cat-chevron" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></a>\n\2'
        
        content = re.sub(sidebar_pattern, sidebar_insert, content)
        
    # 5. Fix solutions.html title and text
    if file_path.endswith("solutions.html"):
        content = content.replace('Interactive Solutions & Calculators - Bongshai Housing', 'Calculator - Bongshai Housing')
        content = content.replace('Solutions &amp; Calculators', 'Calculator')
        content = content.replace('<span aria-current="page">Solutions</span>', '<span aria-current="page">Calculator</span>')
        content = content.replace('<span class="page-hero-label">Interactive Tools</span>', '<span class="page-hero-label">Interactive Calculator</span>')

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Updated navigation to move Calculator to dropdowns and removed top-level links.")
