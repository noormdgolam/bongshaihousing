import os
import ftplib
import ssl
import time

FTP_HOST = 'ftp.bongshaixpress.com'
FTP_PORT = 21
# Credentials come from the environment on purpose - never hardcode them in a
# tracked script (same policy as server/scripts/deploy.sh).
#   BONGSHAI_FTP_USER=... BONGSHAI_FTP_PASS=... python server/scripts/<this>.py
FTP_USER = os.environ.get('BONGSHAI_FTP_USER')
FTP_PASS = os.environ.get('BONGSHAI_FTP_PASS')
if not FTP_USER or not FTP_PASS:
    raise SystemExit('Set BONGSHAI_FTP_USER and BONGSHAI_FTP_PASS env vars first.')

def get_ftp():
    ftp = ftplib.FTP_TLS()
    ftp.connect(FTP_HOST, FTP_PORT, timeout=30)
    ftp.auth()
    ftp.prot_p()
    ftp.login(FTP_USER, FTP_PASS)
    return ftp

def upload(ftp, local_path, remote_path):
    remote_dir = os.path.dirname(remote_path).replace('\\', '/')
    if remote_dir:
        dirs = remote_dir.strip('/').split('/')
        cur = ''
        for d in dirs:
            cur += '/' + d
            try:
                ftp.cwd(cur)
            except ftplib.error_perm:
                try:
                    ftp.mkd(cur)
                    ftp.cwd(cur)
                except Exception:
                    pass
    with open(local_path, 'rb') as f:
        ftp.storbinary(f'STOR {remote_path}', f)
    print(f'  [OK] Uploaded {local_path} -> {remote_path}')

def main():
    print('Connecting to cPanel FTP for core update...')
    ftp = get_ftp()
    print('Connected!')

    # 1. Upload category pages
    categories = [
        'duplex-steel-building.html',
        'apartment-building.html',
        'simplex-steel-building.html',
        'cottage-house.html',
        'container-house.html',
        'wooden-house.html',
        'tiny-house.html',
        'steel-house.html',
        'concrete-building.html',
        'industrial-sheds.html'
    ]
    print('\n[1/3] Uploading Category HTML files...')
    for cat in categories:
        if os.path.exists(cat):
            upload(ftp, cat, f'/bongshaihousing.com/{cat}')

    # 2. Upload server files to prod & staging
    print('\n[2/3] Uploading server templates & data...')
    server_targets = ['/bongshai-node-app-prod', '/bongshai-node-app']
    for base in server_targets:
        for root, dirs, files in os.walk('server/views'):
            for file in files:
                local_file = os.path.join(root, file)
                rel_file = os.path.relpath(local_file, 'server').replace('\\', '/')
                upload(ftp, local_file, f'{base}/{rel_file}')
        upload(ftp, 'server/routes/products.js', f'{base}/routes/products.js')
        upload(ftp, 'server/db/seeds/data/products.json', f'{base}/db/seeds/data/products.json')

    # 3. Restart Passenger
    print('\n[3/3] Restarting Passenger...')
    for base in server_targets:
        try:
            tmp_dir = f'{base}/tmp'
            try: ftp.mkd(tmp_dir)
            except: pass
            import io
            marker = io.BytesIO(str(time.time()).encode('utf-8'))
            ftp.storbinary(f'STOR {tmp_dir}/restart.txt', marker)
            print(f'  [OK] Restarted {base}')
        except Exception as e:
            print(f'  ! Error restarting {base}: {e}')

    ftp.quit()
    print('\n🎉 Core update & Passenger reload 100% complete!')

if __name__ == '__main__':
    main()
