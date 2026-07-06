import re

with open(r"e:\web\Bongshaihousing\solutions.html", "r", encoding="utf-8") as f:
    template = f.read()

# I will replace the entire calculators block
# Start from <div style="display: flex; flex-direction: column; gap: var(--space-10);">
# End before </script>

advanced_calculators_content = """
<style>
  .calc-card {
    background: var(--white);
    border-radius: 32px;
    padding: 48px;
    box-shadow: 0 24px 50px rgba(0,0,0,0.03);
    border: 1px solid rgba(0,0,0,0.03);
    margin-bottom: 60px;
    display: flex;
    flex-wrap: wrap;
    gap: 48px;
    align-items: start;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease;
  }
  .calc-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 32px 60px rgba(0,0,0,0.06);
  }
  .calc-left { flex: 1 1 400px; }
  .calc-right { 
    flex: 1 1 350px; 
    background: var(--dark); 
    border-radius: 24px; 
    padding: 40px; 
    position: relative; 
    overflow: hidden; 
    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
  }
  .calc-input {
    width: 100%; 
    appearance: none; 
    padding: 18px 24px; 
    border-radius: 16px; 
    border: 2px solid var(--grey-100); 
    background: var(--off-white); 
    color: var(--grey-800); 
    font-size: 1.1rem; 
    font-weight: 600; 
    outline: none; 
    transition: all 0.3s ease;
  }
  .calc-input:focus {
    border-color: var(--primary-light);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    background: var(--white);
  }
  .calc-label {
    display: block; 
    font-size: 0.8rem; 
    font-weight: 700; 
    color: var(--grey-500); 
    text-transform: uppercase; 
    letter-spacing: 1px; 
    margin-bottom: 12px;
  }
  .input-wrapper { position: relative; margin-bottom: 28px; }
  .input-wrapper.select::after {
    content: '▼';
    position: absolute;
    right: 24px;
    top: 52px;
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--grey-400);
    font-size: 0.8rem;
  }
  .receipt-row {
    display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .receipt-label { color: var(--grey-400); font-size: 0.95rem; }
  .receipt-value { color: var(--white); font-weight: 600; font-size: 1.05rem; }
  .calc-btn {
    width: 100%; margin-top: 32px; padding: 18px; border-radius: 16px; background: var(--primary); color: white; font-size: 1.1rem; font-weight: 600; border: none; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 10px 20px rgba(30, 64, 175, 0.3);
  }
  .calc-btn:hover { background: var(--primary-dark); transform: translateY(-2px); box-shadow: 0 14px 28px rgba(30, 64, 175, 0.4); }
  
  /* Range Slider Styling */
  input[type=range] {
    -webkit-appearance: none;
    width: 100%;
    background: transparent;
    padding: 10px 0;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 24px; width: 24px;
    border-radius: 50%;
    background: var(--primary);
    cursor: pointer;
    margin-top: -10px;
    box-shadow: 0 4px 12px rgba(30,64,175,0.3);
  }
  input[type=range]::-webkit-slider-runnable-track {
    width: 100%; height: 6px;
    cursor: pointer;
    background: var(--grey-200);
    border-radius: 4px;
  }
</style>

<div style="display: flex; flex-direction: column;">

  <!-- 1. COST ESTIMATOR -->
  <div class="calc-card reveal-up">
    <!-- Left: Inputs -->
    <div class="calc-left">
      <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 40px;">
        <div style="width: 60px; height: 60px; border-radius: 18px; background: var(--off-white); display: flex; align-items: center; justify-content: center; color: var(--primary); box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
          <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
        </div>
        <div>
          <h2 style="font-family: var(--font-heading); font-size: 2.2rem; margin: 0; color: var(--grey-800);">Cost Estimator</h2>
          <p style="color: var(--grey-500); font-size: 1rem; margin: 4px 0 0 0;">Calculate your project budget instantly.</p>
        </div>
      </div>
      
      <div class="input-wrapper select">
        <label class="calc-label">Property Type</label>
        <select id="calc1-type" class="calc-input">
          <option value="2500" data-name="Low-Cost Villa">Low-Cost Villa (Standard)</option>
          <option value="3500" data-name="Duplex Villa">Duplex Villa (Premium)</option>
          <option value="1800" data-name="Industrial Shed">Industrial Shed</option>
        </select>
      </div>
      
      <div class="input-wrapper">
        <label class="calc-label">Floor Area (Sq.Ft)</label>
        <input type="number" id="calc1-sqft" class="calc-input" value="1300" />
      </div>
      
      <div class="input-wrapper select">
        <label class="calc-label">Finish Quality</label>
        <select id="calc1-finish" class="calc-input">
          <option value="1" data-name="Standard">Standard Finishing</option>
          <option value="1.2" data-name="Luxury">Luxury Finishing (+20%)</option>
        </select>
      </div>
    </div>
    
    <!-- Right: Receipt -->
    <div class="calc-right">
      <div style="position: absolute; top: -80px; right: -80px; width: 250px; height: 250px; background: var(--primary); filter: blur(90px); opacity: 0.35; border-radius: 50%; pointer-events: none;"></div>
      
      <div style="position: relative; z-index: 1;">
        <div style="font-size: 0.85rem; color: var(--grey-400); text-transform: uppercase; font-weight: 700; letter-spacing: 2px; margin-bottom: 12px;">Estimated Total</div>
        <div id="calc1-result" style="font-size: 3.5rem; font-weight: 800; font-family: var(--font-heading); color: var(--white); line-height: 1.1; margin-bottom: 40px; letter-spacing: -1px;">BDT 0</div>
        
        <div style="margin-bottom: 32px;">
          <div class="receipt-row">
            <span class="receipt-label">Model</span>
            <span class="receipt-value" id="c1-val-model">Low-Cost Villa</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">Area</span>
            <span class="receipt-value" id="c1-val-area">1300 Sq.Ft</span>
          </div>
          <div class="receipt-row" style="border-bottom: none;">
            <span class="receipt-label">Finishing</span>
            <span class="receipt-value" id="c1-val-finish">Standard</span>
          </div>
        </div>
        
        <p style="font-size: 0.75rem; color: var(--grey-500); line-height: 1.5; margin-bottom: 0;">*Excludes land price, utility connections, and registration fees. Contact our sales team for a finalized quotation.</p>
        <a href="contact.html" style="text-decoration: none;"><button class="calc-btn">Get Final Quote</button></a>
      </div>
    </div>
  </div>

  <!-- 2. EMI CALCULATOR -->
  <div class="calc-card reveal-up">
    <!-- Left: Inputs -->
    <div class="calc-left">
      <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 40px;">
        <div style="width: 60px; height: 60px; border-radius: 18px; background: var(--off-white); display: flex; align-items: center; justify-content: center; color: #10b981; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
          <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        </div>
        <div>
          <h2 style="font-family: var(--font-heading); font-size: 2.2rem; margin: 0; color: var(--grey-800);">EMI Calculator</h2>
          <p style="color: var(--grey-500); font-size: 1rem; margin: 4px 0 0 0;">Plan your finances with ease.</p>
        </div>
      </div>
      
      <div class="input-wrapper">
        <label class="calc-label">Total Property Cost (BDT)</label>
        <input type="number" id="calc2-cost" class="calc-input" value="5000000" />
      </div>
      
      <div style="display: flex; gap: 24px; flex-wrap: wrap;">
        <div class="input-wrapper" style="flex: 1;">
          <label class="calc-label">Down Payment (%)</label>
          <input type="number" id="calc2-down" class="calc-input" value="20" />
        </div>
        <div class="input-wrapper" style="flex: 1;">
          <label class="calc-label">Interest Rate (%)</label>
          <input type="number" id="calc2-rate" class="calc-input" value="9" />
        </div>
      </div>
      
      <div class="input-wrapper">
        <div style="display: flex; justify-content: space-between;">
          <label class="calc-label">Loan Tenure (Years)</label>
          <span id="calc2-tenure-val" style="font-weight: 700; color: #10b981; font-size: 1.1rem;">15 Years</span>
        </div>
        <input type="range" id="calc2-tenure" min="1" max="25" value="15" oninput="document.getElementById('calc2-tenure-val').innerText = this.value + ' Years'" />
      </div>
    </div>
    
    <!-- Right: Receipt -->
    <div class="calc-right">
      <div style="position: absolute; top: -80px; right: -80px; width: 250px; height: 250px; background: #10b981; filter: blur(90px); opacity: 0.35; border-radius: 50%; pointer-events: none;"></div>
      
      <div style="position: relative; z-index: 1;">
        <div style="font-size: 0.85rem; color: var(--grey-400); text-transform: uppercase; font-weight: 700; letter-spacing: 2px; margin-bottom: 12px;">Monthly Installment</div>
        <div id="calc2-result" style="font-size: 3.5rem; font-weight: 800; font-family: var(--font-heading); color: var(--white); line-height: 1.1; margin-bottom: 40px; letter-spacing: -1px;">BDT 0</div>
        
        <!-- Custom Visual Bar -->
        <div style="width: 100%; height: 12px; border-radius: 6px; background: rgba(255,255,255,0.1); margin-bottom: 16px; overflow: hidden; display: flex;">
          <div id="c2-bar-down" style="height: 100%; background: #34d399; width: 20%; transition: width 0.5s ease;"></div>
          <div id="c2-bar-loan" style="height: 100%; background: #059669; width: 80%; transition: width 0.5s ease;"></div>
        </div>
        
        <div style="margin-bottom: 32px;">
          <div class="receipt-row">
            <span class="receipt-label"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#34d399;margin-right:8px;"></span>Down Payment</span>
            <span class="receipt-value" id="c2-val-down">BDT 0</span>
          </div>
          <div class="receipt-row" style="border-bottom: none;">
            <span class="receipt-label"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#059669;margin-right:8px;"></span>Loan Amount</span>
            <span class="receipt-value" id="c2-val-loan">BDT 0</span>
          </div>
        </div>
        
        <p style="font-size: 0.75rem; color: var(--grey-500); line-height: 1.5; margin-bottom: 0;">*Rates are indicative. Please consult with your bank for exact approval amounts and current rates.</p>
      </div>
    </div>
  </div>

  <!-- 3. LAND FIT CALCULATOR -->
  <div class="calc-card reveal-up">
    <!-- Left: Inputs -->
    <div class="calc-left">
      <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 40px;">
        <div style="width: 60px; height: 60px; border-radius: 18px; background: var(--off-white); display: flex; align-items: center; justify-content: center; color: #f59e0b; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
          <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
        </div>
        <div>
          <h2 style="font-family: var(--font-heading); font-size: 2.2rem; margin: 0; color: var(--grey-800);">Land Fit</h2>
          <p style="color: var(--grey-500); font-size: 1rem; margin: 4px 0 0 0;">Check building footprint allowance.</p>
        </div>
      </div>
      
      <div style="display: flex; gap: 24px; flex-wrap: wrap;">
        <div class="input-wrapper" style="flex: 2;">
          <label class="calc-label">Your Land Size</label>
          <input type="number" id="calc3-land" class="calc-input" value="3" />
        </div>
        <div class="input-wrapper select" style="flex: 1;">
          <label class="calc-label">Unit</label>
          <select id="calc3-unit" class="calc-input">
            <option value="720">Katha</option>
            <option value="435.6">Decimal</option>
          </select>
        </div>
      </div>
      
      <div class="input-wrapper select">
        <label class="calc-label">Rajuk/Local Setback Rule</label>
        <select id="calc3-rule" class="calc-input">
          <option value="0.35" data-name="35%">35% Open Space (Standard City)</option>
          <option value="0.40" data-name="40%">40% Open Space (Large Plot)</option>
          <option value="0.25" data-name="25%">25% Open Space (Rural/Suburb)</option>
        </select>
      </div>
    </div>
    
    <!-- Right: Receipt -->
    <div class="calc-right">
      <div style="position: absolute; top: -80px; right: -80px; width: 250px; height: 250px; background: #f59e0b; filter: blur(90px); opacity: 0.35; border-radius: 50%; pointer-events: none;"></div>
      
      <div style="position: relative; z-index: 1;">
        <div style="font-size: 0.85rem; color: var(--grey-400); text-transform: uppercase; font-weight: 700; letter-spacing: 2px; margin-bottom: 12px;">Max Ground Coverage</div>
        <div id="calc3-result" style="font-size: 3.5rem; font-weight: 800; font-family: var(--font-heading); color: var(--white); line-height: 1.1; margin-bottom: 40px; letter-spacing: -1px;">0 Sq.Ft</div>
        
        <div style="margin-bottom: 32px;">
          <div class="receipt-row">
            <span class="receipt-label">Total Plot Area</span>
            <span class="receipt-value" id="c3-val-total">0 Sq.Ft</span>
          </div>
          <div class="receipt-row" style="border-bottom: none;">
            <span class="receipt-label">Required Open Space</span>
            <span class="receipt-value" id="c3-val-open">0 Sq.Ft</span>
          </div>
        </div>
        
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 20px; border-radius: 12px;">
          <div style="font-size: 0.75rem; color: var(--grey-400); text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px;">Our Recommendation</div>
          <div id="calc3-recommendation" style="color: var(--white); font-weight: 500; font-size: 0.95rem; line-height: 1.5;">-</div>
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
  calculateCost();

  // EMI Calculator Logic
  function calculateEMI() {
    const totalCost = parseFloat(document.getElementById('calc2-cost').value) || 0;
    const downPercent = parseFloat(document.getElementById('calc2-down').value) || 0;
    const rateYearly = parseFloat(document.getElementById('calc2-rate').value) || 0;
    const years = parseFloat(document.getElementById('calc2-tenure').value) || 1;
    
    const downPayment = totalCost * (downPercent / 100);
    const loanAmount = totalCost - downPayment;
    
    document.getElementById('c2-val-down').innerText = 'BDT ' + formatBDT(downPayment);
    document.getElementById('c2-val-loan').innerText = 'BDT ' + formatBDT(loanAmount);
    
    document.getElementById('c2-bar-down').style.width = Math.min(100, Math.max(0, downPercent)) + '%';
    document.getElementById('c2-bar-loan').style.width = (100 - Math.min(100, Math.max(0, downPercent))) + '%';
    
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
    const ruleSelect = document.getElementById('calc3-rule');
    const landSize = parseFloat(document.getElementById('calc3-land').value) || 0;
    const unitSqft = parseFloat(document.getElementById('calc3-unit').value);
    const openSpaceRule = parseFloat(ruleSelect.value);
    
    const totalSqft = landSize * unitSqft;
    const openSpace = totalSqft * openSpaceRule;
    const maxCoverage = totalSqft - openSpace;
    
    document.getElementById('calc3-result').innerText = formatBDT(maxCoverage) + ' Sq.Ft';
    document.getElementById('c3-val-total').innerText = formatBDT(totalSqft) + ' Sq.Ft';
    document.getElementById('c3-val-open').innerText = formatBDT(openSpace) + ' Sq.Ft';
    
    let rec = "";
    if (maxCoverage < 400) {
      rec = "Too small for standard models. Consider our customized Container Houses.";
    } else if (maxCoverage < 700) {
      rec = "Perfect fit for a 650 Sq.Ft Low-Cost Villa or a compact Duplex.";
    } else if (maxCoverage < 1100) {
      rec = "Great for our 750 or 950 Sq.Ft Duplex Villa series.";
    } else {
      rec = "Spacious plot! Comfortably accommodates our 1200 Sq.Ft Luxury Duplex.";
    }
    document.getElementById('calc3-recommendation').innerText = rec;
  }
  
  ['calc3-land', 'calc3-unit', 'calc3-rule'].forEach(id => {
    document.getElementById(id).addEventListener('input', calculateLand);
    document.getElementById(id).addEventListener('change', calculateLand);
  });
  calculateLand();
"""

start_idx = template.find('<div style="display: flex; flex-direction: column;')
end_idx = template.find('</script>', start_idx)

if start_idx != -1 and end_idx != -1:
    # replace up to the closing script tag. But wait, I have </script> in advanced_calculators_content.
    # So I should replace up to end_idx + 9 (length of </script>)
    new_template = template[:start_idx] + advanced_calculators_content + "\n</script>\n" + template[end_idx+9:]
    with open(r"e:\web\Bongshaihousing\solutions.html", "w", encoding="utf-8") as f:
        f.write(new_template)
    print("Upgraded calculators to V3 Ultra-Premium.")
else:
    print("Could not find the calculators block.")
