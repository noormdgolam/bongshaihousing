import re

template_file = r"e:\web\Bongshaihousing\duplex-villa.html"

with open(template_file, "r", encoding="utf-8") as f:
    html = f.read()

# The content starts after <div class="page-sidebar-content"> and ends before <!-- /page-sidebar-content -->
# We will replace the inner content with our calculators HTML.
content_html = """
<!-- 1. Hero Title -->
<div class="reveal-up" style="text-align: center; margin-bottom: var(--space-8);">
  <h1 style="font-family: var(--font-heading); font-size: 2.8rem; color: var(--primary-dark); margin-bottom: 16px;">Interactive Solutions</h1>
  <p style="color: var(--grey-600); font-size: 1.1rem; max-width: 600px; margin: 0 auto; line-height: 1.6;">
    Use our premium calculators to instantly estimate your construction costs, plan your financing, and determine the perfect plot size for your dream home in Bangladesh.
  </p>
</div>

<div style="display: flex; flex-direction: column; gap: var(--space-8);">

  <!-- CALCULATOR 1: Cost Estimator -->
  <div class="reveal-up" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: var(--shadow-xl); border: 1px solid var(--grey-100); display: flex; flex-wrap: wrap;">
    <div style="flex: 1 1 300px; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); padding: var(--space-8); color: white; display: flex; flex-direction: column; justify-content: center;">
      <h2 style="font-family: var(--font-heading); font-size: 2rem; margin-bottom: 16px; color: white;">Cost Estimator</h2>
      <p style="font-size: 1.05rem; opacity: 0.9; line-height: 1.6; margin-bottom: 24px;">Get a highly accurate, instant estimate for your pre-fabricated home. Select your desired model and size to see the total cost.</p>
      <div style="font-size: 3rem;">🏗️</div>
    </div>
    <div style="flex: 2 1 400px; padding: var(--space-8); background: #f8fafc;">
      <div style="display: grid; gap: 20px;">
        <div>
          <label style="display: block; font-weight: 700; color: var(--grey-800); margin-bottom: 8px;">Property Type</label>
          <select id="calc1-type" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--grey-300); font-size: 1rem; outline: none;">
            <option value="2500">Low-Cost Villa (Standard)</option>
            <option value="3500">Duplex Villa (Premium)</option>
            <option value="1800">Industrial Shed</option>
          </select>
        </div>
        <div>
          <label style="display: block; font-weight: 700; color: var(--grey-800); margin-bottom: 8px;">Floor Area (Sq.Ft)</label>
          <input type="number" id="calc1-sqft" value="650" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--grey-300); font-size: 1rem; outline: none; box-sizing: border-box;" />
        </div>
        <div>
          <label style="display: block; font-weight: 700; color: var(--grey-800); margin-bottom: 8px;">Finish Quality</label>
          <select id="calc1-finish" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--grey-300); font-size: 1rem; outline: none;">
            <option value="1">Standard Finishing</option>
            <option value="1.2">Luxury Finishing (+20%)</option>
          </select>
        </div>
        
        <div style="margin-top: 16px; background: white; padding: 24px; border-radius: 12px; border: 1px solid var(--primary-light); box-shadow: var(--shadow-sm); text-align: center;">
          <div style="font-size: 0.9rem; color: var(--grey-500); text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px;">Estimated Total Cost</div>
          <div id="calc1-result" style="font-size: 2.5rem; font-weight: 800; color: var(--primary); font-family: var(--font-heading);">BDT 0</div>
          <div style="font-size: 0.85rem; color: var(--grey-500); margin-top: 8px;">*Excludes land price and registration fees.</div>
        </div>
      </div>
    </div>
  </div>

  <!-- CALCULATOR 2: EMI Calculator -->
  <div class="reveal-up" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: var(--shadow-xl); border: 1px solid var(--grey-100); display: flex; flex-wrap: wrap; flex-direction: row-reverse;">
    <div style="flex: 1 1 300px; background: linear-gradient(135deg, #10b981, #047857); padding: var(--space-8); color: white; display: flex; flex-direction: column; justify-content: center;">
      <h2 style="font-family: var(--font-heading); font-size: 2rem; margin-bottom: 16px; color: white;">EMI Calculator</h2>
      <p style="font-size: 1.05rem; opacity: 0.9; line-height: 1.6; margin-bottom: 24px;">Plan your finances with ease. Calculate your estimated monthly installments based on current Bangladeshi bank rates.</p>
      <div style="font-size: 3rem;">💰</div>
    </div>
    <div style="flex: 2 1 400px; padding: var(--space-8); background: #f8fafc;">
      <div style="display: grid; gap: 20px;">
        <div>
          <label style="display: block; font-weight: 700; color: var(--grey-800); margin-bottom: 8px;">Total Property Cost (BDT)</label>
          <input type="number" id="calc2-cost" value="5000000" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--grey-300); font-size: 1rem; outline: none; box-sizing: border-box;" />
        </div>
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div style="flex: 1;">
            <label style="display: block; font-weight: 700; color: var(--grey-800); margin-bottom: 8px;">Down Payment (%)</label>
            <input type="number" id="calc2-down" value="20" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--grey-300); font-size: 1rem; outline: none; box-sizing: border-box;" />
          </div>
          <div style="flex: 1;">
            <label style="display: block; font-weight: 700; color: var(--grey-800); margin-bottom: 8px;">Interest Rate (%)</label>
            <input type="number" id="calc2-rate" value="9" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--grey-300); font-size: 1rem; outline: none; box-sizing: border-box;" />
          </div>
        </div>
        <div>
          <label style="display: block; font-weight: 700; color: var(--grey-800); margin-bottom: 8px;">Loan Tenure (Years)</label>
          <input type="range" id="calc2-tenure" min="1" max="25" value="15" style="width: 100%; cursor: pointer;" oninput="document.getElementById('calc2-tenure-val').innerText = this.value + ' Years'" />
          <div id="calc2-tenure-val" style="text-align: right; font-weight: 700; color: var(--primary); margin-top: 4px;">15 Years</div>
        </div>
        
        <div style="margin-top: 16px; background: white; padding: 24px; border-radius: 12px; border: 1px solid #a7f3d0; box-shadow: var(--shadow-sm); text-align: center;">
          <div style="font-size: 0.9rem; color: var(--grey-500); text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px;">Monthly EMI</div>
          <div id="calc2-result" style="font-size: 2.5rem; font-weight: 800; color: #047857; font-family: var(--font-heading);">BDT 0</div>
          <div style="font-size: 0.85rem; color: var(--grey-500); margin-top: 8px;" id="calc2-loan-amount">Loan Amount: BDT 0</div>
        </div>
      </div>
    </div>
  </div>

  <!-- CALCULATOR 3: Land Size & Fit -->
  <div class="reveal-up" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: var(--shadow-xl); border: 1px solid var(--grey-100); display: flex; flex-wrap: wrap;">
    <div style="flex: 1 1 300px; background: linear-gradient(135deg, #f59e0b, #b45309); padding: var(--space-8); color: white; display: flex; flex-direction: column; justify-content: center;">
      <h2 style="font-family: var(--font-heading); font-size: 2rem; margin-bottom: 16px; color: white;">Land Fit Calculator</h2>
      <p style="font-size: 1.05rem; opacity: 0.9; line-height: 1.6; margin-bottom: 24px;">Not sure what you can build on your plot? Enter your land size in local units to see the maximum house footprint allowed by building codes.</p>
      <div style="font-size: 3rem;">🏞️</div>
    </div>
    <div style="flex: 2 1 400px; padding: var(--space-8); background: #f8fafc;">
      <div style="display: grid; gap: 20px;">
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div style="flex: 2;">
            <label style="display: block; font-weight: 700; color: var(--grey-800); margin-bottom: 8px;">Your Land Size</label>
            <input type="number" id="calc3-land" value="3" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--grey-300); font-size: 1rem; outline: none; box-sizing: border-box;" />
          </div>
          <div style="flex: 1;">
            <label style="display: block; font-weight: 700; color: var(--grey-800); margin-bottom: 8px;">Unit</label>
            <select id="calc3-unit" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--grey-300); font-size: 1rem; outline: none;">
              <option value="720">Katha</option>
              <option value="435.6">Decimal</option>
            </select>
          </div>
        </div>
        <div>
          <label style="display: block; font-weight: 700; color: var(--grey-800); margin-bottom: 8px;">Rajuk/Local Setback Rule (Open Space %)</label>
          <select id="calc3-rule" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--grey-300); font-size: 1rem; outline: none;">
            <option value="0.35">35% Open Space (Standard City)</option>
            <option value="0.40">40% Open Space (Large Plot)</option>
            <option value="0.25">25% Open Space (Rural/Suburb)</option>
          </select>
        </div>
        
        <div style="margin-top: 16px; background: white; padding: 24px; border-radius: 12px; border: 1px solid #fde68a; box-shadow: var(--shadow-sm); text-align: center;">
          <div style="font-size: 0.9rem; color: var(--grey-500); text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px;">Maximum Ground Coverage (Sq.Ft)</div>
          <div id="calc3-result" style="font-size: 2.5rem; font-weight: 800; color: #b45309; font-family: var(--font-heading);">0 Sq.Ft</div>
          <div style="font-size: 0.85rem; color: var(--grey-500); margin-top: 8px;" id="calc3-recommendation">Recommendation: -</div>
        </div>
      </div>
    </div>
  </div>

</div>

<script>
  function formatBDT(number) {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(number);
  }

  // Cost Estimator Logic
  function calculateCost() {
    const baseRate = parseFloat(document.getElementById('calc1-type').value);
    const sqft = parseFloat(document.getElementById('calc1-sqft').value) || 0;
    const finishMultiplier = parseFloat(document.getElementById('calc1-finish').value);
    
    // For Duplex, usually floor area means ground floor x2, but here we assume the user enters the total sqft they are buying
    // In our models, a 650x2 means 1300 sqft total.
    const totalCost = baseRate * sqft * finishMultiplier;
    document.getElementById('calc1-result').innerText = 'BDT ' + formatBDT(totalCost);
  }
  
  ['calc1-type', 'calc1-sqft', 'calc1-finish'].forEach(id => {
    document.getElementById(id).addEventListener('input', calculateCost);
    document.getElementById(id).addEventListener('change', calculateCost);
  });
  calculateCost();

  // EMI Calculator Logic
  function calculateEMI() {
    const totalCost = parseFloat(document.getElementById('calc2-cost').value) || 0;
    const downPercent = parseFloat(document.getElementById('calc2-down').value) || 0;
    const rateYearly = parseFloat(document.getElementById('calc2-rate').value) || 0;
    const years = parseFloat(document.getElementById('calc2-tenure').value) || 1;
    
    const downPayment = totalCost * (downPercent / 100);
    const loanAmount = totalCost - downPayment;
    
    document.getElementById('calc2-loan-amount').innerText = 'Loan Amount: BDT ' + formatBDT(loanAmount) + ' | Down Payment: BDT ' + formatBDT(downPayment);
    
    if (loanAmount <= 0) {
      document.getElementById('calc2-result').innerText = 'BDT 0';
      return;
    }
    
    if (rateYearly === 0) {
      const emi = loanAmount / (years * 12);
      document.getElementById('calc2-result').innerText = 'BDT ' + formatBDT(emi);
      return;
    }

    const r = rateYearly / 12 / 100;
    const n = years * 12;
    const emi = (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    
    document.getElementById('calc2-result').innerText = 'BDT ' + formatBDT(emi);
  }

  ['calc2-cost', 'calc2-down', 'calc2-rate', 'calc2-tenure'].forEach(id => {
    document.getElementById(id).addEventListener('input', calculateEMI);
    document.getElementById(id).addEventListener('change', calculateEMI);
  });
  calculateEMI();

  // Land Fit Logic
  function calculateLand() {
    const landSize = parseFloat(document.getElementById('calc3-land').value) || 0;
    const unitSqft = parseFloat(document.getElementById('calc3-unit').value);
    const openSpaceRule = parseFloat(document.getElementById('calc3-rule').value);
    
    const totalSqft = landSize * unitSqft;
    const maxCoverage = totalSqft * (1 - openSpaceRule);
    
    document.getElementById('calc3-result').innerText = formatBDT(maxCoverage) + ' Sq.Ft';
    
    let rec = "";
    if (maxCoverage < 400) {
      rec = "Too small for our standard models. Consider our Container Houses.";
    } else if (maxCoverage < 700) {
      rec = "Perfect for a 650 Sq.Ft Low-Cost Villa or small Duplex.";
    } else if (maxCoverage < 1000) {
      rec = "Great for our 750 or 950 Sq.Ft Duplex Villa models.";
    } else {
      rec = "Spacious plot! You can comfortably build our 1200 Sq.Ft Luxury Duplex.";
    }
    document.getElementById('calc3-recommendation').innerText = "Recommendation: " + rec;
  }
  
  ['calc3-land', 'calc3-unit', 'calc3-rule'].forEach(id => {
    document.getElementById(id).addEventListener('input', calculateLand);
    document.getElementById(id).addEventListener('change', calculateLand);
  });
  calculateLand();

</script>
"""

# Replace content
new_html_content = re.sub(
    r'<div class="page-sidebar-content">.*?<!-- /page-sidebar-content -->', 
    f'<div class="page-sidebar-content">\n{content_html}\n<!-- /page-sidebar-content -->', 
    html, 
    flags=re.DOTALL
)

# Update page title
new_html_content = new_html_content.replace("<title>Duplex Villa", "<title>Interactive Calculators - Solutions")

with open(r"e:\web\Bongshaihousing\solutions.html", "w", encoding="utf-8") as f:
    f.write(new_html_content)

print("Created solutions.html")
