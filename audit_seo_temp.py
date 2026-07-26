import os
import glob
import re
import json

directory = r"c:\Users\Maria\Documents\WEB\BONGSHAI HOUSING"
html_files = glob.glob(os.path.join(directory, "*.html"))

audit_results = {
    "missing_title": [],
    "long_title": [],
    "short_title": [],
    "missing_meta_desc": [],
    "long_meta_desc": [],
    "short_meta_desc": [],
    "missing_h1": [],
    "multiple_h1": [],
    "missing_canonical": [],
    "missing_og_tags": [],
    "images_missing_alt": {}
}

for file_path in html_files:
    basename = os.path.basename(file_path)
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    # Title
    title_match = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE | re.DOTALL)
    if not title_match:
        audit_results["missing_title"].append(basename)
    else:
        title = title_match.group(1).strip()
        if len(title) > 60:
            audit_results["long_title"].append(basename)
        elif len(title) < 30:
            audit_results["short_title"].append(basename)

    # Meta Description
    desc_match = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']', content, re.IGNORECASE)
    if not desc_match:
        # Check reverse order
        desc_match = re.search(r'<meta[^>]*content=["\'](.*?)["\'][^>]*name=["\']description["\']', content, re.IGNORECASE)
        
    if not desc_match:
        audit_results["missing_meta_desc"].append(basename)
    else:
        desc = desc_match.group(1).strip()
        if len(desc) > 160:
            audit_results["long_meta_desc"].append(basename)
        elif len(desc) < 50:
            audit_results["short_meta_desc"].append(basename)

    # H1
    h1_matches = re.findall(r'<h1[^>]*>(.*?)</h1>', content, re.IGNORECASE | re.DOTALL)
    if len(h1_matches) == 0:
        audit_results["missing_h1"].append(basename)
    elif len(h1_matches) > 1:
        audit_results["multiple_h1"].append(basename)

    # Canonical
    canonical_match = re.search(r'<link[^>]*rel=["\']canonical["\'][^>]*>', content, re.IGNORECASE)
    if not canonical_match:
        audit_results["missing_canonical"].append(basename)

    # Open Graph
    og_title_match = re.search(r'<meta[^>]*property=["\']og:title["\']', content, re.IGNORECASE)
    if not og_title_match:
        audit_results["missing_og_tags"].append(basename)

    # Image Alt
    img_tags = re.findall(r'<img([^>]*)>', content, re.IGNORECASE)
    missing_alt_count = 0
    for img in img_tags:
        if 'alt=' not in img.lower() or 'alt=""' in img.lower() or "alt=''" in img.lower():
            missing_alt_count += 1
    if missing_alt_count > 0:
        audit_results["images_missing_alt"][basename] = missing_alt_count

# Summary
print(f"Total HTML files audited: {len(html_files)}")
print(f"Missing Titles: {len(audit_results['missing_title'])}")
print(f"Long Titles (>60): {len(audit_results['long_title'])}")
print(f"Short Titles (<30): {len(audit_results['short_title'])}")
print(f"Missing Meta Descriptions: {len(audit_results['missing_meta_desc'])}")
print(f"Long Meta Desc (>160): {len(audit_results['long_meta_desc'])}")
print(f"Short Meta Desc (<50): {len(audit_results['short_meta_desc'])}")
print(f"Missing H1: {len(audit_results['missing_h1'])}")
print(f"Multiple H1: {len(audit_results['multiple_h1'])}")
print(f"Missing Canonical Tags: {len(audit_results['missing_canonical'])}")
print(f"Missing Open Graph Tags: {len(audit_results['missing_og_tags'])}")
images_without_alt_pages = len(audit_results['images_missing_alt'])
print(f"Pages with missing Image Alt Tags: {images_without_alt_pages}")

# Output to JSON for further processing
with open(os.path.join(directory, "seo_audit_results_temp.json"), "w") as f:
    json.dump(audit_results, f, indent=4)
