import os, subprocess, time

FTP_HOST = "ftp.bongshaixpress.com"
FTP_USER = os.environ.get('BONGSHAI_FTP_USER', 'aaa@bongshaihousing.com')
FTP_PASS = os.environ.get('BONGSHAI_FTP_PASS')
if not FTP_PASS:
    raise RuntimeError('BONGSHAI_FTP_PASS env var not set - never hardcode the live FTP password in a committed script.')
USER_PASS = f"{FTP_USER}:{FTP_PASS}"

FILES = [
    ("index.html", "bongshaihousing.com/index.html"),
    ("css/style.css", "bongshaihousing.com/css/style.css"),
    ("css/style.min.css", "bongshaihousing.com/css/style.min.css"),
]

CATEGORIES = ['duplex', 'simplex', 'cottage', 'container', 'steel']
for cat in CATEGORIES:
    for suffix in ['', '-mobile', '-tablet']:
        local = f"images/products/hero-{cat}-banner{suffix}.webp"
        FILES.append((local, f"bongshaihousing.com/{local}"))

def upload(local_path, remote_path):
    target_url = f"ftp://{FTP_HOST}/{remote_path}"
    cmd = ['curl.exe', '--ssl-reqd', '-k', '--ftp-create-dirs', '--user', USER_PASS,
           '-T', local_path, target_url, '-s', '-w', '%{http_code}']
    for attempt in range(1, 4):
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        code = res.stdout.strip()
        if code in ('226', '250'):
            print(f"[OK] ({code}) {local_path} -> {remote_path}")
            return True
        time.sleep(1)
    print(f"[FAIL] {local_path} -> {remote_path} : {res.stdout} {res.stderr}")
    return False

failed = 0
for local_path, remote_path in FILES:
    if not upload(local_path, remote_path):
        failed += 1

print(f"\nDone: {len(FILES) - failed}/{len(FILES)} uploaded successfully.")
