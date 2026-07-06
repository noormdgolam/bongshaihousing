import re

with open(r"e:\web\Bongshaihousing\solutions.html", "r", encoding="utf-8") as f:
    template = f.read()

# 1. Update Step 3 Badge to indicate it's optional
template = template.replace('<span class="step-badge" style="background: #10b981;">STEP 3</span>', '<span class="step-badge" style="background: #10b981;">STEP 3 (OPTIONAL)</span>')

# 2. Add Bank Loan Requirements below the EMI Calculator Left Side
bank_reqs_html = """
      <div style="margin-top: 40px; padding: 24px; background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.1); border-radius: 16px;">
        <h4 style="font-family: var(--font-heading); font-size: 1.2rem; color: #059669; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Bank Loan Requirements (Bangladesh)
        </h4>
        <ul style="color: var(--grey-600); font-size: 0.9rem; margin: 0; padding-left: 20px; line-height: 1.6;">
          <li><strong>Eligibility:</strong> Minimum monthly income BDT 30,000. 1-2 years work/business experience.</li>
          <li><strong>Personal:</strong> NID, E-TIN & Tax Return, Utility Bill, Photographs.</li>
          <li><strong>Financials:</strong> Salary Certificate (or Trade License), 6-12 months Bank Statement.</li>
          <li><strong>Property:</strong> Title Deed, Mutation, Up-to-date Land Tax, Approved Building Plan.</li>
          <li style="color: #059669; font-weight: 600; margin-top: 8px; list-style: none; margin-left: -20px;">*Bongshai Housing can assist you with property documentation for your loan application.</li>
        </ul>
      </div>
"""

# Find where to insert it on the left side. Let's insert it right after the range slider block
insert_target = """        <input type="range" id="calc2-tenure" min="1" max="25" value="15" oninput="document.getElementById('calc2-tenure-val').innerText = this.value + ' Years'; calculateEMI();" />
      </div>"""

if insert_target in template:
    template = template.replace(insert_target, insert_target + "\n" + bank_reqs_html)
else:
    print("Warning: Could not find insert target for bank requirements.")

# 3. Change button text from "Apply & Get PDF Quote" to "Get Free Quote"
template = template.replace('Apply & Get PDF Quote', 'Get Free Quote')

with open(r"e:\web\Bongshaihousing\solutions.html", "w", encoding="utf-8") as f:
    f.write(template)

print("Updated EMI section to be optional, added bank requirements, and updated button text.")
