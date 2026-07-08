import os
import re
import glob

def update_files():
    html_files = glob.glob('*.html')

    dropdown_pattern = re.compile(
        r'(<div style="padding:var\(--space-2\) var\(--space-3\) 0;font-size:0\.7rem;font-weight:700;color:var\(--grey-500\);text-transform:uppercase;">Residential Prefab</div>).*?(<div style="padding:var\(--space-3\) var\(--space-3\) 0;font-size:0\.7rem;font-weight:700;color:var\(--grey-500\);text-transform:uppercase;border-top:1px solid var\(--grey-100\);">Commercial &amp; Industrial</div>)',
        re.DOTALL
    )

    dropdown_replacement = r'''\1
            <a href="two-story-building.html" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">
              <div class="dropdown-icon" style="font-size:1.2rem;">🏢</div>
              <div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Two story building</strong></div>
            </a>
            <a href="single-story-building.html" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">
              <div class="dropdown-icon" style="font-size:1.2rem;">🏠</div>
              <div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Single story building</strong></div>
            </a>
            <a href="cottage-house.html" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">
              <div class="dropdown-icon" style="font-size:1.2rem;">🏡</div>
              <div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Cottage house</strong></div>
            </a>
            <a href="steel-house.html" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">
              <div class="dropdown-icon" style="font-size:1.2rem;">🏗️</div>
              <div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Steel house</strong></div>
            </a>
            <a href="container-house.html" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">
              <div class="dropdown-icon" style="font-size:1.2rem;">📦</div>
              <div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Container house</strong></div>
            </a>
            <a href="tiny-house.html" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">
              <div class="dropdown-icon" style="font-size:1.2rem;">🛖</div>
              <div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Tiny house</strong></div>
            </a>
            <a href="other-residential.html" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">
              <div class="dropdown-icon" style="font-size:1.2rem;">✨</div>
              <div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Other Options</strong></div>
            </a>
            \2'''

    sidebar_pattern = re.compile(
        r'(<div class="cat-group-label">Residential Prefab</div>).*?(<div class="cat-group-label">Commercial &amp; Industrial</div>)',
        re.DOTALL
    )

    sidebar_replacement = r'''\1
          <a class="cat-item" href="two-story-building.html">Two story building<svg class="cat-chevron" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></a>
          <a class="cat-item" href="single-story-building.html">Single story building<svg class="cat-chevron" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></a>
          <a class="cat-item" href="cottage-house.html">Cottage house<svg class="cat-chevron" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></a>
          <a class="cat-item" href="steel-house.html">Steel house<svg class="cat-chevron" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></a>
          <a class="cat-item" href="container-house.html">Container house<svg class="cat-chevron" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></a>
          <a class="cat-item" href="tiny-house.html">Tiny house<svg class="cat-chevron" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></a>
          <a class="cat-item" href="other-residential.html">Other Options<svg class="cat-chevron" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg></a>
          \2'''

    for file in html_files:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()

        new_content = dropdown_pattern.sub(dropdown_replacement, content)
        new_content = sidebar_pattern.sub(sidebar_replacement, new_content)

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
