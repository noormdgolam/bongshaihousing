import os
import subprocess
import time

FTP_HOST = "ftp.bongshaixpress.com"
FTP_USER = os.environ.get('BONGSHAI_FTP_USER', 'aaa@bongshaihousing.com')
FTP_PASS = os.environ.get('BONGSHAI_FTP_PASS', '@No.hacking_9361#')
USER_PASS = f"{FTP_USER}:{FTP_PASS}"

FILES = [
    # 1. Root .htaccess
    (".htaccess", "bongshaihousing.com/.htaccess"),
    
    # 2. Server routes & views for bongshai-node-app-prod
    ("server/views/partials/ai-chat-widget.njk", "bongshai-node-app-prod/views/partials/ai-chat-widget.njk"),
    ("server/views/admin/products/list.njk", "bongshai-node-app-prod/views/admin/products/list.njk"),
    ("server/views/admin/products/form.njk", "bongshai-node-app-prod/views/admin/products/form.njk"),
    ("server/routes/products.js", "bongshai-node-app-prod/routes/products.js"),
    ("server/lib/pageCache.js", "bongshai-node-app-prod/lib/pageCache.js"),

    # 3. Server routes & views for bongshai-node-app (staging)
    ("server/views/partials/ai-chat-widget.njk", "bongshai-node-app/views/partials/ai-chat-widget.njk"),
    ("server/views/admin/products/list.njk", "bongshai-node-app/views/admin/products/list.njk"),
    ("server/views/admin/products/form.njk", "bongshai-node-app/views/admin/products/form.njk"),
    ("server/routes/products.js", "bongshai-node-app/routes/products.js"),
    ("server/lib/pageCache.js", "bongshai-node-app/lib/pageCache.js"),
]

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
            time.sleep(3)
    return False

def restart_passenger():
    import tempfile
    with tempfile.NamedTemporaryFile(delete=False) as tf:
        tf.write(str(time.time()).encode('utf-8'))
        tpath = tf.name
    
    for base in ['bongshai-node-app-prod', 'bongshai-node-app']:
        target_url = f"ftp://{FTP_HOST}/{base}/tmp/restart.txt"
        cmd = [
            'curl.exe', '--ssl-reqd', '-k',
            '--ftp-create-dirs',
            '--user', USER_PASS,
            '-T', tpath,
            target_url,
            '-s', '-w', '%{http_code}'
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=40)
        print(f"[RESTART] {base}: {res.stdout.strip()}")
        time.sleep(2)
    
    try: os.unlink(tpath)
    except: pass

def main():
    print(f"Starting targeted upload of {len(FILES)} critical files...")
    time.sleep(2)
    for lp, rp in FILES:
        if os.path.exists(lp):
            upload(lp, rp)
            time.sleep(1.5)
        else:
            print(f"[SKIP] Missing: {lp}")
    
    print("\nRestarting Passenger...")
    restart_passenger()
    print("\nTargeted deployment complete!")

if __name__ == '__main__':
    main()
