import os, subprocess, time, tempfile

FTP_HOST = "ftp.bongshaixpress.com"
FTP_USER = os.environ.get('BONGSHAI_FTP_USER', 'aaa@bongshaihousing.com')
FTP_PASS = os.environ.get('BONGSHAI_FTP_PASS')
if not FTP_PASS:
    raise RuntimeError('BONGSHAI_FTP_PASS env var not set - never hardcode the live FTP password in a committed script.')
USER_PASS = f"{FTP_USER}:{FTP_PASS}"

FILES = [
    ("server/routes/admin.js", "bongshai-node-app-prod/routes/admin.js"),
    ("server/routes/admin.js", "bongshai-node-app/routes/admin.js"),
    ("server/views/admin/agents/detail.njk", "bongshai-node-app-prod/views/admin/agents/detail.njk"),
    ("server/views/admin/agents/detail.njk", "bongshai-node-app/views/admin/agents/detail.njk"),
]

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

for local_path, remote_path in FILES:
    upload(local_path, remote_path)

with tempfile.NamedTemporaryFile(delete=False) as tf:
    tf.write(str(time.time()).encode('utf-8'))
    tpath = tf.name

for app in ['bongshai-node-app-prod', 'bongshai-node-app']:
    target_url = f"ftp://{FTP_HOST}/{app}/tmp/restart.txt"
    cmd = ['curl.exe', '--ssl-reqd', '-k', '--ftp-create-dirs', '--user', USER_PASS,
           '-T', tpath, target_url, '-s', '-w', '%{http_code}']
    res = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
    print(f"[RESTART] {app}: {res.stdout.strip()}")

os.unlink(tpath)
print("DONE")
