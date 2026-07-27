import os
import re

def refine_contact_js():
    contact_file = r'e:\web\Bongshaihousing\contact.html'
    with open(contact_file, 'r', encoding='utf-8') as f:
        content = f.read()

    js_code = '''
  <script>
    const areaMapping = {
      'DEFAULT': ['Select Floor Area', '350 Sq.Ft', '440 Sq.Ft', '650 Sq.Ft', '750 Sq.Ft', '950 Sq.Ft', '1200 Sq.Ft', '1500 Sq.Ft', '2500 Sq.Ft', '5000+ Sq.Ft'],
      'TH': ['350 Sq.Ft', '440 Sq.Ft'],
      'WH': ['350 Sq.Ft', '440 Sq.Ft'],
      'TSB': ['650x2 Sq.Ft', '750x2 Sq.Ft', '950x2 Sq.Ft', '1200x2 Sq.Ft'],
      'DV': ['650x2 Sq.Ft', '750x2 Sq.Ft', '950x2 Sq.Ft', '1200x2 Sq.Ft'],
      'LCV': ['650x2 Sq.Ft', '750x2 Sq.Ft', '950x2 Sq.Ft', '1200x2 Sq.Ft'],
      'SB': ['650 Sq.Ft', '750 Sq.Ft', '950 Sq.Ft', '1200 Sq.Ft'],
      'CH': ['650 Sq.Ft', '750 Sq.Ft', '950 Sq.Ft', '1200 Sq.Ft'],
      'SH': ['650 Sq.Ft', '750 Sq.Ft', '950 Sq.Ft', '1200 Sq.Ft'],
      'CB': ['650 Sq.Ft', '750 Sq.Ft', '950 Sq.Ft', '1200 Sq.Ft'],
      'IS': ['1500 Sq.Ft', '2500 Sq.Ft', '5000 Sq.Ft', '10000 Sq.Ft'],
      'WA': ['1000 Sq.Ft', '2000 Sq.Ft', '3000 Sq.Ft'],
      'SO': ['300 Sq.Ft', '600 Sq.Ft', '900 Sq.Ft'],
      'SK': ['50 Sq.Ft', '100 Sq.Ft', '150 Sq.Ft']
    };

    function updateAreaOptions(modelValue) {
      const areaSelect = document.getElementById('floor_area');
      if (!areaSelect) return;

      let key = 'DEFAULT';
      if (modelValue.includes('BH-TH')) key = 'TH';
      else if (modelValue.includes('BH-WH')) key = 'WH';
      else if (modelValue.includes('BH-TSB')) key = 'TSB';
      else if (modelValue.includes('BH-DV') || modelValue.includes('LCV')) key = 'DV';
      else if (modelValue.includes('BH-SB')) key = 'SB';
      else if (modelValue.includes('BH-CH')) key = 'CH';
      else if (modelValue.includes('BH-SH')) key = 'SH';
      else if (modelValue.includes('BH-CB')) key = 'CB';
      else if (modelValue.includes('BH-IS')) key = 'IS';
      else if (modelValue.includes('BH-WA')) key = 'WA';
      else if (modelValue.includes('BH-SO')) key = 'SO';
      else if (modelValue.includes('BH-SK')) key = 'SK';

      const optionsList = areaMapping[key] || areaMapping['DEFAULT'];
      areaSelect.innerHTML = '';
      optionsList.forEach(optVal => {
        const opt = document.createElement('option');
        opt.value = optVal;
        opt.textContent = optVal;
        areaSelect.appendChild(opt);
      });
    }

    document.addEventListener('DOMContentLoaded', () => {
      const modelSelect = document.getElementById('model');
      if (modelSelect) {
        updateAreaOptions(modelSelect.value);
        modelSelect.addEventListener('change', function() {
          updateAreaOptions(this.value);
        });
      }
    });
  </script>
'''

    if '</form>' in content:
        content = content.replace('</form>', '</form>\n' + js_code)

    with open(contact_file, 'w', encoding='utf-8') as f:
        f.write(content)

    print("Added updateAreaOptions listener to contact.html.")

if __name__ == "__main__":
    refine_contact_js()
