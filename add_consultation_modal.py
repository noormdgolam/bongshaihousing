import re

with open(r"e:\web\Bongshaihousing\solutions.html", "r", encoding="utf-8") as f:
    template = f.read()

# 1. Update the button
old_button = '<a href="contact.html" style="text-decoration: none;"><button class="calc-btn" style="background: #10b981; box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);">Apply for Consultation</button></a>'
new_button = '<button class="calc-btn" onclick="openConsultationModal()" style="background: #10b981; box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);">Apply & Get PDF Quote</button>'

template = template.replace(old_button, new_button)

# 2. Add the Modal HTML just before closing </main> or </body>
modal_html = """
<!-- CONSULTATION MODAL -->
<style>
  .modal-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(8px);
    display: none; align-items: center; justify-content: center; z-index: 9999;
    opacity: 0; transition: opacity 0.3s ease;
  }
  .modal-overlay.open { display: flex; opacity: 1; }
  .modal-card {
    background: var(--white); border-radius: 24px; padding: 40px; width: 90%; max-width: 500px;
    box-shadow: 0 24px 50px rgba(0,0,0,0.2); position: relative;
    transform: translateY(20px); transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .modal-overlay.open .modal-card { transform: translateY(0); }
  .modal-close {
    position: absolute; top: 20px; right: 20px; background: var(--grey-100); color: var(--grey-600);
    width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    cursor: pointer; border: none; font-size: 1.2rem; transition: background 0.3s ease;
  }
  .modal-close:hover { background: var(--grey-200); color: var(--grey-800); }
  .modal-input {
    width: 100%; padding: 16px; border-radius: 12px; border: 2px solid var(--grey-100);
    background: var(--off-white); font-size: 1rem; outline: none; transition: border 0.3s; margin-bottom: 20px;
  }
  .modal-input:focus { border-color: var(--primary-light); background: var(--white); }
</style>

<div class="modal-overlay" id="consultationModal">
  <div class="modal-card">
    <button class="modal-close" onclick="closeConsultationModal()">&times;</button>
    <h3 style="font-family: var(--font-heading); font-size: 1.8rem; color: var(--grey-800); margin-bottom: 8px;">Final Consultation</h3>
    <p style="color: var(--grey-500); font-size: 0.95rem; margin-bottom: 24px;">Enter your details below to receive your personalized PDF quote directly to your email.</p>
    
    <form id="consultationForm" onsubmit="submitConsultation(event)">
      <input type="text" id="custName" class="modal-input" placeholder="Full Name" required>
      <input type="email" id="custEmail" class="modal-input" placeholder="Email Address" required>
      <input type="tel" id="custPhone" class="modal-input" placeholder="Phone Number" required>
      <input type="text" id="custAddress" class="modal-input" placeholder="District & Upazila" required>
      
      <button type="submit" id="submitQuoteBtn" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 16px; font-size: 1.1rem; border-radius: 12px; margin-top: 8px;">Send My PDF Quote</button>
    </form>
    <div id="quoteMessage" style="margin-top: 16px; font-size: 0.95rem; text-align: center; font-weight: 600; display: none;"></div>
  </div>
</div>

<script>
  function openConsultationModal() {
    const modal = document.getElementById('consultationModal');
    modal.style.display = 'flex';
    // Small delay to allow CSS transition
    setTimeout(() => { modal.classList.add('open'); }, 10);
  }
  
  function closeConsultationModal() {
    const modal = document.getElementById('consultationModal');
    modal.classList.remove('open');
    setTimeout(() => { modal.style.display = 'none'; }, 300);
  }

  async function submitConsultation(e) {
    e.preventDefault();
    
    const btn = document.getElementById('submitQuoteBtn');
    const msg = document.getElementById('quoteMessage');
    const name = document.getElementById('custName').value;
    const email = document.getElementById('custEmail').value;
    const phone = document.getElementById('custPhone').value;
    const address = document.getElementById('custAddress').value;
    
    // Gather Calc Data
    const model = document.getElementById('c1-val-model').innerText;
    const area = document.getElementById('c1-val-area').innerText;
    const finish = document.getElementById('c1-val-finish').innerText;
    const total_cost = document.getElementById('calc1-result').innerText;
    const down_payment = document.getElementById('c2-val-down').innerText;
    const loan_amount = document.getElementById('c2-val-loan').innerText;
    const emi = document.getElementById('calc2-result').innerText;
    const tenure = document.getElementById('calc2-tenure').value;
    const rate = document.getElementById('calc2-rate').value;
    
    // Validate
    if(!model || model === '-' || total_cost === 'BDT 0') {
        msg.style.display = 'block';
        msg.style.color = 'var(--error)';
        msg.innerText = "Please select a valid model in Step 2 first.";
        return;
    }

    btn.innerText = 'Generating PDF & Sending...';
    btn.style.opacity = '0.7';
    btn.disabled = true;
    
    const payload = {
        name, email, phone, address,
        model, area, finish, total_cost, down_payment, loan_amount, emi, tenure, rate
    };

    try {
        const res = await fetch('send_calculator_pdf.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        msg.style.display = 'block';
        if(res.ok) {
            msg.style.color = 'var(--success)';
            msg.innerText = "Success! Your PDF has been emailed to you.";
            setTimeout(closeConsultationModal, 3000);
        } else {
            msg.style.color = 'var(--error)';
            msg.innerText = data.message || "An error occurred.";
            btn.disabled = false;
            btn.innerText = 'Send My PDF Quote';
            btn.style.opacity = '1';
        }
    } catch(err) {
        msg.style.display = 'block';
        msg.style.color = 'var(--error)';
        msg.innerText = "Network Error. Please try again.";
        btn.disabled = false;
        btn.innerText = 'Send My PDF Quote';
        btn.style.opacity = '1';
    }
  }
</script>
"""

# Insert modal HTML just before </main>
if '</main>' in template:
    template = template.replace('</main>', modal_html + '\n</main>')
else:
    template = template + modal_html

with open(r"e:\web\Bongshaihousing\solutions.html", "w", encoding="utf-8") as f:
    f.write(template)

print("Added consultation modal and AJAX integration to solutions.html")
