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

class SafeUploader:
    def __init__(self):
        self.ftp = None
        self.connect()

    def connect(self):
        if self.ftp:
            try:
                self.ftp.quit()
            except Exception:
                pass
        self.ftp = ftplib.FTP_TLS()
        self.ftp.connect(FTP_HOST, FTP_PORT, timeout=30)
        self.ftp.auth()
        self.ftp.prot_p()
        self.ftp.login(FTP_USER, FTP_PASS)

    def upload(self, local_path, remote_path, retries=3):
        for attempt in range(retries):
            try:
                remote_dir = os.path.dirname(remote_path).replace('\\', '/')
                if remote_dir:
                    dirs = remote_dir.strip('/').split('/')
                    cur = ''
                    for d in dirs:
                        cur += '/' + d
                        try:
                            self.ftp.cwd(cur)
                        except ftplib.error_perm:
                            try:
                                self.ftp.mkd(cur)
                                self.ftp.cwd(cur)
                            except Exception:
                                pass
                
                with open(local_path, 'rb') as f:
                    self.ftp.storbinary(f'STOR {remote_path}', f)
                print(f'  [OK] Uploaded: {local_path} -> {remote_path}')
                return True
            except Exception as e:
                print(f'  ! Retry {attempt+1}/{retries} for {local_path}: {e}')
                time.sleep(2)
                try:
                    self.connect()
                except Exception as ce:
                    print(f'  ! Reconnect error: {ce}')
                    time.sleep(3)
        return False

    def restart_passenger(self, app_dir):
        try:
            tmp_dir = f'{app_dir}/tmp'
            try:
                self.ftp.mkd(tmp_dir)
            except Exception:
                pass
            import io
            marker = io.BytesIO(str(time.time()).encode('utf-8'))
            self.ftp.storbinary(f'STOR {tmp_dir}/restart.txt', marker)
            print(f'  [OK] Restarted Passenger for {app_dir}')
        except Exception as e:
            print(f'  ! Warning restarting {app_dir}: {e}')

    def close(self):
        try:
            self.ftp.quit()
        except Exception:
            pass

def main():
    print('Connecting to cPanel FTP...')
    uploader = SafeUploader()
    print('Connected successfully!')

    # 1. Upload Category & Product HTML files to /bongshaihousing.com/
    print('\n[1/4] Uploading Category & Product HTML files to /bongshaihousing.com...')
    html_files = [f for f in os.listdir('.') if f.endswith('.html')]
    for hf in html_files:
        uploader.upload(hf, f'/bongshaihousing.com/{hf}')

    # 2. Upload updated server files to /bongshai-node-app-prod/
    print('\n[2/4] Uploading Node server files to /bongshai-node-app-prod/...')
    for root, dirs, files in os.walk('server/views'):
        for file in files:
            local_file = os.path.join(root, file)
            rel_file = os.path.relpath(local_file, 'server').replace('\\', '/')
            uploader.upload(local_file, f'/bongshai-node-app-prod/{rel_file}')

    uploader.upload('server/routes/products.js', '/bongshai-node-app-prod/routes/products.js')
    uploader.upload('server/db/seeds/data/products.json', '/bongshai-node-app-prod/db/seeds/data/products.json')

    # 3. Upload updated server files to /bongshai-node-app/ (Staging)
    print('\n[3/4] Uploading Node server files to /bongshai-node-app/ (Staging)...')
    for root, dirs, files in os.walk('server/views'):
        for file in files:
            local_file = os.path.join(root, file)
            rel_file = os.path.relpath(local_file, 'server').replace('\\', '/')
            uploader.upload(local_file, f'/bongshai-node-app/{rel_file}')

    uploader.upload('server/routes/products.js', '/bongshai-node-app/routes/products.js')
    uploader.upload('server/db/seeds/data/products.json', '/bongshai-node-app/db/seeds/data/products.json')

    # 4. Restart Passenger apps
    print('\n[4/4] Restarting Node Passenger apps...')
    uploader.restart_passenger('/bongshai-node-app-prod')
    uploader.restart_passenger('/bongshai-node-app')

    uploader.close()
    print('\nAll files successfully deployed to cPanel and Passenger restarted!')

if __name__ == '__main__':
    main()
