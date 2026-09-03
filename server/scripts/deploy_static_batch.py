import os, subprocess, sys, time

FTP_HOST = "ftp.bongshaixpress.com"
FTP_USER = os.environ.get('BONGSHAI_FTP_USER')
FTP_PASS = os.environ.get('BONGSHAI_FTP_PASS')
if not FTP_USER or not FTP_PASS:
    raise RuntimeError('BONGSHAI_FTP_USER / BONGSHAI_FTP_PASS env vars not set')
USER_PASS = f"{FTP_USER}:{FTP_PASS}"

# Reads repo-relative file paths, one per line, from a manifest file given as argv[1].
# Uploads each to bongshaihousing.com/<same relative path>, retrying 3x on failure.
manifest_path = sys.argv[1]
with open(manifest_path, encoding='utf-8') as f:
    files = [line.strip() for line in f if line.strip()]

def upload(local_path):
    target_url = f"ftp://{FTP_HOST}/bongshaihousing.com/{local_path}"
    cmd = ['curl.exe', '--ssl-reqd', '-k', '--ftp-create-dirs', '--user', USER_PASS,
           '-T', local_path, target_url, '-s', '-w', '%{http_code}']
    for attempt in range(1, 4):
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        code = res.stdout.strip()
        if code in ('226', '250'):
            print(f"[OK] ({code}) {local_path}")
            return True
        time.sleep(1)
    print(f"[FAIL] {local_path} : {res.stdout} {res.stderr}")
    return False

failed = 0
for local_path in files:
    if not upload(local_path):
        failed += 1

print(f"\nDone: {len(files) - failed}/{len(files)} uploaded successfully.")
if failed:
    sys.exit(1)
