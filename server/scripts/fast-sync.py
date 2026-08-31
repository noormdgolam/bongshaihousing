import os
import json
import ftplib
import time
import io

FTP_HOST = "ftp.bongshaixpress.com"
FTP_USER = os.environ.get('BONGSHAI_FTP_USER', 'aaa@bongshaihousing.com')
FTP_PASS = os.environ.get('BONGSHAI_FTP_PASS', '@No.hacking_9361#')

with open('server/scripts/sync-list.json', 'r') as f:
    data = json.load(f)

modified = data['modified']
deleted = data['deleted']

print(f"Connecting to {FTP_HOST}...", flush=True)
ftp = ftplib.FTP(FTP_HOST, timeout=30)
ftp.login(FTP_USER, FTP_PASS)
ftp.set_pasv(True)
print("Connected & logged in with PASSIVE mode successfully!", flush=True)

def delete_safe(remote_path):
    try:
        ftp.delete(remote_path)
        print(f"[DELETED] {remote_path}", flush=True)
    except Exception:
        pass

print("\n--- 1. Deleting discontinued files ---", flush=True)
for f in deleted:
    if f.startswith('server/views/pages/'):
        base = os.path.basename(f)
        delete_safe(f"bongshai-node-app-prod/views/pages/{base}")
        delete_safe(f"bongshai-node-app/views/pages/{base}")
    elif f.endswith('.html'):
        delete_safe(f"bongshaihousing.com/{f}")

print("\n--- 2. Uploading modified files ---", flush=True)
uploaded = 0
errors = 0
for f in modified:
    if not os.path.exists(f):
        continue
    
    destinations = []
    if f.startswith('server/'):
        rel = f[len('server/'):]
        destinations.append(f"bongshai-node-app-prod/{rel}")
        destinations.append(f"bongshai-node-app/{rel}")
    else:
        destinations.append(f"bongshaihousing.com/{f}")

    for dest in destinations:
        try:
            with open(f, 'rb') as fp:
                ftp.storbinary(f"STOR {dest}", fp)
            uploaded += 1
            if uploaded % 25 == 0:
                print(f"Uploaded {uploaded} files...", flush=True)
        except Exception as e:
            errors += 1
            print(f"[ERROR] {dest}: {e}", flush=True)

print(f"Total uploaded: {uploaded} files (errors: {errors}).", flush=True)

print("\n--- 3. Restarting Passenger ---", flush=True)
timestamp = str(time.time()).encode('utf-8')
for app in ['bongshai-node-app-prod', 'bongshai-node-app']:
    try:
        ftp.storbinary(f"STOR {app}/tmp/restart.txt", io.BytesIO(timestamp))
        print(f"[RESTART] {app}", flush=True)
    except Exception as e:
        print(f"[RESTART ERR] {app}: {e}", flush=True)

ftp.quit()
print("\nFAST SYNC & RESTART COMPLETE!", flush=True)
