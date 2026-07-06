import re

with open(r"e:\web\Bongshaihousing\solutions.html", "r", encoding="utf-8") as f:
    template = f.read()

sequential_calculators_content = """
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
  .calc-input:disabled {
    background: var(--grey-100);
    color: var(--grey-400);
    cursor: not-allowed;
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
  
  .step-badge {
    display: inline-block; background: var(--dark); color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; letter-spacing: 1px; margin-bottom: 12px;
  }
</style>

<div style="display: flex; flex-direction: column;">

  <!-- STEP 1. LAND FIT CALCULATOR -->
  <div class="calc-card reveal-up" id="step1">
    <div class="calc-left">
      <div style="margin-bottom: 40px;">
        <span class="step-badge" style="background: #f59e0b;">STEP 1</span>
        <div style="display: flex; align-items: center; gap: 20px;">
          <div style="width: 60px; height: 60px; border-radius: 18px; background: var(--off-white); display: flex; align-items: center; justify-content: center; color: #f59e0b; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
            <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
          </div>
          <div>
            <h2 style="font-family: var(--font-heading); font-size: 2.2rem; margin: 0; color: var(--grey-800);">Land Fit</h2>
            <p style="color: var(--grey-500); font-size: 1rem; margin: 4px 0 0 0;">Check building footprint allowance.</p>
          </div>
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
          <div style="font-size: 0.75rem; color: var(--grey-400); text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px;">Status</div>
          <div style="color: var(--white); font-weight: 500; font-size: 0.95rem; line-height: 1.5;">Models matching this footprint have been unlocked in Step 2.</div>
        </div>
      </div>
    </div>
  </div>

  <!-- STEP 2. COST ESTIMATOR -->
  <div class="calc-card reveal-up" id="step2">
    <div class="calc-left">
      <div style="margin-bottom: 40px;">
        <span class="step-badge" style="background: var(--primary);">STEP 2</span>
        <div style="display: flex; align-items: center; gap: 20px;">
          <div style="width: 60px; height: 60px; border-radius: 18px; background: var(--off-white); display: flex; align-items: center; justify-content: center; color: var(--primary); box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
            <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
          </div>
          <div>
            <h2 style="font-family: var(--font-heading); font-size: 2.2rem; margin: 0; color: var(--grey-800);">Cost Estimator</h2>
            <p style="color: var(--grey-500); font-size: 1rem; margin: 4px 0 0 0;">Select from models that fit your land.</p>
          </div>
        </div>
      </div>
      
      <div class="input-wrapper select">
        <label class="calc-label">Select Model (Filtered by Step 1)</label>
        <select id="calc1-model" class="calc-input">
          <!-- Options populated dynamically -->
        </select>
      </div>
      
      <div class="input-wrapper">
        <label class="calc-label">Floor Area (Sq.Ft)</label>
        <input type="number" id="calc1-sqft" class="calc-input" value="1300" disabled title="Determined automatically by the selected model" />
      </div>
      
      <div class="input-wrapper select">
        <label class="calc-label">Finish Quality</label>
        <select id="calc1-finish" class="calc-input">
          <option value="1" data-name="Standard">Standard Finishing</option>
          <option value="1.2" data-name="Luxury">Luxury Finishing (+20%)</option>
        </select>
      </div>
    </div>
    
    <div class="calc-right">
      <div style="position: absolute; top: -80px; right: -80px; width: 250px; height: 250px; background: var(--primary); filter: blur(90px); opacity: 0.35; border-radius: 50%; pointer-events: none;"></div>
      
      <div style="position: relative; z-index: 1;">
        <div style="font-size: 0.85rem; color: var(--grey-400); text-transform: uppercase; font-weight: 700; letter-spacing: 2px; margin-bottom: 12px;">Estimated Total</div>
        <div id="calc1-result" style="font-size: 3.5rem; font-weight: 800; font-family: var(--font-heading); color: var(--white); line-height: 1.1; margin-bottom: 40px; letter-spacing: -1px;">BDT 0</div>
        
        <div style="margin-bottom: 32px;">
          <div class="receipt-row">
            <span class="receipt-label">Model</span>
            <span class="receipt-value" id="c1-val-model">-</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-label">Area</span>
            <span class="receipt-value" id="c1-val-area">0 Sq.Ft</span>
          </div>
          <div class="receipt-row" style="border-bottom: none;">
            <span class="receipt-label">Finishing</span>
            <span class="receipt-value" id="c1-val-finish">Standard</span>
          </div>
        </div>
        
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 20px; border-radius: 12px;">
          <div style="font-size: 0.75rem; color: var(--grey-400); text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px;">Status</div>
          <div style="color: var(--white); font-weight: 500; font-size: 0.95rem; line-height: 1.5;">This cost has been pushed to Step 3.</div>
        </div>
      </div>
    </div>
  </div>

  <!-- STEP 3. EMI CALCULATOR -->
  <div class="calc-card reveal-up" id="step3">
    <div class="calc-left">
      <div style="margin-bottom: 40px;">
        <span class="step-badge" style="background: #10b981;">STEP 3</span>
        <div style="display: flex; align-items: center; gap: 20px;">
          <div style="width: 60px; height: 60px; border-radius: 18px; background: var(--off-white); display: flex; align-items: center; justify-content: center; color: #10b981; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
            <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          </div>
          <div>
            <h2 style="font-family: var(--font-heading); font-size: 2.2rem; margin: 0; color: var(--grey-800);">EMI Calculator</h2>
            <p style="color: var(--grey-500); font-size: 1rem; margin: 4px 0 0 0;">Plan your finances with local bank rates.</p>
          </div>
        </div>
      </div>
      
      <div class="input-wrapper">
        <label class="calc-label">Total Property Cost (BDT)</label>
        <!-- Disabled so user knows it's linked from step 2, but they could technically enable it via JS if they wanted. Let's make it readonly but visually distinct -->
        <input type="number" id="calc2-cost" class="calc-input" value="0" style="background: var(--grey-100); color: var(--primary);" readonly />
      </div>
      
      <div style="display: flex; gap: 24px; flex-wrap: wrap;">
        <div class="input-wrapper" style="flex: 1;">
          <label class="calc-label">Down Payment (%)</label>
          <input type="number" id="calc2-down" class="calc-input" value="20" />
        </div>
        <div class="input-wrapper" style="flex: 1;">
          <label class="calc-label">Bank Interest Rate (%)</label>
          <input type="number" id="calc2-rate" class="calc-input" value="10" title="Standard Bangladesh Bank Home Loan Rate" />
        </div>
      </div>
      
      <div class="input-wrapper">
        <div style="display: flex; justify-content: space-between;">
          <label class="calc-label">Loan Tenure (Years)</label>
          <span id="calc2-tenure-val" style="font-weight: 700; color: #10b981; font-size: 1.1rem;">15 Years</span>
        </div>
        <input type="range" id="calc2-tenure" min="1" max="25" value="15" oninput="document.getElementById('calc2-tenure-val').innerText = this.value + ' Years'; calculateEMI();" />
      </div>
    </div>
    
    <div class="calc-right">
      <div style="position: absolute; top: -80px; right: -80px; width: 250px; height: 250px; background: #10b981; filter: blur(90px); opacity: 0.35; border-radius: 50%; pointer-events: none;"></div>
      
      <div style="position: relative; z-index: 1;">
        <div style="font-size: 0.85rem; color: var(--grey-400); text-transform: uppercase; font-weight: 700; letter-spacing: 2px; margin-bottom: 12px;">Monthly Installment</div>
        <div id="calc2-result" style="font-size: 3.5rem; font-weight: 800; font-family: var(--font-heading); color: var(--white); line-height: 1.1; margin-bottom: 40px; letter-spacing: -1px;">BDT 0</div>
        
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
        
        <p style="font-size: 0.75rem; color: var(--grey-500); line-height: 1.5; margin-bottom: 0;">*Interest rates are indicative of local Bangladesh banking norms (9-11%). Please consult with your bank for exact approval amounts.</p>
        <a href="contact.html" style="text-decoration: none;"><button class="calc-btn" style="background: #10b981; box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);">Apply for Consultation</button></a>
      </div>
    </div>
  </div>

</div>

<script>
  function formatBDT(number) {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(number);
  }

  // ==========================================
  // 🚀 BONGSHAI MODELS DATABASE
  // Added "footprint" to calculate if it fits on land.
  // ==========================================
  const BONGSHAI_MODELS = [
    { category: "Duplex Villa (Premium)", name: "Duplex Villa (650x2 Sq.Ft) - 4 Beds", baseRate: 3500, defaultArea: 1300, footprint: 650 },
    { category: "Duplex Villa (Premium)", name: "Duplex Villa (750x2 Sq.Ft) - 4 Beds", baseRate: 3500, defaultArea: 1500, footprint: 750 },
    { category: "Duplex Villa (Premium)", name: "Duplex Villa (950x2 Sq.Ft) - 6 Beds", baseRate: 3500, defaultArea: 1900, footprint: 950 },
    { category: "Duplex Villa (Premium)", name: "Duplex Villa (1200x2 Sq.Ft) - 8 Beds", baseRate: 3500, defaultArea: 2400, footprint: 1200 },
    { category: "Low-Cost Villa (Standard)", name: "Low-Cost Villa (650 Sq.Ft)", baseRate: 2500, defaultArea: 650, footprint: 650 },
    { category: "Low-Cost Villa (Standard)", name: "Low-Cost Villa (950 Sq.Ft)", baseRate: 2500, defaultArea: 950, footprint: 950 },
    { category: "Commercial", name: "Industrial Shed (2000 Sq.Ft)", baseRate: 1800, defaultArea: 2000, footprint: 2000 }
  ];

  // DOM Elements
  const landSizeInput = document.getElementById('calc3-land');
  const unitSelect = document.getElementById('calc3-unit');
  const ruleSelect = document.getElementById('calc3-rule');
  
  const modelSelect = document.getElementById('calc1-model');
  const sqftInput = document.getElementById('calc1-sqft');
  const finishSelect = document.getElementById('calc1-finish');
  
  const costInput = document.getElementById('calc2-cost');
  const downInput = document.getElementById('calc2-down');
  const rateInput = document.getElementById('calc2-rate');
  const tenureInput = document.getElementById('calc2-tenure');
  
  let currentMaxCoverage = Infinity; // initially allow all

  // 1. LAND FIT LOGIC
  function calculateLand() {
    const landSize = parseFloat(landSizeInput.value) || 0;
    const unitSqft = parseFloat(unitSelect.value);
    const openSpaceRule = parseFloat(ruleSelect.value);
    
    const totalSqft = landSize * unitSqft;
    const openSpace = totalSqft * openSpaceRule;
    const maxCoverage = totalSqft - openSpace;
    currentMaxCoverage = maxCoverage;
    
    document.getElementById('calc3-result').innerText = formatBDT(maxCoverage) + ' Sq.Ft';
    document.getElementById('c3-val-total').innerText = formatBDT(totalSqft) + ' Sq.Ft';
    document.getElementById('c3-val-open').innerText = formatBDT(openSpace) + ' Sq.Ft';
    
    filterModels(maxCoverage);
  }
  
  // 2. MODEL FILTERING LOGIC
  function filterModels(maxCoverage) {
    // Save current selected model name if any
    let selectedModelName = null;
    if (modelSelect.options.length > 0 && modelSelect.selectedIndex !== -1) {
       const selectedOpt = modelSelect.options[modelSelect.selectedIndex];
       if(!selectedOpt.disabled) {
           selectedModelName = selectedOpt.text;
       }
    }
    
    modelSelect.innerHTML = '';
    
    let currentCategory = "";
    let optgroup = null;
    let anyValid = false;
    
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
      
      // Disable models that exceed land max ground coverage
      if (model.footprint > maxCoverage) {
          option.disabled = true;
          option.text += ' (Too large for plot)';
      } else {
          anyValid = true;
      }
      
      optgroup.appendChild(option);
    });
    
    if(!anyValid) {
        // If nothing fits, add a dummy option
        modelSelect.innerHTML = '<option value="" disabled selected>No models fit your current land size</option>';
        sqftInput.value = 0;
        document.getElementById('calc1-result').innerText = 'BDT 0';
        document.getElementById('c1-val-model').innerText = '-';
        document.getElementById('c1-val-area').innerText = '0 Sq.Ft';
        pushCostToEMI(0);
        return;
    }

    // Attempt to restore previous selection if it's still valid
    let restored = false;
    if (selectedModelName) {
        for(let i = 0; i < modelSelect.options.length; i++) {
            if(modelSelect.options[i].text === selectedModelName && !modelSelect.options[i].disabled) {
                modelSelect.selectedIndex = i;
                restored = true;
                break;
            }
        }
    }
    
    // If couldn't restore, select the first valid model
    if (!restored) {
        for(let i = 0; i < modelSelect.options.length; i++) {
            if(!modelSelect.options[i].disabled) {
                modelSelect.selectedIndex = i;
                break;
            }
        }
    }
    
    triggerCostCalculation();
  }
  
  function triggerCostCalculation() {
      if(modelSelect.value === "") return;
      const selectedModel = BONGSHAI_MODELS[modelSelect.value];
      sqftInput.value = selectedModel.defaultArea;
      calculateCost();
  }

  // 3. COST ESTIMATOR LOGIC
  function calculateCost() {
    if(!modelSelect || modelSelect.value === "") return;
    
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
    
    // Push cost to EMI automatically!
    pushCostToEMI(totalCost);
  }
  
  function pushCostToEMI(cost) {
      costInput.value = cost;
      calculateEMI();
  }

  // 4. EMI LOGIC
  function calculateEMI() {
    const totalCost = parseFloat(costInput.value) || 0;
    const downPercent = parseFloat(downInput.value) || 0;
    const rateYearly = parseFloat(rateInput.value) || 0;
    const years = parseFloat(tenureInput.value) || 1;
    
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

  // Event Listeners Setup
  [landSizeInput, unitSelect, ruleSelect].forEach(el => {
      el.addEventListener('input', calculateLand);
      el.addEventListener('change', calculateLand);
  });
  
  modelSelect.addEventListener('change', triggerCostCalculation);
  finishSelect.addEventListener('change', calculateCost);
  
  [downInput, rateInput].forEach(el => {
      el.addEventListener('input', calculateEMI);
      el.addEventListener('change', calculateEMI);
  });
  
  // Kick off the cascade: Land -> Filters Model -> Calc Cost -> Calc EMI
  calculateLand();
"""

start_idx = template.find('<style>\n  .calc-card {')
end_idx = template.find('</script>', start_idx)

if start_idx != -1 and end_idx != -1:
    new_template = template[:start_idx] + sequential_calculators_content + "\n</script>\n" + template[end_idx+9:]
    with open(r"e:\web\Bongshaihousing\solutions.html", "w", encoding="utf-8") as f:
        f.write(new_template)
    print("Rewrote calculators to run in a linked 3-step sequence.")
else:
    print("Could not find the calculators block.")
