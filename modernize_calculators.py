import re

with open(r"e:\web\Bongshaihousing\solutions.html", "r", encoding="utf-8") as f:
    template = f.read()

modern_calculators_content = """
<div style="display: flex; flex-direction: column; gap: var(--space-10);">

  <!-- CALCULATOR 1: Cost Estimator -->
  <div class="reveal-up" style="background: var(--white); border-radius: 24px; padding: var(--space-8); box-shadow: 0 20px 40px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.05); position: relative; overflow: hidden;">
    <div style="position: absolute; top: -50px; right: -50px; width: 300px; height: 300px; background: var(--primary); filter: blur(120px); opacity: 0.15; border-radius: 50%; pointer-events: none;"></div>
    
    <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
      <div style="width: 64px; height: 64px; border-radius: 16px; background: linear-gradient(135deg, var(--primary-light), var(--primary)); display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 10px 20px rgba(30,64,175,0.2);">
        <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
      </div>
      <h2 style="font-family: var(--font-heading); font-size: 2.2rem; margin: 0; color: var(--grey-800);">Cost Estimator</h2>
    </div>
    
    <p style="color: var(--grey-500); font-size: 1.05rem; line-height: 1.6; margin-bottom: 32px; max-width: 600px;">
      Get a highly accurate, instant estimate for your pre-fabricated home. Select your desired model and size to see the total cost.
    </p>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; margin-bottom: 32px;">
      <div>
        <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--grey-600); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Property Type</label>
        <select id="calc1-type" style="width: 100%; padding: 16px; border-radius: 12px; border: 1px solid var(--grey-200); background: var(--off-white); color: var(--grey-800); font-size: 1rem; outline: none; transition: border 0.3s ease;">
          <option value="2500">Low-Cost Villa (Standard)</option>
          <option value="3500">Duplex Villa (Premium)</option>
          <option value="1800">Industrial Shed</option>
        </select>
      </div>
      <div>
        <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--grey-600); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Floor Area (Sq.Ft)</label>
        <input type="number" id="calc1-sqft" value="650" style="width: 100%; padding: 16px; border-radius: 12px; border: 1px solid var(--grey-200); background: var(--off-white); color: var(--grey-800); font-size: 1rem; outline: none; transition: border 0.3s ease;" />
      </div>
      <div>
        <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--grey-600); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Finish Quality</label>
        <select id="calc1-finish" style="width: 100%; padding: 16px; border-radius: 12px; border: 1px solid var(--grey-200); background: var(--off-white); color: var(--grey-800); font-size: 1rem; outline: none; transition: border 0.3s ease;">
          <option value="1">Standard Finishing</option>
          <option value="1.2">Luxury Finishing (+20%)</option>
        </select>
      </div>
    </div>
    
    <div style="background: linear-gradient(135deg, var(--grey-800), var(--dark)); padding: 32px; border-radius: 16px; color: white; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 24px;">
      <div>
        <div style="font-size: 0.85rem; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; color: var(--grey-400); margin-bottom: 8px;">Estimated Total Cost</div>
        <div id="calc1-result" style="font-size: 3.2rem; font-weight: 800; font-family: var(--font-heading); line-height: 1; color: var(--accent-light);">BDT 0</div>
      </div>
      <div style="font-size: 0.85rem; color: var(--grey-400); max-width: 220px;">
        *Excludes land price and registration fees. Contact our sales team for a finalized quote.
      </div>
    </div>
  </div>

  <!-- CALCULATOR 2: EMI Calculator -->
  <div class="reveal-up" style="background: var(--white); border-radius: 24px; padding: var(--space-8); box-shadow: 0 20px 40px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.05); position: relative; overflow: hidden;">
    <div style="position: absolute; top: -50px; right: -50px; width: 300px; height: 300px; background: #10b981; filter: blur(120px); opacity: 0.15; border-radius: 50%; pointer-events: none;"></div>
    
    <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
      <div style="width: 64px; height: 64px; border-radius: 16px; background: linear-gradient(135deg, #34d399, #059669); display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 10px 20px rgba(5,150,105,0.2);">
        <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
      </div>
      <h2 style="font-family: var(--font-heading); font-size: 2.2rem; margin: 0; color: var(--grey-800);">EMI Calculator</h2>
    </div>
    
    <p style="color: var(--grey-500); font-size: 1.05rem; line-height: 1.6; margin-bottom: 32px; max-width: 600px;">
      Plan your finances with ease. Calculate your estimated monthly installments based on current Bangladeshi bank loan rates.
    </p>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; margin-bottom: 32px;">
      <div>
        <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--grey-600); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Total Property Cost (BDT)</label>
        <input type="number" id="calc2-cost" value="5000000" style="width: 100%; padding: 16px; border-radius: 12px; border: 1px solid var(--grey-200); background: var(--off-white); color: var(--grey-800); font-size: 1rem; outline: none; transition: border 0.3s ease;" />
      </div>
      <div>
        <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--grey-600); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Down Payment (%)</label>
        <input type="number" id="calc2-down" value="20" style="width: 100%; padding: 16px; border-radius: 12px; border: 1px solid var(--grey-200); background: var(--off-white); color: var(--grey-800); font-size: 1rem; outline: none; transition: border 0.3s ease;" />
      </div>
      <div>
        <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--grey-600); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Interest Rate (%)</label>
        <input type="number" id="calc2-rate" value="9" style="width: 100%; padding: 16px; border-radius: 12px; border: 1px solid var(--grey-200); background: var(--off-white); color: var(--grey-800); font-size: 1rem; outline: none; transition: border 0.3s ease;" />
      </div>
      <div style="grid-column: 1 / -1;">
        <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--grey-600); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Loan Tenure (Years): <span id="calc2-tenure-val" style="color: var(--primary);">15 Years</span></label>
        <input type="range" id="calc2-tenure" min="1" max="25" value="15" style="width: 100%; cursor: pointer;" oninput="document.getElementById('calc2-tenure-val').innerText = this.value + ' Years'" />
      </div>
    </div>
    
    <div style="background: linear-gradient(135deg, #064e3b, #022c22); padding: 32px; border-radius: 16px; color: white; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 24px;">
      <div>
        <div style="font-size: 0.85rem; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; color: #a7f3d0; margin-bottom: 8px;">Estimated Monthly EMI</div>
        <div id="calc2-result" style="font-size: 3.2rem; font-weight: 800; font-family: var(--font-heading); line-height: 1; color: #34d399;">BDT 0</div>
      </div>
      <div style="font-size: 0.85rem; color: #6ee7b7; font-weight: 500; text-align: right;" id="calc2-loan-amount">
        Loan Amount: BDT 0<br>Down Payment: BDT 0
      </div>
    </div>
  </div>

  <!-- CALCULATOR 3: Land Size & Fit -->
  <div class="reveal-up" style="background: var(--white); border-radius: 24px; padding: var(--space-8); box-shadow: 0 20px 40px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.05); position: relative; overflow: hidden;">
    <div style="position: absolute; top: -50px; right: -50px; width: 300px; height: 300px; background: #f59e0b; filter: blur(120px); opacity: 0.15; border-radius: 50%; pointer-events: none;"></div>
    
    <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
      <div style="width: 64px; height: 64px; border-radius: 16px; background: linear-gradient(135deg, #fbbf24, #d97706); display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 10px 20px rgba(217,119,6,0.2);">
        <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
      </div>
      <h2 style="font-family: var(--font-heading); font-size: 2.2rem; margin: 0; color: var(--grey-800);">Land Fit Calculator</h2>
    </div>
    
    <p style="color: var(--grey-500); font-size: 1.05rem; line-height: 1.6; margin-bottom: 32px; max-width: 600px;">
      Not sure what you can build on your plot? Enter your land size in local units to see the maximum house footprint allowed by building codes.
    </p>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; margin-bottom: 32px;">
      <div>
        <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--grey-600); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Your Land Size</label>
        <input type="number" id="calc3-land" value="3" style="width: 100%; padding: 16px; border-radius: 12px; border: 1px solid var(--grey-200); background: var(--off-white); color: var(--grey-800); font-size: 1rem; outline: none; transition: border 0.3s ease;" />
      </div>
      <div>
        <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--grey-600); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Measurement Unit</label>
        <select id="calc3-unit" style="width: 100%; padding: 16px; border-radius: 12px; border: 1px solid var(--grey-200); background: var(--off-white); color: var(--grey-800); font-size: 1rem; outline: none; transition: border 0.3s ease;">
          <option value="720">Katha</option>
          <option value="435.6">Decimal</option>
        </select>
      </div>
      <div>
        <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--grey-600); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Rajuk/Local Setback Rule</label>
        <select id="calc3-rule" style="width: 100%; padding: 16px; border-radius: 12px; border: 1px solid var(--grey-200); background: var(--off-white); color: var(--grey-800); font-size: 1rem; outline: none; transition: border 0.3s ease;">
          <option value="0.35">35% Open Space (Standard City)</option>
          <option value="0.40">40% Open Space (Large Plot)</option>
          <option value="0.25">25% Open Space (Rural/Suburb)</option>
        </select>
      </div>
    </div>
    
    <div style="background: linear-gradient(135deg, #78350f, #451a03); padding: 32px; border-radius: 16px; color: white; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 24px;">
      <div>
        <div style="font-size: 0.85rem; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; color: #fcd34d; margin-bottom: 8px;">Maximum Ground Coverage</div>
        <div id="calc3-result" style="font-size: 3.2rem; font-weight: 800; font-family: var(--font-heading); line-height: 1; color: #fde68a;">0 Sq.Ft</div>
      </div>
      <div style="font-size: 0.95rem; color: #fef3c7; font-weight: 500; max-width: 280px;" id="calc3-recommendation">
        Recommendation: -
      </div>
    </div>
  </div>

</div>
"""

# Extract everything between <div style="display: flex; flex-direction: column; gap: var(--space-8);"> and <script>
# Actually, the gap might have been var(--space-8) before. Let's just find <div style="display: flex; flex-direction: column; gap: ...
start_idx = template.find('<div style="display: flex; flex-direction: column; gap:')
end_idx = template.find('<script>', start_idx)

if start_idx != -1 and end_idx != -1:
    new_template = template[:start_idx] + modern_calculators_content + "\n\n" + template[end_idx:]
    with open(r"e:\web\Bongshaihousing\solutions.html", "w", encoding="utf-8") as f:
        f.write(new_template)
    print("Replaced calculators with modern premium design.")
else:
    print("Could not find the calculators block in solutions.html")
