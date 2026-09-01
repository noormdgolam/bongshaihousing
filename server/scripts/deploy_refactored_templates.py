import os
import subprocess
import time

FTP_HOST = "ftp.bongshaixpress.com"
FTP_USER = os.environ.get('BONGSHAI_FTP_USER', 'aaa@bongshaihousing.com')
FTP_PASS = os.environ.get('BONGSHAI_FTP_PASS')
if not FTP_PASS:
    raise RuntimeError('BONGSHAI_FTP_PASS env var not set - never hardcode the live FTP password in a committed script.')
USER_PASS = f"{FTP_USER}:{FTP_PASS}"

FILES = [
    # Route changes
    ("server/routes/pages.js", "bongshai-node-app/routes/pages.js"),
    ("server/routes/pages.js", "bongshai-node-app-prod/routes/pages.js"),
]

# Add all refactored templates
templates = [
    'apartment-building.njk', 'concrete-building.njk', 'container-house.njk',
    'cottage-house.njk', 'duplex-steel-building.njk', 'industrial-sheds.njk',
    'luxury-villa.njk', 'simplex-steel-building.njk', 'steel-house.njk',
    'tiny-house.njk', 'wooden-house.njk', 'worker-accommodation.njk'
]

for t in templates:
    FILES.append((f"server/views/pages/{t}", f"bongshai-node-app/views/pages/{t}"))
    FILES.append((f"server/views/pages/{t}", f"bongshai-node-app-prod/views/pages/{t}"))

def upload(local_path, remote_path):
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
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=40)
            code = res.stdout.strip()
            if code in ('226', '250'):
                print(f"[OK] ({code}) {local_path} -> {remote_path}")
                return True
            else:
                print(f"[RETRY {attempt}] ({code}) {local_path} -> {remote_path}: {res.stderr.strip() or code}")
                time.sleep(3)
        except Exception as e:
            print(f"[ERR {attempt}] {e}")
    return False

def restart_node_app(app_dir):
    print(f"Restarting {app_dir}...")
    target_url = f"ftp://{FTP_HOST}/{app_dir}/tmp/restart.txt"
    cmd = [
        'curl.exe', '--ssl-reqd', '-k',
        '--ftp-create-dirs',
        '--user', USER_PASS,
        '-T', '-', target_url
    ]
    try:
        subprocess.run(cmd, input="restart", text=True, timeout=15)
        print(f"[OK] Touched restart.txt for {app_dir}")
    except Exception as e:
        print(f"[ERR] Failed to restart {app_dir}: {e}")

if __name__ == '__main__':
    for local_f, remote_f in FILES:
        upload(local_f, remote_f)
    
    restart_node_app('bongshai-node-app')
    restart_node_app('bongshai-node-app-prod')
    print("Done!")
