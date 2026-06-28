import os
import glob
import re

desktop_menu_html = """
        <li class="nav-item" role="none">
          <a href="javascript:void(0);" class="nav-link" role="menuitem">
            🌐 Lang
            <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
          </a>
          <div class="dropdown" role="menu" style="min-width:160px; padding:var(--space-2);">
            <a href="javascript:void(0);" onclick="changeLanguage('en')" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">English</a>
            <a href="javascript:void(0);" onclick="changeLanguage('bn')" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">বাংলা (Bangla)</a>
            <a href="javascript:void(0);" onclick="changeLanguage('zh-CN')" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">中文 (Chinese)</a>
            <a href="javascript:void(0);" onclick="changeLanguage('hi')" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">हिन्दी (Hindi)</a>
            <a href="javascript:void(0);" onclick="changeLanguage('ja')" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">日本語 (Japanese)</a>
            <a href="javascript:void(0);" onclick="changeLanguage('ko')" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">한국어 (Korean)</a>
            <a href="javascript:void(0);" onclick="changeLanguage('ar')" class="dropdown-item" role="menuitem" style="padding:var(--space-2) var(--space-3);">العربية (Arabic)</a>
          </div>
        </li>"""

mobile_menu_html = """
      <div>
        <button class="mobile-nav-link" style="width:100%;background:none;border:none;cursor:pointer;text-align:left;font-size:var(--fs-base);font-weight:500;color:var(--grey-800);display:flex;justify-content:space-between;padding:var(--space-4) 0;border-bottom:1px solid var(--grey-100);" onclick="this.nextElementSibling.classList.toggle('open')">
          🌐 Language <span>▾</span>
        </button>
        <div class="mobile-sub-links">
          <a href="javascript:void(0);" onclick="changeLanguage('en')" class="mobile-sub-link">English</a>
          <a href="javascript:void(0);" onclick="changeLanguage('bn')" class="mobile-sub-link">বাংলা (Bangla)</a>
          <a href="javascript:void(0);" onclick="changeLanguage('zh-CN')" class="mobile-sub-link">中文 (Chinese)</a>
          <a href="javascript:void(0);" onclick="changeLanguage('hi')" class="mobile-sub-link">हिन्दी (Hindi)</a>
          <a href="javascript:void(0);" onclick="changeLanguage('ja')" class="mobile-sub-link">日本語 (Japanese)</a>
          <a href="javascript:void(0);" onclick="changeLanguage('ko')" class="mobile-sub-link">한국어 (Korean)</a>
          <a href="javascript:void(0);" onclick="changeLanguage('ar')" class="mobile-sub-link">العربية (Arabic)</a>
        </div>
      </div>"""

body_end_html = """
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
    document.addEventListener("DOMContentLoaded", function() {
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
</body>"""

for filepath in glob.glob('*.html'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if 'google_translate_element' in content:
        continue # already injected
        
    # Inject desktop menu
    desktop_pattern = r'(<li class="nav-item" role="none">\s*<a href="contact.html" class="nav-link" role="menuitem">Contact</a>\s*</li>)'
    content = re.sub(desktop_pattern, desktop_menu_html.strip() + '\\n        \\1', content)
    
    # Inject mobile menu
    mobile_pattern = r'(<a href="contact.html" class="mobile-nav-link">📞 Contact</a>)'
    content = re.sub(mobile_pattern, mobile_menu_html.strip() + '\\n      \\1', content)
    
    # Inject body end
    content = content.replace('</body>', body_end_html)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Injection complete.")
