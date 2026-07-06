import glob
import re
import os

html_files = glob.glob(r"e:\web\Bongshaihousing\*.html")

for file_path in html_files:
    basename = os.path.basename(file_path)
    
    if basename == "index.html":
        correct_url = "https://bongshaihousing.com/"
    else:
        correct_url = f"https://bongshaihousing.com/{basename}"
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 1. Replace Canonical
    # Match both <link rel="canonical" href="..." /> and <link href="..." rel="canonical"/>
    canonical_pattern = r'<link[^>]+canonical[^>]+>'
    new_canonical = f'<link rel="canonical" href="{correct_url}" />'
    content = re.sub(canonical_pattern, new_canonical, content)
    
    # 2. Replace og:url
    # Match both <meta property="og:url" content="..." /> and <meta content="..." property="og:url"/>
    og_url_pattern = r'<meta[^>]+property=["\']og:url["\'][^>]*>|<meta[^>]+content=["\'][^"\']+["\'][^>]+property=["\']og:url["\'][^>]*>'
    # A simpler og:url pattern matching either property="og:url" inside a meta tag
    og_url_pattern_simple = r'<meta[^>]+og:url[^>]+>'
    new_og_url = f'<meta property="og:url" content="{correct_url}" />'
    content = re.sub(og_url_pattern_simple, new_og_url, content)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

print(f"Fixed canonical and og:url in {len(html_files)} files.")
