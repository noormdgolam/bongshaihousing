import re

with open(r"e:\web\Bongshaihousing\solutions.html", "r", encoding="utf-8") as f:
    template = f.read()

# Replace the HTML for the Property Type input
# We will replace <select id="calc1-type"> and its options with <select id="calc1-model">

old_html = """<label class="calc-label">Property Type</label>
        <select id="calc1-type" class="calc-input">
          <option value="2500" data-name="Low-Cost Villa">Low-Cost Villa (Standard)</option>
          <option value="3500" data-name="Duplex Villa">Duplex Villa (Premium)</option>
          <option value="1800" data-name="Industrial Shed">Industrial Shed</option>
        </select>"""

new_html = """<label class="calc-label">Select Model</label>
        <select id="calc1-model" class="calc-input">
          <!-- Options will be populated automatically by Javascript -->
        </select>"""

template = template.replace(old_html, new_html)


# Now update the JS logic for Cost Estimator
old_js = """  // Cost Estimator Logic
  function calculateCost() {
    const typeSelect = document.getElementById('calc1-type');
    const finishSelect = document.getElementById('calc1-finish');
    
    const baseRate = parseFloat(typeSelect.value);
    const modelName = typeSelect.options[typeSelect.selectedIndex].getAttribute('data-name');
    const sqft = parseFloat(document.getElementById('calc1-sqft').value) || 0;
    const finishMultiplier = parseFloat(finishSelect.value);
    const finishName = finishSelect.options[finishSelect.selectedIndex].getAttribute('data-name');
    
    const totalCost = baseRate * sqft * finishMultiplier;
    
    document.getElementById('calc1-result').innerText = 'BDT ' + formatBDT(totalCost);
    document.getElementById('c1-val-model').innerText = modelName;
    document.getElementById('c1-val-area').innerText = sqft + ' Sq.Ft';
    document.getElementById('c1-val-finish').innerText = finishName;
  }
  
  ['calc1-type', 'calc1-sqft', 'calc1-finish'].forEach(id => {
    document.getElementById(id).addEventListener('input', calculateCost);
    document.getElementById(id).addEventListener('change', calculateCost);
  });
  calculateCost();"""

new_js = """  // ==========================================
  // 🚀 BONGSHAI MODELS DATABASE
  // Add any new models here and they will instantly appear in the calculator dropdown!
  // ==========================================
  const BONGSHAI_MODELS = [
    { category: "Duplex Villa (Premium)", name: "Duplex Villa (650x2 Sq.Ft) - 4 Beds", baseRate: 3500, defaultArea: 1300 },
    { category: "Duplex Villa (Premium)", name: "Duplex Villa (750x2 Sq.Ft) - 4 Beds", baseRate: 3500, defaultArea: 1500 },
    { category: "Duplex Villa (Premium)", name: "Duplex Villa (950x2 Sq.Ft) - 6 Beds", baseRate: 3500, defaultArea: 1900 },
    { category: "Duplex Villa (Premium)", name: "Duplex Villa (1200x2 Sq.Ft) - 8 Beds", baseRate: 3500, defaultArea: 2400 },
    { category: "Low-Cost Villa (Standard)", name: "Low-Cost Villa (650 Sq.Ft)", baseRate: 2500, defaultArea: 650 },
    { category: "Low-Cost Villa (Standard)", name: "Low-Cost Villa (950 Sq.Ft)", baseRate: 2500, defaultArea: 950 },
    { category: "Commercial", name: "Industrial Shed (2000 Sq.Ft)", baseRate: 1800, defaultArea: 2000 }
  ];

  // Auto-populate the Model Dropdown
  const modelSelect = document.getElementById('calc1-model');
  const sqftInput = document.getElementById('calc1-sqft');
  
  if (modelSelect) {
    let currentCategory = "";
    let optgroup = null;
    
    BONGSHAI_MODELS.forEach((model, index) => {
      if (model.category !== currentCategory) {
        optgroup = document.createElement('optgroup');
        optgroup.label = model.category;
        modelSelect.appendChild(optgroup);
        currentCategory = model.category;
      }
      const option = document.createElement('option');
      option.value = index;
      option.text = model.name;
      optgroup.appendChild(option);
    });
    
    // When a model is selected, automatically update the Floor Area input
    modelSelect.addEventListener('change', function() {
      const selectedModel = BONGSHAI_MODELS[this.value];
      sqftInput.value = selectedModel.defaultArea;
      calculateCost();
    });
  }

  // Cost Estimator Logic
  function calculateCost() {
    if(!modelSelect) return;
    
    const finishSelect = document.getElementById('calc1-finish');
    const selectedModel = BONGSHAI_MODELS[modelSelect.value];
    
    const baseRate = selectedModel.baseRate;
    const modelName = selectedModel.name;
    const sqft = parseFloat(sqftInput.value) || 0;
    
    const finishMultiplier = parseFloat(finishSelect.value);
    const finishName = finishSelect.options[finishSelect.selectedIndex].getAttribute('data-name');
    
    const totalCost = baseRate * sqft * finishMultiplier;
    
    document.getElementById('calc1-result').innerText = 'BDT ' + formatBDT(totalCost);
    document.getElementById('c1-val-model').innerText = modelName;
    document.getElementById('c1-val-area').innerText = sqft + ' Sq.Ft';
    document.getElementById('c1-val-finish').innerText = finishName;
  }
  
  ['calc1-model', 'calc1-sqft', 'calc1-finish'].forEach(id => {
    const el = document.getElementById(id);
    if(el) {
      el.addEventListener('input', calculateCost);
      el.addEventListener('change', calculateCost);
    }
  });
  
  // Trigger initial calculation
  calculateCost();"""

template = template.replace(old_js, new_js)

with open(r"e:\web\Bongshaihousing\solutions.html", "w", encoding="utf-8") as f:
    f.write(template)

print("Updated solutions.html to use a dynamic JS model array.")
