import os
import ftplib
import ssl
import time
import io

FTP_HOST = 'ftp.bongshaixpress.com'
FTP_PORT = 21
FTP_USER = 'aaa@bongshaihousing.com'
FTP_PASS = os.environ.get('BONGSHAI_FTP_PASS', '')

def get_ftp():
    ftp = ftplib.FTP_TLS()
    ftp.connect(FTP_HOST, FTP_PORT, timeout=30)
    ftp.auth()
    ftp.prot_p()
    ftp.login(FTP_USER, FTP_PASS)
    return ftp

def upload_file(ftp, local_path, remote_path):
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
    print(f'  [OK] Uploaded: {local_path} -> {remote_path}')

def upload_bytes(ftp, content_bytes, remote_path):
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
    buf = io.BytesIO(content_bytes)
    ftp.storbinary(f'STOR {remote_path}', buf)
    print(f'  [OK] Uploaded bytes -> {remote_path}')

def restart_passenger(ftp, app_dir):
    tmp_dir = f'{app_dir}/tmp'
    try:
        ftp.mkd(tmp_dir)
    except Exception:
        pass
    marker = io.BytesIO(str(time.time()).encode('utf-8'))
    ftp.storbinary(f'STOR {tmp_dir}/restart.txt', marker)
    print(f'  [OK] Restarted Passenger for {app_dir}')

def main():
    print('Connecting to cPanel FTPS...')
    ftp = get_ftp()
    print('Connected!')

    # 1. Sync full server/ to /bongshai-node-app-prod/ and /bongshai-node-app/
    targets = ['/bongshai-node-app-prod', '/bongshai-node-app']
    
    server_dirs = ['lib', 'routes', 'views', 'middleware']
    for target in targets:
        print(f'\nUploading server code to {target}...')
        for sdir in server_dirs:
            local_dir = os.path.join('server', sdir)
            if os.path.exists(local_dir):
                for root, dirs, files in os.walk(local_dir):
                    for file in files:
                        local_path = os.path.join(root, file)
                        rel_path = os.path.relpath(local_path, 'server').replace('\\', '/')
                        upload_file(ftp, local_path, f'{target}/{rel_path}')
        
        # Core server files
        core_files = [
            'server.js',
            'package.json',
            'package-lock.json',
            'page-registry.json',
            'redirects.json',
            'theme-settings.json',
        ]
        for cf in core_files:
            lpath = os.path.join('server', cf)
            if os.path.exists(lpath):
                upload_file(ftp, lpath, f'{target}/{cf}')
        
        # Product JSON
        pjson = os.path.join('server', 'db', 'seeds', 'data', 'products.json')
        if os.path.exists(pjson):
            upload_file(ftp, pjson, f'{target}/db/seeds/data/products.json')

    # 2. Update .htaccess on /bongshaihousing.com/ with CloudLinux Passenger block
    print('\nUpdating .htaccess on /bongshaihousing.com/...')
    with open('.htaccess', 'r', encoding='utf-8') as f:
        local_htaccess = f.read()

    passenger_block = """# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
PassengerAppRoot "/home/abongsha/bongshai-node-app-prod"
PassengerBaseURI "/"
PassengerNodejs "/home/abongsha/nodevenv/bongshai-node-app-prod/22/bin/node"
PassengerAppType node
PassengerStartupFile server.js
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END

"""
    # Prepend passenger block if not already in content
    if 'CLOUDLINUX PASSENGER CONFIGURATION BEGIN' not in local_htaccess:
        prod_htaccess = passenger_block + local_htaccess
    else:
        prod_htaccess = local_htaccess

    upload_bytes(ftp, prod_htaccess.encode('utf-8'), '/bongshaihousing.com/.htaccess')

    # 3. Restart Passenger
    print('\nRestarting Passenger on both apps...')
    for target in targets:
        restart_passenger(ftp, target)

    ftp.quit()
    print('\nDeployment and restart completed!')

if __name__ == '__main__':
    main()
