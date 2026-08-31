import urllib.request
import ssl
import sys

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def http_error_302(self, req, fp, code, msg, headers):
        return fp
    http_error_301 = http_error_302

opener = urllib.request.build_opener(NoRedirectHandler)

urls = [
    'https://bongshaihousing.com/industrial-sheds.html',
    'https://bongshaihousing.com/worker-accommodation.html',
    'https://bongshaihousing.com/bh-is-1001.html',
    'https://bongshaihousing.com/bh-wa-1101.html'
]

print("=== 1. Checking Redirects ===")
for u in urls:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        res = opener.open(req)
        loc = res.headers.get('Location')
        print(f"{u} -> HTTP {res.status} (Location: {loc})")
    except Exception as e:
        print(f"{u} -> ERR: {e}")

print("\n=== 2. Checking Homepage for Discontinued Lines ===")
try:
    req = urllib.request.Request('https://bongshaihousing.com/', headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')
    m1 = html.count('Industrial Steel Sheds')
    m2 = html.count('Worker Accommodation')
    print(f"Homepage matches for 'Industrial Steel Sheds': {m1}")
    print(f"Homepage matches for 'Worker Accommodation': {m2}")
except Exception as e:
    print(f"Homepage ERR: {e}")

print("\n=== 3. Checking Surviving Pages Sidebar ===")
for p in ['https://bongshaihousing.com/bh-dv-202.html', 'https://bongshaihousing.com/apartment-building.html']:
    try:
        req = urllib.request.Request(p, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')
        m = html.count('Commercial & Industrial') + html.count('Commercial &amp; Industrial')
        print(f"{p} matches for 'Commercial & Industrial': {m}")
    except Exception as e:
        print(f"{p} ERR: {e}")
