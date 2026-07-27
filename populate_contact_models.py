import os
import glob
import re
import json

def update_contact_form():
    contact_file = r'e:\web\Bongshaihousing\contact.html'
    with open(contact_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Define model area mappings for all categories
    # Series mappings:
    # TSB (BH-TSB-101 to 112): 650x2, 750x2, 950x2, 1200x2
    # DV (BH-DV-101/201 to 113/213): 650x2, 750x2, 950x2, 1200x2
    # SB (BH-SB-301 to 312): 650, 750, 950, 1200
    # CH (BH-CH-401 to 412 & 501 to 512): 650, 750, 950, 1200
    # SH (BH-SH-601 to 612): 650, 750, 950, 1200
    # TH (BH-TH-701 to 712): 350, 440
    # WH (BH-WH-801 to 812): 350, 440
    # CB (BH-CB-901 to 912): 650, 750, 950, 1200
    # IS (BH-IS-1001 to 1012): 1500, 2500, 5000, 10000
    # WA (BH-WA-1101 to 1112): 1000, 2000, 3000
    # SO (BH-SO-1201 to 1212): 300, 600, 900
    # SK (BH-SK-1301 to 1312): 50, 100, 150

    model_options_html = '''<select id="model" name="model" class="form-control" onchange="updateAreaOptions(this.value)">
                    <option value="General Inquiry">General Inquiry / Custom Project</option>
                    
                    <optgroup label="🏢 Two Story Building (BH-TSB)">
'''
    for i in range(101, 113):
        model_options_html += f'                      <option value="BH-TSB-{i}">Model No-BH-TSB-{i}</option>\n'
    model_options_html += '                    </optgroup>\n\n                    <optgroup label="🏘️ Duplex Villa (BH-DV)">\n'
    for i in range(201, 214):
        model_options_html += f'                      <option value="BH-DV-{i}">Model No-BH-DV-{i}</option>\n'
    for i in range(101, 110):
        model_options_html += f'                      <option value="LCV-{i}">Model LCV-{i}</option>\n'
    model_options_html += '                    </optgroup>\n\n                    <optgroup label="🏠 Single Story Building (BH-SB)">\n'
    for i in range(301, 313):
        model_options_html += f'                      <option value="BH-SB-{i}">Model No-BH-SB-{i}</option>\n'
    model_options_html += '                    </optgroup>\n\n                    <optgroup label="🏡 Cottage House (BH-CH)">\n'
    for i in range(401, 413):
        model_options_html += f'                      <option value="BH-CH-{i}">Model No-BH-CH-{i}</option>\n'
    for i in range(501, 513):
        model_options_html += f'                      <option value="BH-CH-{i}">Model No-BH-CH-{i}</option>\n'
    model_options_html += '                    </optgroup>\n\n                    <optgroup label="🏗️ Steel House (BH-SH)">\n'
    for i in range(601, 613):
        model_options_html += f'                      <option value="BH-SH-{i}">Model No-BH-SH-{i}</option>\n'
    model_options_html += '                    </optgroup>\n\n                    <optgroup label="🏠 Tiny House (BH-TH)">\n'
    for i in range(701, 713):
        model_options_html += f'                      <option value="BH-TH-{i}">Model No-BH-TH-{i}</option>\n'
    model_options_html += '                    </optgroup>\n\n                    <optgroup label="🌲 Wooden House (BH-WH)">\n'
    for i in range(801, 814):
        model_options_html += f'                      <option value="BH-WH-{i}">Model No-BH-WH-{i}</option>\n'
    model_options_html += '                    </optgroup>\n\n                    <optgroup label="🏢 Concrete Building (BH-CB)">\n'
    for i in range(901, 913):
        model_options_html += f'                      <option value="BH-CB-{i}">Model No-BH-CB-{i}</option>\n'
    model_options_html += '                    </optgroup>\n\n                    <optgroup label="🏭 Industrial Sheds (BH-IS)">\n'
    for i in range(1001, 1013):
        model_options_html += f'                      <option value="BH-IS-{i}">Model No-BH-IS-{i}</option>\n'
    model_options_html += '                    </optgroup>\n\n                    <optgroup label="🛌 Worker Accommodation (BH-WA)">\n'
    for i in range(1101, 1113):
        model_options_html += f'                      <option value="BH-WA-{i}">Model No-BH-WA-{i}</option>\n'
    model_options_html += '                    </optgroup>\n\n                    <optgroup label="🏢 Site Offices (BH-SO)">\n'
    for i in range(1201, 1213):
        model_options_html += f'                      <option value="BH-SO-{i}">Model No-BH-SO-{i}</option>\n'
    model_options_html += '                    </optgroup>\n\n                    <optgroup label="🛡️ Security Kiosks (BH-SK)">\n'
    for i in range(1301, 1313):
        model_options_html += f'                      <option value="BH-SK-{i}">Model No-BH-SK-{i}</option>\n'
    model_options_html += '                    </optgroup>\n                  </select>'

    # Replace <select id="model"...>...</select> in contact.html
    content = re.sub(r'<select id="model" name="model" class="form-control">.*?</select>', model_options_html, content, flags=re.DOTALL)

    # JS code for dynamic area dropdown update
    js_area_script = '''
  <script>
    const areaMapping = {
      'DEFAULT': ['Select Area', '350 Sq.Ft', '440 Sq.Ft', '650 Sq.Ft', '750 Sq.Ft', '950 Sq.Ft', '1200 Sq.Ft', '1500 Sq.Ft', '2500 Sq.Ft', '5000+ Sq.Ft'],
      'TH': ['350 Sq.Ft', '440 Sq.Ft'],
      'WH': ['350 Sq.Ft', '440 Sq.Ft'],
      'TSB': ['650x2 Sq.Ft (1300 Total)', '750x2 Sq.Ft (1500 Total)', '950x2 Sq.Ft (1900 Total)', '1200x2 Sq.Ft (2400 Total)'],
      'DV': ['650x2 Sq.Ft (1300 Total)', '750x2 Sq.Ft (1500 Total)', '950x2 Sq.Ft (1900 Total)', '1200x2 Sq.Ft (2400 Total)'],
      'LCV': ['650x2 Sq.Ft (1300 Total)', '750x2 Sq.Ft (1500 Total)', '950x2 Sq.Ft (1900 Total)', '1200x2 Sq.Ft (2400 Total)'],
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

    // Call update on page load if model is pre-selected
    document.addEventListener('DOMContentLoaded', () => {
      const modelSelect = document.getElementById('model');
      if (modelSelect) {
        updateAreaOptions(modelSelect.value);
      }
    });
  </script>
'''

    # Append script before </body>
    if 'updateAreaOptions' not in content:
        content = content.replace('</body>', js_area_script + '\n</body>')

    # Also update pre-fill code in contact.html so updateAreaOptions runs on URL params
    content = content.replace(
        'if(match) match.selected = true;',
        'if(match) { match.selected = true; updateAreaOptions(match.value); }'
    )

    with open(contact_file, 'w', encoding='utf-8') as f:
        f.write(content)

    print("Updated contact.html with all models and dynamic floor area selection.")

if __name__ == "__main__":
    update_contact_form()
