import os
import glob
import re

# Read the old strings from inject_lang.py to exactly match and remove them
with open('inject_lang.py', 'r', encoding='utf-8') as f:
    code = f.read()

# Extract old strings safely
desktop_old = re.search(r'desktop_menu_html = """(.*?)"""', code, re.DOTALL).group(1).strip() + '\n        '
mobile_old = re.search(r'mobile_menu_html = """(.*?)"""', code, re.DOTALL).group(1).strip() + '\n      '
body_old = re.search(r'body_end_html = """(.*?)"""', code, re.DOTALL).group(1)

desktop_new = """
        <!-- Language Dropdown -->
        <div class="dropdown" role="menu" style="position:relative; margin-right:1rem; display:flex; align-items:center;">
          <a href="javascript:void(0);" class="btn btn-outline btn-sm" role="menuitem" style="padding:0.4rem 0.8rem; border-color:var(--grey-200); color:var(--grey-800); font-weight:500; display:flex; align-items:center;">
            🌐 <span id="desktop-lang-text" style="margin-left:6px;">Language</span>
            <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true" style="margin-left:4px; width:14px; height:14px;"><polyline points="6 9 12 15 18 9"/></svg>
          </a>
          <div class="dropdown-content" style="display:none; position:absolute; right:0; top:100%; background:#fff; min-width:150px; box-shadow:var(--shadow-lg); border-radius:var(--radius-md); padding:var(--space-2); z-index:100; margin-top:8px;">
            <a href="javascript:void(0);" onclick="changeLanguage('en')" class="dropdown-item" style="padding:var(--space-2) var(--space-3); font-size:var(--fs-sm);">English</a>
            <a href="javascript:void(0);" onclick="changeLanguage('bn')" class="dropdown-item" style="padding:var(--space-2) var(--space-3); font-size:var(--fs-sm);">বাংলা (Bangla)</a>
            <a href="javascript:void(0);" onclick="changeLanguage('zh-CN')" class="dropdown-item" style="padding:var(--space-2) var(--space-3); font-size:var(--fs-sm);">中文 (Chinese)</a>
            <a href="javascript:void(0);" onclick="changeLanguage('hi')" class="dropdown-item" style="padding:var(--space-2) var(--space-3); font-size:var(--fs-sm);">हिन्दी (Hindi)</a>
            <a href="javascript:void(0);" onclick="changeLanguage('ja')" class="dropdown-item" style="padding:var(--space-2) var(--space-3); font-size:var(--fs-sm);">日本語 (Japanese)</a>
            <a href="javascript:void(0);" onclick="changeLanguage('ko')" class="dropdown-item" style="padding:var(--space-2) var(--space-3); font-size:var(--fs-sm);">한국어 (Korean)</a>
            <a href="javascript:void(0);" onclick="changeLanguage('ar')" class="dropdown-item" style="padding:var(--space-2) var(--space-3); font-size:var(--fs-sm);">العربية (Arabic)</a>
          </div>
        </div>
"""

mobile_new = """
      <div style="margin-bottom:var(--space-3);">
        <button class="btn btn-outline" style="width:100%; justify-content:space-between; padding:var(--space-3);" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display==='block'?'none':'block'">
          <span>🌐 <span id="mobile-lang-text" style="margin-left:6px;">Language</span></span> <span>▾</span>
        </button>
        <div style="display:none; background:var(--grey-50); border-radius:var(--radius-md); margin-top:4px; padding:var(--space-2) 0;">
          <a href="javascript:void(0);" onclick="changeLanguage('en')" class="mobile-sub-link" style="padding:var(--space-2) var(--space-4);">English</a>
          <a href="javascript:void(0);" onclick="changeLanguage('bn')" class="mobile-sub-link" style="padding:var(--space-2) var(--space-4);">বাংলা (Bangla)</a>
          <a href="javascript:void(0);" onclick="changeLanguage('zh-CN')" class="mobile-sub-link" style="padding:var(--space-2) var(--space-4);">中文 (Chinese)</a>
          <a href="javascript:void(0);" onclick="changeLanguage('hi')" class="mobile-sub-link" style="padding:var(--space-2) var(--space-4);">हिन्दी (Hindi)</a>
          <a href="javascript:void(0);" onclick="changeLanguage('ja')" class="mobile-sub-link" style="padding:var(--space-2) var(--space-4);">日本語 (Japanese)</a>
          <a href="javascript:void(0);" onclick="changeLanguage('ko')" class="mobile-sub-link" style="padding:var(--space-2) var(--space-4);">한국어 (Korean)</a>
          <a href="javascript:void(0);" onclick="changeLanguage('ar')" class="mobile-sub-link" style="padding:var(--space-2) var(--space-4);">العربية (Arabic)</a>
        </div>
      </div>
"""

