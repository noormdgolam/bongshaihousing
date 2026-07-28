import os
import glob
import re

root_dir = r'e:\web\Bongshaihousing'
is_files = glob.glob(os.path.join(root_dir, 'bh-is-10*.html'))

for file in is_files:
    model_num = file.replace('e:\\web\\Bongshaihousing\\bh-is-', '').replace('.html', '')
    with open(file, 'r', encoding='utf-8', errors='ignore') as f:
        c = f.read()

    new_quick_specs_block = f'''<!-- 2. Horizontal Quick-Specs Bar -->
<div class="reveal-up" style="display: flex; flex-direction: column; gap: var(--space-5); background: var(--off-white); padding: var(--space-6); border-radius: 16px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); margin-bottom: var(--space-8); border: 1px solid var(--grey-200);">
  
  <!-- Row 1: Floor Area Selector -->
  <div style="display: flex; align-items: flex-start; gap: 12px; border-bottom: 1px solid var(--grey-200); padding-bottom: var(--space-4);">
    <span style="font-size: 1.5rem; margin-top: 4px;">📐</span>
    <div style="flex: 1;">
      <div style="font-size: 0.75rem; color: var(--grey-500); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px;">Select Floor Area</div>
      <div class="area-selector" id="area-selector-{model_num}">
<button type="button" class="area-btn active" onclick="selectArea('{model_num}', '650x2', this)">650x2 Sq.Ft</button>
<button type="button" class="area-btn " onclick="selectArea('{model_num}', '750x2', this)">750x2 Sq.Ft</button>
<button type="button" class="area-btn " onclick="selectArea('{model_num}', '950x2', this)">950x2 Sq.Ft</button>
<button type="button" class="area-btn " onclick="selectArea('{model_num}', '1200x2', this)">1200x2 Sq.Ft</button>
</div>
    </div>
  </div>
  
  <!-- Row 2: Secondary Specs -->
  <div style="display: flex; flex-wrap: wrap; gap: var(--space-4); justify-content: space-around;">
    <div style="display: flex; align-items: center; gap: 12px;">
<span style="font-size: 1.5rem;">🏗️</span>
<div><div style="font-size: 0.75rem; color: var(--grey-500); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Structure</div><div style="font-weight: 700; color: var(--grey-900); font-size: 1.05rem;">PEB Steel Frame</div></div>
</div>
    <div style="width: 1px; background: var(--grey-200);"></div>
    <div style="display: flex; align-items: center; gap: 12px;">
<span style="font-size: 1.5rem;">📏</span>
<div><div style="font-size: 0.75rem; color: var(--grey-500); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Clear Height</div><div style="font-weight: 700; color: var(--grey-900); font-size: 1.05rem;">24 - 32 Ft</div></div>
</div>
    <div style="width: 1px; background: var(--grey-200);"></div>
    <div style="display: flex; align-items: center; gap: 12px;">
<span style="font-size: 1.5rem;">🚛</span>
<div><div style="font-size: 0.75rem; color: var(--grey-500); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Access</div><div style="font-weight: 700; color: var(--grey-900); font-size: 1.05rem;">Loading Bay</div></div>
  </div>
</div>
</div>'''

    c = re.sub(
        r'<!-- 2\. Horizontal Quick-Specs Bar -->.*?<!-- 4\. Materials',
        new_quick_specs_block + '\n<!-- 4. Materials',
        c,
        flags=re.DOTALL
    )

    with open(file, 'w', encoding='utf-8') as f:
        f.write(c)

print(f"Cleaned and updated all {len(is_files)} Industrial Shed detail pages!")
