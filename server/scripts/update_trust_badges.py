import os
import re

old_block_pattern = re.compile(
    r'<div class="pd-trust-strip" style="margin-bottom: 16px;">\s*'
    r'<span>⚡ 45–60 day build</span>\s*'
    r'<span>🛡️ Earthquake resistant</span>\s*'
    r'<span>🌪️ 200\+ km/h wind rated</span>\s*'
    r'</div>',
    re.DOTALL
)

new_block = '''<div class="pd-trust-strip" style="margin-bottom: 16px; display: flex; flex-direction: column; gap: 8px;">
  <span style="display: inline-flex; align-items: center; gap: 8px; padding: 7px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.86rem; font-weight: 600; color: #334155; cursor: default;" title="Precision prefabricated steel modules cut construction time by 65% compared to conventional brick/masonry.">⚡ 3× Faster Than Traditional Brick</span>
  <span style="display: inline-flex; align-items: center; gap: 8px; padding: 7px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.86rem; font-weight: 600; color: #334155; cursor: default;" title="Engineered with seismic damping and aerodynamic structural steel for extreme weather resilience.">🛡️ 200+ km/h Cyclone &amp; Quake Proof</span>
  <span style="display: inline-flex; align-items: center; gap: 8px; padding: 7px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.86rem; font-weight: 600; color: #334155; cursor: default;" title="100% compliant with structural and safety standards of the Bangladesh National Building Code.">📐 100% BNBC Code Certified</span>
</div>'''

html_files = [f for f in os.listdir('.') if f.endswith('.html')]
updated = 0

for f in html_files:
    with open(f, 'r', encoding='utf-8') as fp:
        content = fp.read()
    
    if old_block_pattern.search(content):
        new_content = old_block_pattern.sub(new_block, content)
        with open(f, 'w', encoding='utf-8') as fp:
            fp.write(new_content)
        updated += 1

print(f'Successfully updated {updated} static HTML product files with new trust badges!')
