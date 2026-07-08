import os

template_file = 'low-cost-villa.html'
with open(template_file, 'r', encoding='utf-8') as f:
    template_content = f.read()

pages_to_create = [
    {"filename": "two-story-building.html", "title": "Two Story Building"},
    {"filename": "cottage-house.html", "title": "Cottage House"},
    {"filename": "steel-house.html", "title": "Steel House"},
    {"filename": "tiny-house.html", "title": "Tiny House"},
    {"filename": "other-residential.html", "title": "Other Options"}
]

for page in pages_to_create:
    new_filename = page['filename']
    new_title = page['title']
    
    # Replace the text "Low-Cost Villa" with the new title
    # We'll use case-sensitive replacement for the main heading/title
    new_content = template_content.replace('Low-Cost Villa', new_title)
    
    # Replace active sidebar item. 
    # The template 'low-cost-villa.html' currently has something like:
    # <a class="cat-item active" href="low-cost-villa.html">Low-Cost Villa...
    # But wait, we already updated ALL files with the new categories!
    # So `low-cost-villa.html` already has the new categories in the sidebar and navbar!
    # And in the sidebar, we already ran the update script which puts `active` correctly if the filename matches.
    # But since we are copying from low-cost-villa.html, the copy will not have the correct active class.
    # The active class update logic we had: 
    # it finds class="cat-item" href="filename" and makes it active.
    
    # Let's remove the active class from wherever it is in the sidebar:
    new_content = new_content.replace('class="cat-item active"', 'class="cat-item"')
    
    # And add the active class to the current page:
    new_content = new_content.replace(f'class="cat-item" href="{new_filename}"', f'class="cat-item active" href="{new_filename}"')
    
    # The breadcrumb might say `Low-Cost Villa`, which we already replaced with `new_title`.
    # Let's also replace `<span aria-current="page">Low-Cost Villa</span>` just in case it didn't match perfectly.
    # But string replace 'Low-Cost Villa' -> new_title handles it.

    with open(new_filename, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Created {new_filename}")

print("Done creating pages.")
