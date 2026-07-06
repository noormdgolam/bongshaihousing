import glob
import re

files = glob.glob(r"e:\web\Bongshaihousing\dv-*.html")

new_html = """<!-- 4. Materials & Finishes (Table) -->
<div class="reveal-up" style="background: white; padding: var(--space-6); border-radius: 16px; box-shadow: var(--shadow-sm); border: 1px solid var(--grey-100); margin-bottom: var(--space-8);">
<h3 style="font-family: var(--font-heading); font-size: 1.4rem; color: var(--primary-dark); margin-bottom: 24px; border-bottom: 2px solid var(--off-white); padding-bottom: 12px;">Building Specifications</h3>
<div style="overflow-x: auto;">
  <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem; text-align: left;">
    <thead>
      <tr style="background: var(--primary); color: white;">
        <th style="padding: 12px 16px; font-weight: 700; border-top-left-radius: 8px;">Item</th>
        <th style="padding: 12px 16px; font-weight: 700; border-top-right-radius: 8px;">Materials</th>
      </tr>
    </thead>
    <tbody style="color: var(--grey-800);">
      <tr style="border-bottom: 1px solid var(--grey-100);">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark); width: 30%;">FOOTING</td>
        <td style="padding: 12px 16px;">Precast RC footing &amp; Tie beam with 2200 psi concrete.</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--grey-100); background: #f8fafc;">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark);">LIGHT STEEL STRUCTURE</td>
        <td style="padding: 12px 16px;">Column, rafter, purlin and others member made of MS steel grade SS400, strength 250 Mpa</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--grey-100);">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark);">GROUND FLOOR</td>
        <td style="padding: 12px 16px;">3’’ thickness cement concrete.</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--grey-100); background: #f8fafc;">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark);">OUTER WALL</td>
        <td style="padding: 12px 16px;">2.5’’ thickness RC precast concrete panel</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--grey-100);">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark);">INNER WALL</td>
        <td style="padding: 12px 16px;">2’’ thickness RC precast concrete panel</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--grey-100); background: #f8fafc;">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark);">MIDDLE &amp; ROOF FLOOR</td>
        <td style="padding: 12px 16px;">3’’ thickness RC precast concrete panel</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--grey-100);">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark);">DOOR</td>
        <td style="padding: 12px 16px;">7’x3.5’ steel frame with wooden shutter</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--grey-100); background: #f8fafc;">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark);">TOILET &amp; KITCHEN DOOR</td>
        <td style="padding: 12px 16px;">7’x2.5’ PVC frame with PVC shutter</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--grey-100);">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark);">WINDOW</td>
        <td style="padding: 12px 16px;">5’x4.5’ Thai frame, Glass shutter with Grill</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--grey-100); background: #f8fafc;">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark);">FLOOR FINISHING</td>
        <td style="padding: 12px 16px;">16''x16'' Tiles</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--grey-100);">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark);">PAINT</td>
        <td style="padding: 12px 16px;">Weather coat and plastic paint</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--grey-100); background: #f8fafc;">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark);">ROOF TOP</td>
        <td style="padding: 12px 16px;">1’’ cement mortar finishing</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--grey-100);">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark);">BATHROOM FITTING</td>
        <td style="padding: 12px 16px;">Metal fittings</td>
      </tr>
      <tr style="background: #f8fafc;">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark); border-bottom-left-radius: 8px;">ELECTRIC WIRING</td>
        <td style="padding: 12px 16px; border-bottom-right-radius: 8px;">3 bulb, 1 fan point, 3 power sockets in each room. BRB cable is to be used.</td>
      </tr>
    </tbody>
  </table>
</div>
</div>"""

pattern = re.compile(r'<!-- 4\. Materials & Finishes \(3-Column Grid\) -->.*?</div>\s*<script>', re.DOTALL)

for file_path in files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    content = pattern.sub(new_html + '\n<script>', content)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Updated Building Specifications table in duplex villas.")
