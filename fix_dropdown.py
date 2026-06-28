import os
import glob

for filepath in glob.glob('*.html'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Fix desktop wrapper visibility bug
    old_desktop_div = '<div class="dropdown" role="menu" style="position:relative; margin-right:1rem; display:flex; align-items:center;">'
    new_desktop_div = '<div class="lang-selector-wrap" role="menu" style="position:relative; margin-right:1rem; display:flex; align-items:center;">'
    content = content.replace(old_desktop_div, new_desktop_div)
    
    # Fix the JS query selector which relied on '.dropdown > .btn-outline'
    old_js = "var desktopDropdown = document.querySelector('.dropdown > .btn-outline');"
    new_js = "var desktopDropdown = document.querySelector('.lang-selector-wrap > .btn-outline');"
    content = content.replace(old_js, new_js)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Visibility fix complete.")
