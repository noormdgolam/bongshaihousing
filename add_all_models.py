import re

file_path = 'low-cost-villa.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Generate the HTML for all 9 models
models_html = ""
for i in range(1, 10):
    model_num = f"10{i}"
    models_html += f"""
          <div class="property-card reveal" style="--i:{i-1}">
            <div class="property-img-wrap" style="height:220px;background:linear-gradient(135deg,var(--primary),var(--primary-light));display:flex;align-items:center;justify-content:center">
              <div style="text-align:center;color:white">
                <div style="font-size:3.5rem;margin-bottom:var(--space-3)">🏡</div>
                <div style="font-size:var(--fs-lg);font-weight:700;font-family:var(--font-heading)">Model LCV-{model_num}</div>
              </div>
            </div>
            <div class="property-card-body">
              <span class="property-type">Low Cost Villa</span>
              <h3 class="property-name">Model LCV-{model_num}</h3>
              <p class="property-desc">Affordable luxury for families. This sub-model offers practical living space with premium finishes.</p>
              <div class="property-specs">
                <div class="spec-item"><span class="spec-icon" aria-hidden="true">🛏️</span> 2 Bedrooms</div>
                <div class="spec-item"><span class="spec-icon" aria-hidden="true">🚿</span> 1 Bathroom</div>
                <div class="spec-item"><span class="spec-icon" aria-hidden="true">🍳</span> Kitchen</div>
              </div>
              <a href="lcv-{model_num}.html" class="btn btn-primary" style="width:100%;justify-content:center;">View Details</a>
            </div>
          </div>
"""

# Replace the existing grid content
# Find the start of the grid
start_tag = '<div class="properties-grid stagger">'
end_tag = '        </div>\n      </div>\n    </section>\n\n    <!-- ======================================================\n         CALL TO ACTION'

# We'll use regex to replace everything between start_tag and end_tag
pattern = re.compile(re.escape(start_tag) + r'.*?(?=        </div>\n      </div>\n    </section>\n\n    <!-- ======================================================\n         CALL TO ACTION)', re.DOTALL)

new_content = pattern.sub(start_tag + '\n' + models_html + '\n', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Updated low-cost-villa.html to list all 9 models.")