body_new = """
  <!-- ======================================================
       GOOGLE TRANSLATE & IP AUTO-SELECTION
  ====================================================== -->
  <div id="google_translate_element" style="display:none;"></div>
  <script type="text/javascript">
    function googleTranslateElementInit() {
      new google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,bn,zh-CN,hi,ja,ko,ar',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
      }, 'google_translate_element');
    }
  </script>
  <script type="text/javascript" src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>

  <script>
    function updateLangBtnText(langCode) {
      var langNames = {
        'en': 'English', 'bn': 'Bangla', 'zh-CN': 'Chinese',
        'hi': 'Hindi', 'ja': 'Japanese', 'ko': 'Korean', 'ar': 'Arabic'
      };
      var name = langNames[langCode] || 'Language';
      var desktopBtn = document.getElementById('desktop-lang-text');
      if(desktopBtn) desktopBtn.textContent = name;
      var mobileBtn = document.getElementById('mobile-lang-text');
      if(mobileBtn) mobileBtn.textContent = name;
    }

    document.addEventListener("DOMContentLoaded", function() {
      // Toggle custom dropdown
      var desktopDropdown = document.querySelector('.dropdown > .btn-outline');
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

      var currentLangCookie = getCookie('googtrans');
      var activeLang = currentLangCookie ? currentLangCookie.split('/').pop() : 'en';
      updateLangBtnText(activeLang);

      if (!currentLangCookie) {
        fetch('https://get.geojs.io/v1/ip/country.json')
          .then(res => res.json())
          .then(data => {
            var country = data.country;
            var targetLang = 'en'; 
            var langMap = {
              'BD': 'bn', 
              'CN': 'zh-CN', 'TW': 'zh-CN', 'HK': 'zh-CN',
              'IN': 'hi', 
              'JP': 'ja', 
              'KR': 'ko', 
              'SA': 'ar', 'AE': 'ar', 'EG': 'ar', 'QA': 'ar', 'KW': 'ar', 'OM': 'ar', 'BH': 'ar', 'JO': 'ar', 'LB': 'ar'
            };
            if (langMap[country]) {
              targetLang = langMap[country];
            }
            if (targetLang !== 'en') {
              setCookie('googtrans', '/en/' + targetLang, 30);
              window.location.reload();
            }
          })
          .catch(err => console.error("Error fetching geojs:", err));
      }
    });

    function changeLanguage(langCode) {
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
      setCookie('googtrans', '/en/' + langCode, 30);
      window.location.reload();
    }
  </script>
</body>
"""

for filepath in glob.glob('*.html'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Remove old insertions
    content = content.replace(desktop_old, "")
    content = content.replace(mobile_old, "")
    content = content.replace(body_old, "</body>")
    
    # Skip if we already injected new?
    if 'id="desktop-lang-text"' in content:
        continue
        
    # Inject new desktop in .nav-cta
    content = content.replace('<div class="nav-cta">', '<div class="nav-cta">\n' + desktop_new.strip('\n'))
    
    # Inject new mobile in .mobile-drawer
    content = content.replace('<div style="margin-top:var(--space-8);display:flex;flex-direction:column;gap:var(--space-3);">', mobile_new.strip('\n') + '\n    <div style="margin-top:var(--space-8);display:flex;flex-direction:column;gap:var(--space-3);">')
    
    # Inject new body end
    content = content.replace('</body>', body_new)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Reinjection complete.")
