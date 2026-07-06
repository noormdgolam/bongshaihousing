import glob
import os
import datetime

html_files = glob.glob(r"e:\web\Bongshaihousing\*.html")
today = datetime.datetime.now().strftime("%Y-%m-%d")

# Separate files into categories to assign priority
homepage = []
products = []
models = []
company = []
others = []

for file_path in html_files:
    basename = os.path.basename(file_path)
    url = f"https://ai.bongshai.com/{basename}"
    
    if basename == "index.html":
        homepage.append(url)
    elif basename in ["duplex-villa.html", "low-cost-villa.html", "luxury-villa.html", "industrial-sheds.html", "multi-story-homes.html", "container-house.html", "solutions.html"]:
        products.append(url)
    elif basename.startswith("dv-") or basename.startswith("lcv-"):
        models.append(url)
    elif basename in ["about.html", "contact.html", "career.html", "projects.html"]:
        company.append(url)
    else:
        others.append(url)

sitemap_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
sitemap_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

def add_url(loc, changefreq, priority):
    if "index.html" in loc:
        loc = loc.replace("index.html", "")
    return f"""  <url>
    <loc>{loc}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>{changefreq}</changefreq>
    <priority>{priority}</priority>
  </url>\n"""

# Homepage
for url in homepage:
    sitemap_content += add_url(url, "weekly", "1.0")

# Core Products
for url in products:
    sitemap_content += add_url(url, "weekly", "0.9")

# Individual Models
for url in models:
    sitemap_content += add_url(url, "monthly", "0.8")

# Company Pages
for url in company:
    sitemap_content += add_url(url, "monthly", "0.8")

# Other
for url in others:
    sitemap_content += add_url(url, "monthly", "0.6")

sitemap_content += '</urlset>'

with open(r"e:\web\Bongshaihousing\sitemap.xml", "w", encoding="utf-8") as f:
    f.write(sitemap_content)

print(f"Generated new sitemap.xml with {len(html_files)} URLs.")
