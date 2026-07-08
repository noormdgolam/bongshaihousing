import os
import re

GEO_TAGS = """  <!-- ═══ LOCAL SEO – Dhaka / Bangladesh ═══ -->
  <meta name="geo.region" content="BD-C" />
  <meta name="geo.placename" content="Uttara, Dhaka, Bangladesh" />
  <meta name="geo.position" content="23.8728;90.3984" />
  <meta name="ICBM" content="23.8728, 90.3984" />"""

OLD_FOOTER_ADDRESS = """            <div class="footer-contact-item">
              <span class="footer-contact-icon" aria-hidden="true">📍</span>
              <span>House #18, Road #18, Sector #10, Uttara C/A, Dhaka – 1230</span>
            </div>"""

NEW_FOOTER_ADDRESS = """            <div class="footer-contact-item" itemprop="address" itemscope itemtype="http://schema.org/PostalAddress">
              <span class="footer-contact-icon" aria-hidden="true">📍</span>
              <span>
                <span itemprop="streetAddress">House #18, Road #18, Sector #10</span>, 
                <span itemprop="addressLocality">Uttara C/A, Dhaka</span> – 
                <span itemprop="postalCode">1230</span>
                <span itemprop="addressCountry" style="display:none;">BD</span>
              </span>
            </div>"""

MAP_EMBED = """          </address>
          
          <!-- Local SEO Map Embed -->
          <div style="margin-top: 1.5rem; border-radius: 8px; overflow: hidden; height: 150px; border: 1px solid rgba(255,255,255,0.1);">
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3648.435773822986!2d90.395825!3d23.874158!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c43d7ab09001%3A0xcb1b7cb0e86b29d4!2sSector%2010%2C%20Uttara%2C%20Dhaka%201230!5e0!3m2!1sen!2sbd!4v1700000000000!5m2!1sen!2sbd" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Bongshai Housing Location"></iframe>
          </div>"""

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    changed = False

    # 1. Update Geo Tags
    if '<meta name="ICBM"' not in content:
        if '<!-- ═══ LOCAL SEO – Dhaka / Bangladesh ═══ -->\n  <meta name="geo.region" content="BD-C" />' in content:
            content = content.replace('<!-- ═══ LOCAL SEO – Dhaka / Bangladesh ═══ -->\n  <meta name="geo.region" content="BD-C" />', GEO_TAGS)
            changed = True
        elif '  <meta name="geo.region" content="BD-C" />' in content:
            content = content.replace('  <meta name="geo.region" content="BD-C" />', GEO_TAGS)
            changed = True
        elif '<meta content="BD-C" name="geo.region"/>' in content:
            content = content.replace('<meta content="BD-C" name="geo.region"/>', GEO_TAGS)
            changed = True
        elif '<meta name="geo.region" content="BD-C" />' in content:
            content = content.replace('<meta name="geo.region" content="BD-C" />', GEO_TAGS)
            changed = True

    # 2. Update Footer Schema
    if OLD_FOOTER_ADDRESS in content:
        content = content.replace(OLD_FOOTER_ADDRESS, NEW_FOOTER_ADDRESS)
        changed = True

    # 3. Embed Map
    if '<!-- Local SEO Map Embed -->' not in content:
        pattern1 = '<span>Sat – Thu: 9:00 AM – 7:00 PM</span>\n            </div>\n          </address>'
        if pattern1 in content:
             content = content.replace(pattern1, '<span>Sat – Thu: 9:00 AM – 7:00 PM</span>\n            </div>\n' + MAP_EMBED)
             changed = True
        else:
             # Try regex for variations in spacing
             match = re.search(r'<span>Sat – Thu: 9:00 AM – 7:00 PM</span>\s*</div>\s*</address>', content)
             if match:
                 content = content[:match.start()] + '<span>Sat – Thu: 9:00 AM – 7:00 PM</span>\n            </div>\n' + MAP_EMBED + content[match.end():]
                 changed = True

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")
    else:
        print(f"Skipped: {filepath} (Already updated or pattern not found)")

if __name__ == '__main__':
    for filename in os.listdir('.'):
        if filename.endswith('.html'):
            update_file(filename)
