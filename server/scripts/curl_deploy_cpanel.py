import os
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor

FTP_HOST = 'ftp.bongshaixpress.com'
# Credentials come from the environment on purpose - never hardcode them in a
# tracked script (same policy as server/scripts/deploy.sh).
#   BONGSHAI_FTP_USER=... BONGSHAI_FTP_PASS=... python server/scripts/<this>.py
FTP_USER = os.environ.get('BONGSHAI_FTP_USER')
FTP_PASS = os.environ.get('BONGSHAI_FTP_PASS')
if not FTP_USER or not FTP_PASS:
    raise SystemExit('Set BONGSHAI_FTP_USER and BONGSHAI_FTP_PASS env vars first.')
USER_PASS = f'{FTP_USER}:{FTP_PASS}'

def upload_file(local_path, remote_path):
    cmd = [
        'curl', '--ssl-reqd', '-k', '-s',
        '--ftp-create-dirs',
        '--user', USER_PASS,
        '-T', local_path,
        f'ftp://{FTP_HOST}/{remote_path}'
    ]
    for attempt in range(3):
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0:
            print(f'  [OK] Uploaded: {local_path} -> {remote_path}')
            return True
        else:
            time.sleep(1)
    print(f'  [FAIL] Failed: {local_path} -> {remote_path}')
    return False

def restart_passenger(app_dir):
    marker = 'server/scripts/restart.txt'
    with open(marker, 'w') as f:
        f.write(str(time.time()))
    upload_file(marker, f'{app_dir}/tmp/restart.txt')
    if os.path.exists(marker):
        os.remove(marker)
    print(f'  [OK] Restarted Passenger for {app_dir}')

def main():
    print('Starting Fast Parallel cPanel FTP Deployment...')
    tasks = []

    # 1. Static HTML files to /bongshaihousing.com/
    html_files = [f for f in os.listdir('.') if f.endswith('.html')]
    for hf in html_files:
        tasks.append((hf, f'bongshaihousing.com/{hf}'))

    # 2. Node server files to /bongshai-node-app-prod/
    for root, dirs, files in os.walk('server/views'):
        for file in files:
            local_file = os.path.join(root, file).replace('\\', '/')
            rel_file = os.path.relpath(local_file, 'server').replace('\\', '/')
            tasks.append((local_file, f'bongshai-node-app-prod/{rel_file}'))

    tasks.append(('server/routes/products.js', 'bongshai-node-app-prod/routes/products.js'))
    tasks.append(('server/db/seeds/data/products.json', 'bongshai-node-app-prod/db/seeds/data/products.json'))

    # 3. Node server files to /bongshai-node-app/ (Staging)
    for root, dirs, files in os.walk('server/views'):
        for file in files:
            local_file = os.path.join(root, file).replace('\\', '/')
            rel_file = os.path.relpath(local_file, 'server').replace('\\', '/')
            tasks.append((local_file, f'bongshai-node-app/{rel_file}'))

    tasks.append(('server/routes/products.js', 'bongshai-node-app/routes/products.js'))
    tasks.append(('server/db/seeds/data/products.json', 'bongshai-node-app/db/seeds/data/products.json'))

    print(f'Total files to upload: {len(tasks)}')

    # Parallel upload with 6 threads
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = [executor.submit(upload_file, lp, rp) for lp, rp in tasks]
        for f in futures:
            f.result()

    print('\nRestarting Passenger apps...')
    restart_passenger('bongshai-node-app-prod')
    restart_passenger('bongshai-node-app')

    print('\n🎉 Deployment 100% complete!')

if __name__ == '__main__':
    main()
