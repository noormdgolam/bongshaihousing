import re

with open(r"e:\web\Bongshaihousing\solutions.html", "r", encoding="utf-8") as f:
    template = f.read()

# 1. Remove the button from Step 3
button_html = '<button class="calc-btn" onclick="openConsultationModal()" style="background: #10b981; box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);">Get Free Quote</button>'
template = template.replace(button_html, '')

# 2. Add the button to Step 2. We'll replace the "Status" block with the button, or put it right below.
# The step 2 status block:
step2_status = """        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 20px; border-radius: 12px;">
          <div style="font-size: 0.75rem; color: var(--grey-400); text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px;">Status</div>
          <div style="color: var(--white); font-weight: 500; font-size: 0.95rem; line-height: 1.5;">This cost has been pushed to Step 3.</div>
        </div>"""

new_step2_block = """        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; margin-bottom: 24px;">
          <div style="font-size: 0.75rem; color: var(--grey-400); text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px;">Status</div>
          <div style="color: var(--white); font-weight: 500; font-size: 0.95rem; line-height: 1.5;">This cost has been pushed to Step 3 (Optional).</div>
        </div>
        <button class="calc-btn" onclick="openConsultationModal()" style="background: var(--primary); box-shadow: 0 10px 20px rgba(30, 64, 175, 0.3); margin-top: 0;">Get Free Quote</button>"""

if step2_status in template:
    template = template.replace(step2_status, new_step2_block)
else:
    print("Warning: Could not find step 2 status block to insert the button.")

with open(r"e:\web\Bongshaihousing\solutions.html", "w", encoding="utf-8") as f:
    f.write(template)

print("Moved Get Free Quote button from Step 3 to Step 2.")
