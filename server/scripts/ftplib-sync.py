import os
import json
import ftplib
import time

FTP_HOST = "ftp.bongshaixpress.com"
FTP_USER = os.environ.get('BONGSHAI_FTP_USER', 'aaa@bongshaihousing.com')
FTP_PASS = os.environ.get('BONGSHAI_FTP_PASS', '@No.hacking_9361#')

with open('server/scripts/sync-list.json', 'r') as f:
    data = json.load(f)

modified = data['modified']
deleted = data['deleted']

print(f"Starting FTPLIB sync: {len(modified)} files to upload, {len(deleted)} files to verify deleted.")

ftp = ftplib.FTP_TLS()
ftp.connect(FTP_HOST, 21, timeout=30)
ftp.auth()
ftp.login(FTP_USER, FTP_PASS)
ftp.prot_p()
print("Connected to FTP TLS successfully!")

def ensure_dir(path):
    parts = path.strip('/').split('/')
    cur = ""
    for p in parts[:-1]:
        cur += "/" + p
        try:
            ftp.mkd(cur)
        except Exception:
            pass

def delete_file_safe(remote_path):
    try:
        ftp.delete(remote_path)
        print(f"[DELETED] {remote_path}")
    except Exception:
        pass

# 1. Delete deleted files
for f in deleted:
    if f.startswith('server/views/pages/'):
        base = os.path.basename(f)
        delete_file_safe(f"/bongshai-node-app-prod/views/pages/{base}")
        delete_file_safe(f"/bongshai-node-app/views/pages/{base}")
    elif f.endswith('.html'):
        delete_file_safe(f"/bongshaihousing.com/{f}")

# 2. Upload modified files
count = 0
for f in modified:
    if not os.path.exists(f):
        continue
    
    # Destination mappings:
    destinations = []
    if f.startswith('server/'):
        rel = f[len('server/'):]
        destinations.append(f"/bongshai-node-app-prod/{rel}")
        destinations.append(f"/bongshai-node-app/{rel}")
    else:
        destinations.append(f"/bongshaihousing.com/{f}")
    
    for dest in destinations:
        ensure_dir(dest)
        with open(f, 'rb') as fp:
            ftp.storbinary(f"STOR {dest}", fp)
        count += 1
        if count % 25 == 0:
            print(f"Uploaded {count} file instances...", flush=True)

# 3. Touch restart.txt
timestamp_bytes = str(time.time()).encode('utf-8')
for app in ['bongshai-node-app-prod', 'bongshai-node-app']:
    ensure_dir(f"/{app}/tmp/restart.txt")
    import io
    ftp.storbinary(f"STOR /{app}/tmp/restart.txt", io.BytesIO(timestamp_bytes))
    print(f"[RESTART] {app}")

ftp.quit()
print(f"\nALL {count} UPLOADS & RESTART COMPLETED SUCCESSFULLY!")
