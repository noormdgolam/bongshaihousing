import os
import subprocess
import time
import json

FTP_HOST = "ftp.bongshaixpress.com"
FTP_USER = os.environ.get('BONGSHAI_FTP_USER', 'aaa@bongshaihousing.com')
FTP_PASS = os.environ.get('BONGSHAI_FTP_PASS')
if not FTP_PASS:
    raise RuntimeError('BONGSHAI_FTP_PASS env var not set - never hardcode the live FTP password in a committed script.')
USER_PASS = f"{FTP_USER}:{FTP_PASS}"

with open('server/scripts/sync-list.json', 'r') as f:
    data = json.load(f)

modified = data['modified']

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
    for attempt in range(1, 4):
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            code = res.stdout.strip()
            if code in ('226', '250'):
                return True
            else:
                time.sleep(1)
        except Exception:
            time.sleep(1)
    return False

print(f"Uploading {len(modified)} files to FTP...", flush=True)

# First upload core backend files to bongshai-node-app-prod and bongshai-node-app
server_files = [f for f in modified if f.startswith('server/')]
static_files = [f for f in modified if not f.startswith('server/') and os.path.exists(f)]

print(f"Total server files: {len(server_files)}, Total static files: {len(static_files)}", flush=True)

uploaded = 0
for sf in server_files:
    if not os.path.exists(sf):
        continue
    rel = sf[len('server/'):]
    upload(sf, f"bongshai-node-app-prod/{rel}")
    upload(sf, f"bongshai-node-app/{rel}")
    uploaded += 1
    if uploaded % 15 == 0 or uploaded == len(server_files):
        print(f"Uploaded {uploaded}/{len(server_files)} server files...", flush=True)

print("\nUploading static html / xml files...", flush=True)
uploaded_static = 0
for stf in static_files:
    upload(stf, f"bongshaihousing.com/{stf}")
    uploaded_static += 1
    if uploaded_static % 30 == 0 or uploaded_static == len(static_files):
        print(f"Uploaded {uploaded_static}/{len(static_files)} static files...", flush=True)

# Touch restart
import tempfile
with tempfile.NamedTemporaryFile(delete=False) as tf:
    tf.write(str(time.time()).encode('utf-8'))
    tpath = tf.name

for app in ['bongshai-node-app-prod', 'bongshai-node-app']:
    target_url = f"ftp://{FTP_HOST}/{app}/tmp/restart.txt"
    cmd = [
        'curl.exe', '--ssl-reqd', '-k',
        '--ftp-create-dirs',
        '--user', USER_PASS,
        '-T', tpath,
        target_url,
        '-s', '-w', '%{http_code}'
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
    print(f"[RESTART] {app}: {res.stdout.strip()}", flush=True)

try: os.unlink(tpath)
except: pass

print("\nALL FILES UPLOADED AND APPS RESTARTED SUCCESSFULLY!", flush=True)
