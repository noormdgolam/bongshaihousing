import glob
import os

files = glob.glob(r"e:\web\Bongshaihousing\*.html")

desktop_nav_search = '<a class="nav-link" href="contact.html">Contact</a>'
desktop_nav_replace = '<a class="nav-link" href="solutions.html">Solutions</a>\n            <a class="nav-link" href="contact.html">Contact</a>'

mobile_nav_search = '<a class="mobile-nav-link" href="contact.html">Contact</a>'
mobile_nav_replace = '<a class="mobile-nav-link" href="solutions.html">Solutions</a>\n        <a class="mobile-nav-link" href="contact.html">Contact</a>'

footer_nav_search = '<li><a href="contact.html">Contact Us</a></li>'
footer_nav_replace = '<li><a href="solutions.html">Calculators</a></li>\n              <li><a href="contact.html">Contact Us</a></li>'

for file_path in files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Apply replacements
    content = content.replace(desktop_nav_search, desktop_nav_replace)
    content = content.replace(mobile_nav_search, mobile_nav_replace)
    content = content.replace(footer_nav_search, footer_nav_replace)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

print(f"Updated navigation with Solutions link in {len(files)} files.")
