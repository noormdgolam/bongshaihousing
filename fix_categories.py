import os
import re
import glob

def update_files():
    html_files = glob.glob('*.html')

    # 1. Desktop Dropdown Menu
    dropdown_pattern = re.compile(
        r'(<div style="padding:var\(--space-2\) var\(--space-3\) 0;font-size:0\.7rem;font-weight:700;color:var\(--grey-500\);text-transform:uppercase;">Residential Prefab</div>).*?(<div style="padding:var\(--space-3\) var\(--space-3\) 0;font-size:0\.7rem;font-weight:700;color:var\(--grey-500\);text-transform:uppercase;border-top:1px solid var\(--grey-100\);">Commercial &amp; Industrial</div>)',
        re.DOTALL
    )
    dropdown_replacement = r'''\1
            <a href="two-story-building.html" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">
              <div class="dropdown-icon" style="font-size:1.2rem;">🏢</div>
              <div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Two story building</strong></div>
            </a>
            <a href="duplex-villa.html" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">
              <div class="dropdown-icon" style="font-size:1.2rem;">🏘️</div>
              <div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Duplex villa</strong></div>
            </a>
            <a href="single-story-building.html" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">
              <div class="dropdown-icon" style="font-size:1.2rem;">🏠</div>
              <div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Single story building</strong></div>
            </a>
            <a href="luxury-cottage-house.html" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">
              <div class="dropdown-icon" style="font-size:1.2rem;">🏡</div>
              <div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Luxury cottage house</strong></div>
            </a>
            <a href="container-house.html" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">
              <div class="dropdown-icon" style="font-size:1.2rem;">📦</div>
              <div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Container house</strong></div>
            </a>
            <a href="steel-house.html" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">
              <div class="dropdown-icon" style="font-size:1.2rem;">🏗️</div>
              <div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Steel house</strong></div>
            </a>
            <a href="tiny-house.html" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">
              <div class="dropdown-icon" style="font-size:1.2rem;">🛖</div>
              <div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Tiny house</strong></div>
            </a>
            <a href="wooden-house.html" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">
              <div class="dropdown-icon" style="font-size:1.2rem;">🪵</div>
              <div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Wooden House</strong></div>
            </a>
            <a href="concrete-building.html" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">
              <div class="dropdown-icon" style="font-size:1.2rem;">🏢</div>
              <div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Concrete building</strong></div>
            </a>
            \2'''

    # 2. Sidebar Menu
    sidebar_pattern = re.compile(
        r'(<div class="cat-group-label">Residential Prefab</div>).*?(<div class="cat-group-label">Commercial &amp; Industrial</div>)',
        re.DOTALL
    )
    sidebar_replacement = r'''\1
          <a class="cat-item" href="two-story-building.html">Two story building<svg class="cat-chevron" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></a>
          <a class="cat-item" href="duplex-villa.html">Duplex villa<svg class="cat-chevron" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></a>
          <a class="cat-item" href="single-story-building.html">Single story building<svg class="cat-chevron" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></a>
          <a class="cat-item" href="luxury-cottage-house.html">Luxury cottage house<svg class="cat-chevron" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></a>
          <a class="cat-item" href="container-house.html">Container house<svg class="cat-chevron" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></a>
          <a class="cat-item" href="steel-house.html">Steel house<svg class="cat-chevron" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></a>
          <a class="cat-item" href="tiny-house.html">Tiny house<svg class="cat-chevron" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></a>
          <a class="cat-item" href="wooden-house.html">Wooden House<svg class="cat-chevron" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></a>
          <a class="cat-item" href="concrete-building.html">Concrete building<svg class="cat-chevron" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></a>
          \2'''

    # 3. Mobile Drawer Menu
    mobile_pattern = re.compile(
        r'(<div style="padding:var\(--space-2\) 0 0;font-size:0\.7rem;font-weight:700;color:var\(--grey-500\);text-transform:uppercase;">Residential</div>).*?(<div style="padding:var\(--space-2\) 0 0;font-size:0\.7rem;font-weight:700;color:var\(--grey-500\);text-transform:uppercase;">Commercial</div>)',
        re.DOTALL
    )
    mobile_replacement = r'''\1
<a class="mobile-sub-link" href="two-story-building.html">🏢 Two story building</a>
<a class="mobile-sub-link" href="duplex-villa.html">🏘️ Duplex villa</a>
<a class="mobile-sub-link" href="single-story-building.html">🏠 Single story building</a>
<a class="mobile-sub-link" href="luxury-cottage-house.html">🏡 Luxury cottage house</a>
<a class="mobile-sub-link" href="container-house.html">📦 Container house</a>
<a class="mobile-sub-link" href="steel-house.html">🏗️ Steel house</a>
<a class="mobile-sub-link" href="tiny-house.html">🛖 Tiny house</a>
<a class="mobile-sub-link" href="wooden-house.html">🪵 Wooden House</a>
<a class="mobile-sub-link" href="concrete-building.html">🏢 Concrete building</a>
\2'''

    for file in html_files:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()

        new_content = dropdown_pattern.sub(dropdown_replacement, content)
        new_content = sidebar_pattern.sub(sidebar_replacement, new_content)
        new_content = mobile_pattern.sub(mobile_replacement, new_content)

        # Restore active class based on file name
        file_basename = os.path.basename(file)
        if 'class="cat-item" href="' + file_basename + '"' in new_content:
            new_content = new_content.replace(
                'class="cat-item" href="' + file_basename + '"',
                'class="cat-item active" href="' + file_basename + '"'
            )

        if new_content != content:
            with open(file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'Updated {file}')

if __name__ == "__main__":
    update_files()
