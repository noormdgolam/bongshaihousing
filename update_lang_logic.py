import os
import glob
import re

css_to_add = """
/* ==========================================================================
   Language Selection Modal
   ========================================================================== */
.lang-modal-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}
.lang-modal-overlay.active {
  opacity: 1;
  visibility: visible;
}
.lang-modal {
  background: var(--white);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  width: 90%;
  max-width: 450px;
  box-shadow: var(--shadow-xl);
  transform: translateY(20px);
  transition: transform 0.3s ease;
  position: relative;
}
.lang-modal-overlay.active .lang-modal {
  transform: translateY(0);
}
.lang-modal-header {
  text-align: center;
  margin-bottom: var(--space-5);
}
.lang-modal-header h3 {
  font-family: var(--font-heading);
  color: var(--primary);
  font-size: var(--fs-2xl);
  margin-bottom: var(--space-2);
}
.lang-modal-header p {
  color: var(--grey-600);
  font-size: var(--fs-sm);
}
.lang-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}
.lang-btn {
  background: var(--off-white);
  border: 1px solid var(--grey-200);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--grey-800);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.lang-btn:hover {
  background: var(--primary-light);
  color: var(--white);
  border-color: var(--primary-light);
}
.lang-btn.default-lang {
  background: var(--primary);
  color: var(--white);
  border-color: var(--primary);
}
.lang-btn.default-lang:hover {
  background: var(--primary-dark);
}
.lang-close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 24px;
  color: var(--grey-400);
  cursor: pointer;
  transition: color 0.2s;
}
.lang-close-btn:hover {
  color: var(--grey-800);
}
"""

with open('css/style.css', 'r', encoding='utf-8') as f:
    css_content = f.read()

if 'Language Selection Modal' not in css_content:
    with open('css/style.css', 'a', encoding='utf-8') as f:
        f.write(css_to_add)
    print("Added CSS to style.css")
else:
    print("CSS already present in style.css")

modal_html = """
  <!-- Language Selection Modal -->
  <div class="lang-modal-overlay" id="langModal">
    <div class="lang-modal">
      <button class="lang-close-btn" onclick="closeLangModal()" aria-label="Close">×</button>
      <div class="lang-modal-header">
        <h3>Select Your Language</h3>
        <p>Choose your preferred language for browsing.</p>
      </div>
      <div class="lang-grid">
        <button class="lang-btn default-lang" onclick="selectLang('en')">🇬🇧 English</button>
        <button class="lang-btn" onclick="selectLang('bn')">🇧🇩 বাংলা</button>
        <button class="lang-btn" onclick="selectLang('zh-CN')">🇨🇳 中文</button>
        <button class="lang-btn" onclick="selectLang('hi')">🇮🇳 हिन्दी</button>
        <button class="lang-btn" onclick="selectLang('ja')">🇯🇵 日本語</button>
        <button class="lang-btn" onclick="selectLang('ko')">🇰🇷 한국어</button>
        <button class="lang-btn" onclick="selectLang('ar')">🇸🇦 العربية</button>
      </div>
    </div>
  </div>
"""

js_logic = """
    function getCookie(name) {
      var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      if (match) return match[2];
      return null;
    }
    function setCookie(name, value, days) {
      var expires = "";
      if (days) {
          var date = new Date();
          date.setTime(date.getTime() + (days*24*60*60*1000));
          expires = "; expires=" + date.toUTCString();
      }
      document.cookie = name + "=" + (value || "")  + expires + "; path=/; domain=" + window.location.hostname;
      document.cookie = name + "=" + (value || "")  + expires + "; path=/"; 
    }

    document.addEventListener("DOMContentLoaded", function() {
      // Toggle custom dropdown
      var desktopDropdown = document.querySelector('.lang-selector-wrap > .btn-outline');
      if (desktopDropdown) {
        desktopDropdown.addEventListener('click', function(e) {
          var content = this.nextElementSibling;
          content.style.display = content.style.display === 'block' ? 'none' : 'block';
          e.stopPropagation();
        });
        document.addEventListener('click', function() {
          var content = desktopDropdown.nextElementSibling;
          if(content) content.style.display = 'none';
        });
      }

      var currentLangCookie = getCookie('googtrans');
      var activeLang = currentLangCookie ? currentLangCookie.split('/').pop() : 'en';
      if(typeof updateLangBtnText === 'function') {
        updateLangBtnText(activeLang);
      }

      // Check if user has seen popup
      var hasSeenPopup = getCookie('has_seen_lang_popup');
      if (!hasSeenPopup) {
        setTimeout(function() {
          var modal = document.getElementById('langModal');
          if(modal) {
            modal.classList.add('active');
          }
        }, 500); // Show popup after 500ms
      }
    });

    function closeLangModal() {
      var modal = document.getElementById('langModal');
      if(modal) {
        modal.classList.remove('active');
      }
      setCookie('has_seen_lang_popup', 'true', 365);
    }

    function selectLang(langCode) {
      closeLangModal();
      if (langCode === 'en') {
        // If English, we just clear the googtrans cookie or let it be default
        // Setting it to en/en avoids translation overhead
        setCookie('googtrans', '/en/en', 30);
      } else {
        setCookie('googtrans', '/en/' + langCode, 30);
      }
      window.location.reload();
    }
"""

import sys

for filepath in glob.glob('*.html'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    modified = False

    # 1. Insert modal html right before <!-- ======================================================
    #    GOOGLE TRANSLATE
    if 'id="langModal"' not in content:
        # find where to inject modal
        insert_idx = content.find('<!-- ======================================================\n       GOOGLE TRANSLATE')
        if insert_idx == -1:
            insert_idx = content.find('<div id="google_translate_element"')
            
        if insert_idx != -1:
            content = content[:insert_idx] + modal_html + '\n  ' + content[insert_idx:]
            modified = True

    # 2. Replace the DOMContentLoaded script
    # It starts at document.addEventListener("DOMContentLoaded", function() {
    # and ends right before function changeLanguage(langCode)
    
    pattern = re.compile(r'document\.addEventListener\("DOMContentLoaded", function\(\) \{.*?(?=\n\s+function changeLanguage\()', re.DOTALL)
    
    if re.search(pattern, content):
        content = re.sub(pattern, js_logic.strip(), content)
        modified = True
    else:
        # Some files might have different structure, try a more relaxed pattern
        pattern2 = re.compile(r'document\.addEventListener\("DOMContentLoaded", function\(\) \{.*?(?=function changeLanguage\()', re.DOTALL)
        if re.search(pattern2, content):
            content = re.sub(pattern2, js_logic.strip() + '\n\n    ', content)
            modified = True
            
    # Remove geojs fetch entirely if it still lingers outside
    if 'fetch(\'https://get.geojs.io/v1/ip/country.json\')' in content:
        # Should be covered by regex, but just in case
        pass

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
