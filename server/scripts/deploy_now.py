import os
import subprocess
import time
import glob

FTP_HOST = "ftp.bongshaixpress.com"
FTP_USER = os.environ.get('BONGSHAI_FTP_USER', 'aaa@bongshaihousing.com')
FTP_PASS = os.environ.get('BONGSHAI_FTP_PASS', '@No.hacking_9361#')
USER_PASS = f"{FTP_USER}:{FTP_PASS}"

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
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=40)
            code = res.stdout.strip()
            if code in ('226', '250'):
                print(f"[OK] ({code}) {local_path} -> {remote_path}")
                return True
            else:
                print(f"[RETRY {attempt}] ({code}) {local_path} -> {remote_path}: {res.stderr.strip() or code}")
                time.sleep(2)
        except Exception as e:
            print(f"[ERR {attempt}] {e}")
            time.sleep(2)
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
    tasks = []
    
    # 1. All HTML files
    html_files = glob.glob('*.html')
    for h in html_files:
        tasks.append((h, f"bongshaihousing.com/{h}"))
        
    # 2. Admin routes & single deploy script for BOTH node environments
    for env in ['bongshai-node-app', 'bongshai-node-app-prod']:
        tasks.append(('server/routes/admin.js', f"{env}/routes/admin.js"))
        tasks.append(('server/scripts/deploy_single_page.py', f"{env}/scripts/deploy_single_page.py"))
        
    print(f"Uploading {len(tasks)} files sequentially to avoid FTP 421 errors...")
    
    for lp, rp in tasks:
        upload(lp, rp)
        
    restart_passenger()

if __name__ == '__main__':
    main()
