import re

filename = 'lcv-101.html'

with open(filename, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace images
# Replace main image
content = re.sub(r'src="images/user-cottage-1-clean\.png"', 'src="images/cottage-exterior.png"', content)
# Replace floor plan image
content = re.sub(r'src="images/3d-image\.jpg"', 'src="images/cottage-plan.png"', content)

# Remove the two smaller thumbnail images since we only have one exterior image now
content = re.sub(r'<div style="display: grid; grid-template-columns: 1fr 1fr; gap: var\(--space-4\);">.*?</div>', '', content, flags=re.DOTALL)

# Update floor plan descriptions based on the provided image
floor_plan_html = """<div class="reveal-left" style="background: white; padding: var(--space-6); border-radius: 16px; box-shadow: var(--shadow-md);">
              <h3 style="color: var(--primary); margin-bottom: var(--space-6); font-family: var(--font-heading); font-size: 1.5rem;">Space Allocation</h3>
              <div style="display: flex; flex-direction: column; gap: var(--space-3); font-size: 0.95rem;">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;">
                  <span style="color: var(--grey-600); font-weight: 500;">Bed Room 01</span>
                  <span style="color: var(--grey-900); font-weight: 700;">10 ft × 11 ft</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;">
                  <span style="color: var(--grey-600); font-weight: 500;">Bed Room 02</span>
                  <span style="color: var(--grey-900); font-weight: 700;">10 ft × 9 ft</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;">
                  <span style="color: var(--grey-600); font-weight: 500;">Dining Room</span>
                  <span style="color: var(--grey-900); font-weight: 700;">Included</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;">
                  <span style="color: var(--grey-600); font-weight: 500;">Kitchen</span>
                  <span style="color: var(--grey-900); font-weight: 700;">Included</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;">
                  <span style="color: var(--grey-600); font-weight: 500;">Toilet</span>
                  <span style="color: var(--grey-900); font-weight: 700;">Included</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--grey-600); font-weight: 500;">Veranda</span>
                  <span style="color: var(--grey-900); font-weight: 700;">Included</span>
                </div>
              </div>
            </div>"""

content = re.sub(r'<div class="reveal-left" style="background: white; padding: var\(--space-6\); border-radius: 16px; box-shadow: var\(--shadow-md\);">.*?</div>', floor_plan_html, content, count=1, flags=re.DOTALL)

with open(filename, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Updated {filename} with new images and floor plan description.")
