import glob, re

about_dropdown_target = '''<a class="dropdown-item" href="faq.html" role="menuitem">
<div class="dropdown-icon">❓</div>
<div><strong style="display:block;font-size:0.8rem;color:var(--primary)">FAQ</strong></div>
</a>'''

about_dropdown_replacement = '''<a class="dropdown-item" href="faq.html" role="menuitem">
<div class="dropdown-icon">❓</div>
<div><strong style="display:block;font-size:0.8rem;color:var(--primary)">FAQ</strong></div>
</a>
<a class="dropdown-item" href="agent/signup.html" role="menuitem">
<div class="dropdown-icon">🤝</div>
<div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Become an Agent</strong></div>
</a>
<a class="dropdown-item" href="my-project/login.html" role="menuitem">
<div class="dropdown-icon">📊</div>
<div><strong style="display:block;font-size:0.8rem;color:var(--primary)">Track My Project</strong></div>
</a>'''

footer_quick_target = '''<a class="footer-link" href="contact.html">Contact Us</a>'''
footer_quick_replacement = '''<a class="footer-link" href="contact.html">Contact Us</a>
<a class="footer-link" href="agent/signup.html">🤝 Become an Agent</a>
<a class="footer-link" href="agent/login.html">Agent Login</a>
<a class="footer-link" href="my-project/login.html">Track Project</a>'''

footer_legal_target = '''<nav aria-label="Legal links" class="footer-legal">
<a href="privacy-policy.html">Privacy Policy</a>
<a href="terms.html">Terms &amp; Conditions</a>
<a href="sitemap.xml">Sitemap</a>
</nav>'''

footer_legal_replacement = '''<nav aria-label="Legal links" class="footer-legal">
<a href="privacy-policy.html">Privacy Policy</a>
<a href="terms.html">Terms &amp; Conditions</a>
<a href="sitemap.xml">Sitemap</a>
<a href="admin/login">Admin</a>
</nav>'''

portal_drawer_block = '''      <div>
        <button class="mobile-nav-link" style="width:100%;background:none;border:none;cursor:pointer;text-align:left;font-size:var(--fs-base);font-weight:500;color:var(--grey-800);display:flex;justify-content:space-between;padding:var(--space-4) 0;border-bottom:1px solid var(--grey-100);" onclick="this.nextElementSibling.classList.toggle('open')">Portals &amp; Tracking <span>▾</span>
        </button>
        <div class="mobile-sub-links">
          <a href="agent/signup.html" class="mobile-sub-link">🤝 Become an Agent</a>
          <a href="agent/login.html" class="mobile-sub-link">Agent Login</a>
          <a href="my-project/login.html" class="mobile-sub-link">Track My Project</a>
          <a href="admin/login" class="mobile-sub-link">Admin Portal</a>
        </div>
      </div>'''

html_files = glob.glob('*.html')
count = 0

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    changed = False

    # 1. Update About dropdown if not already present
    if 'agent/signup.html' not in content and about_dropdown_target in content:
        content = content.replace(about_dropdown_target, about_dropdown_replacement)
        changed = True

    # 2. Update Footer Quick Links if not already present
    if '🤝 Become an Agent' not in content and footer_quick_target in content:
        content = content.replace(footer_quick_target, footer_quick_replacement)
        changed = True

    # 3. Update Footer Legal Links
    if 'admin/login' not in content and footer_legal_target in content:
        content = content.replace(footer_legal_target, footer_legal_replacement)
        changed = True

    # 4. Update Mobile Drawer
    if 'Portals &amp; Tracking' not in content:
        m_target = '<a href="contact.html" class="mobile-nav-link">Contact</a>\n    </div>'
        m_target_alt = '<a href="contact.html" class="mobile-nav-link">Contact</a>\r\n    </div>'
        m_target_3 = '<a class="mobile-nav-link" href="contact.html">Contact</a>\n    </div>'
        m_target_4 = '<a class="mobile-nav-link" href="contact.html">Contact</a>\r\n    </div>'
        
        if m_target in content:
            content = content.replace(m_target, '<a href="contact.html" class="mobile-nav-link">Contact</a>\n' + portal_drawer_block + '\n    </div>')
            changed = True
        elif m_target_alt in content:
            content = content.replace(m_target_alt, '<a href="contact.html" class="mobile-nav-link">Contact</a>\r\n' + portal_drawer_block + '\r\n    </div>')
            changed = True
        elif m_target_3 in content:
            content = content.replace(m_target_3, '<a class="mobile-nav-link" href="contact.html">Contact</a>\n' + portal_drawer_block + '\n    </div>')
            changed = True
        elif m_target_4 in content:
            content = content.replace(m_target_4, '<a class="mobile-nav-link" href="contact.html">Contact</a>\r\n' + portal_drawer_block + '\r\n    </div>')
            changed = True

    if changed:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        count += 1

print(f"Updated portal and navigation links across {count} HTML files.")
