import re

with open(r"e:\web\Bongshaihousing\contact.html", "r", encoding="utf-8") as f:
    template = f.read()

# 1. Replace the upazila select with an input
old_upazila = """                <div class="form-group">
                  <label class="form-label" for="upazila">Police Station *</label>
                  <select id="upazila" name="upazila" class="form-control" required>
                    <option value="">Select Station</option>
                  </select>
                </div>"""

new_upazila = """                <div class="form-group">
                  <label class="form-label" for="upazila">Police Station / Thana *</label>
                  <input type="text" id="upazila" name="upazila" class="form-control" placeholder="e.g., Uttara, Gulshan" required />
                </div>"""

if old_upazila in template:
    template = template.replace(old_upazila, new_upazila)
else:
    print("Warning: Could not find old upazila block.")

# 2. Remove the onchange handler from district select
old_district_select = '<select id="district" name="district" class="form-control" required onchange="loadUpazilas(this.value)">'
new_district_select = '<select id="district" name="district" class="form-control" required>'
template = template.replace(old_district_select, new_district_select)

# 3. Remove the loadUpazilas function from JS
js_pattern = re.compile(r'function loadUpazilas\(dist\).*?\}\s*\}\);\s*\}', re.DOTALL)
template = re.sub(js_pattern, '', template)

with open(r"e:\web\Bongshaihousing\contact.html", "w", encoding="utf-8") as f:
    f.write(template)

print("Successfully replaced upazila select with text input and cleaned up JS.")
