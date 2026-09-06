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

FILES_TO_DEPLOY = [
    ("server/routes/admin.js", "routes/admin.js"),
    ("server/views/admin/categories/form.njk", "views/admin/categories/form.njk"),
    ("server/views/pages/apartment-building.njk", "views/pages/apartment-building.njk"),
    ("server/views/pages/concrete-building.njk", "views/pages/concrete-building.njk"),
    ("server/views/pages/container-house.njk", "views/pages/container-house.njk"),
    ("server/views/pages/cottage-house.njk", "views/pages/cottage-house.njk"),
    ("server/views/pages/duplex-steel-building.njk", "views/pages/duplex-steel-building.njk"),
    ("server/views/pages/low-cost-house.njk", "views/pages/low-cost-house.njk"),
    ("server/views/pages/luxury-villa.njk", "views/pages/luxury-villa.njk"),
    ("server/views/pages/simplex-steel-building.njk", "views/pages/simplex-steel-building.njk"),
    ("server/views/pages/steel-house.njk", "views/pages/steel-house.njk"),
    ("server/views/pages/tiny-house.njk", "views/pages/tiny-house.njk"),
    ("server/views/pages/wooden-house.njk", "views/pages/wooden-house.njk"),
    ("server/db/migrations/20260904000002_add_category_page_copy.js", "db/migrations/20260904000002_add_category_page_copy.js"),
    ("server/db/migrations/20260904000003_backfill_category_page_copy.js", "db/migrations/20260904000003_backfill_category_page_copy.js"),
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
    print("=== Deploying Category Copy Files to Staging & Production ===")
    all_success = True
    for app in ['bongshai-node-app', 'bongshai-node-app-prod']:
        print(f"\n--- Uploading to {app} ---")
        for local_file, subpath in FILES_TO_DEPLOY:
            remote_path = f"{app}/{subpath}"
            if not os.path.exists(local_file):
                print(f"[MISSING] {local_file}")
                all_success = False
                continue
            ok = upload_file(local_file, remote_path)
            if not ok:
                all_success = False
            time.sleep(0.5)

    print("\n=== Restarting Passenger Apps ===")
    for app in ['bongshai-node-app', 'bongshai-node-app-prod']:
        restart_app(app)
        time.sleep(1)

    if all_success:
        print("\n=== All 30 files uploaded and applications restarted successfully ===")
    else:
        print("\n=== Some uploads encountered failures, check log above ===")

if __name__ == '__main__':
    main()
