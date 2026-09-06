import os
import subprocess
import time
import tempfile

FTP_HOST = "ftp.bongshaixpress.com"
FTP_USER = os.environ.get('BONGSHAI_FTP_USER', 'aaa@bongshaihousing.com')
FTP_PASS = os.environ.get('BONGSHAI_FTP_PASS')
if not FTP_PASS:
    raise RuntimeError('BONGSHAI_FTP_PASS env var not set.')
USER_PASS = f"{FTP_USER}:{FTP_PASS}"

UPLOADS = [
    # 1. Nunjucks templates to bongshai-node-app (staging)
    ("server/views/pages/construction-cost-calculator.njk", "bongshai-node-app/views/pages/construction-cost-calculator.njk"),
    ("server/views/pages/land-registration-cost-calculator.njk", "bongshai-node-app/views/pages/land-registration-cost-calculator.njk"),

    # 2. Nunjucks templates to bongshai-node-app-prod (production)
    ("server/views/pages/construction-cost-calculator.njk", "bongshai-node-app-prod/views/pages/construction-cost-calculator.njk"),
    ("server/views/pages/land-registration-cost-calculator.njk", "bongshai-node-app-prod/views/pages/land-registration-cost-calculator.njk"),

    # 3. Regenerated docroot HTML files
    ("construction-cost-calculator.html", "bongshaihousing.com/construction-cost-calculator.html"),
    ("land-registration-cost-calculator.html", "bongshaihousing.com/land-registration-cost-calculator.html"),
]

def upload_file(local_path, remote_path):
    target_url = f"ftp://{FTP_HOST}/{remote_path}"
    cmd = [
        'curl.exe', '--ssl-reqd', '-k',
        '--ftp-create-dirs',
        '--user', USER_PASS,
        '-T', local_path,
        target_url,
        '-s', '-w', '%{http_code}'
    ]
    for attempt in range(1, 5):
        try:
            res = subprocess.run(cmd, capture_output=True, timeout=60)
            code = res.stdout.decode('utf-8', errors='ignore').strip()
            if code in ('226', '250'):
                print(f"[OK] ({code}) {local_path} -> {remote_path}")
                return True
            else:
                err = res.stderr.decode('utf-8', errors='ignore').strip()
                print(f"[RETRY {attempt}] ({code}) {local_path} -> {remote_path}: {err or code}")
                time.sleep(2)
        except Exception as e:
            print(f"[ERR {attempt}] {e}")
            time.sleep(2)
    print(f"[FAIL] {local_path} -> {remote_path}")
    return False

def restart_app(app_name):
    target_url = f"ftp://{FTP_HOST}/{app_name}/tmp/restart.txt"
    with tempfile.NamedTemporaryFile(delete=False) as tf:
        tf.write(f"restart {time.time()}".encode('utf-8'))
        tpath = tf.name

    cmd = [
        'curl.exe', '--ssl-reqd', '-k',
        '--ftp-create-dirs',
        '--user', USER_PASS,
        '-T', tpath,
        target_url,
        '-s', '-w', '%{http_code}'
    ]
    res = subprocess.run(cmd, capture_output=True, timeout=30)
    code = res.stdout.decode('utf-8', errors='ignore').strip()
    print(f"[RESTART] {app_name}: code={code}")
    try:
        os.unlink(tpath)
    except:
        pass
    return code in ('226', '250')

def main():
    print("=== Deploying Calculator Retheme ===")
    success = True
    for local_path, remote_path in UPLOADS:
        if not os.path.exists(local_path):
            print(f"[ERROR] Local file missing: {local_path}")
            success = False
            continue
        ok = upload_file(local_path, remote_path)
        if not ok:
            success = False
        time.sleep(1)

    print("\n=== Restarting Node Applications ===")
    for app in ['bongshai-node-app', 'bongshai-node-app-prod']:
        ok = restart_app(app)
        if not ok:
            print(f"[WARN] Restart check returned unexpected code for {app}")
        time.sleep(1)

    if success:
        print("\n=== Deployment Completed Successfully ===")
    else:
        print("\n=== Deployment Encountered Failures ===")

if __name__ == '__main__':
    main()
