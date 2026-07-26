import os
import re

categories = [
    {
        "index_name": "luxury-cottage-house.html",
        "title": "Luxury Cottage House",
        "prefix_upper": "BH-LCH",
        "prefix_lower": "bh-lch",
        "desc": "A premium luxury cottage house blending natural charm with modern elegance.",
        "start_num": 400
    },
    {
        "index_name": "container-house.html",
        "title": "Container House",
        "prefix_upper": "BH-CH",
        "prefix_lower": "bh-ch",
        "desc": "A robust and flexible container house providing cost-effective and swift accommodation.",
        "start_num": 500
    },
    {
        "index_name": "steel-house.html",
        "title": "Steel House",
        "prefix_upper": "BH-SH",
        "prefix_lower": "bh-sh",
        "desc": "A durable steel house engineered for quick assembly and structural resilience.",
        "start_num": 600
    },
    {
        "index_name": "tiny-house.html",
        "title": "Tiny House",
        "prefix_upper": "BH-TH",
        "prefix_lower": "bh-th",
        "desc": "An efficiently designed tiny house maximizing comfort and functionality in a compact space.",
        "start_num": 700
    }
]

placeholder_img = "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1024&q=80"

with open("single-story-building.html", "r", encoding="utf-8") as f:
    index_template = f.read()

with open("bh-sb-301.html", "r", encoding="utf-8") as f:
    inner_template = f.read()

for cat in categories:
    # 1. Create Index Page
    new_index = index_template
    
    # Replace global SEO/Titles
    new_index = new_index.replace("Single Story Steel Building", cat['title'])
    new_index = new_index.replace("Single story building", cat['title'])
    new_index = new_index.replace("Single Story Building", cat['title'])
    new_index = new_index.replace("single-story-building.html", cat['index_name'])
    
    # Replace the active category link logic for sidebar
    new_index = new_index.replace('class="cat-item active" href="single-story-building.html"', 'class="cat-item" href="single-story-building.html"')
    new_index = new_index.replace(f'class="cat-item" href="{cat["index_name"]}"', f'class="cat-item active" href="{cat["index_name"]}"')
    
    for i in range(1, 13):
        old_num = 300 + i
        new_num = cat['start_num'] + i
        
        # Replace the image src with placeholder
        old_img_str = f'src="images/products/bh-sb-{old_num}.png"'
        new_img_str = f'src="{placeholder_img}"'
        new_index = new_index.replace(old_img_str, new_img_str)
        
        # Replace the model ID and links
        new_index = new_index.replace(f'BH-SB-{old_num}', f'{cat["prefix_upper"]}-{new_num}')
        new_index = new_index.replace(f'bh-sb-{old_num}', f'{cat["prefix_lower"]}-{new_num}')
        
        # Replace the description in the card
        new_index = new_index.replace("A premium single story prefabricated building with a clean, modern view and an elegant walkway in front.", cat['desc'])
        
    with open(cat['index_name'], "w", encoding="utf-8") as f:
        f.write(new_index)
    print(f"Created {cat['index_name']}")
    
    # 2. Create 12 Inner Pages
    for i in range(1, 13):
        new_num = cat['start_num'] + i
        new_inner = inner_template
        
        # Replace SEO / Titles
        new_inner = new_inner.replace("Single Story Building", cat['title'])
        new_inner = new_inner.replace("Single Story Steel Building", cat['title'])
        new_inner = new_inner.replace("single-story-building.html", cat['index_name'])
        
        # Replace Model Identifiers
        new_inner = new_inner.replace("BH-SB-301", f'{cat["prefix_upper"]}-{new_num}')
        new_inner = new_inner.replace("bh-sb-301", f'{cat["prefix_lower"]}-{new_num}')
        
        # Replace JS ID references and logic numbers
        new_inner = new_inner.replace("301", str(new_num))
        
        # Replace Image src with placeholder
        new_inner = new_inner.replace('src="images/products/bh-sb-301.png"', f'src="{placeholder_img}"')
        
        # Restore active sidebar link
        new_inner = new_inner.replace('class="cat-item active" href="single-story-building.html"', 'class="cat-item" href="single-story-building.html"')
        new_inner = new_inner.replace(f'class="cat-item" href="{cat["index_name"]}"', f'class="cat-item active" href="{cat["index_name"]}"')
        
        inner_filename = f"{cat['prefix_lower']}-{new_num}.html"
        with open(inner_filename, "w", encoding="utf-8") as f:
            f.write(new_inner)
        print(f"Created {inner_filename}")
