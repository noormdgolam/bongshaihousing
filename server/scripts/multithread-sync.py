import os
import json
import ftplib
import time
import io
from concurrent.futures import ThreadPoolExecutor, as_completed

FTP_HOST = "ftp.bongshaixpress.com"
FTP_USER = os.environ.get('BONGSHAI_FTP_USER', 'aaa@bongshaihousing.com')
FTP_PASS = os.environ.get('BONGSHAI_FTP_PASS', '@No.hacking_9361#')

with open('server/scripts/sync-list.json', 'r') as f:
    data = json.load(f)

modified = data['modified']
deleted = data['deleted']

# Build full upload task list
tasks = []
for f in modified:
    if not os.path.exists(f):
        continue
    if f.startswith('server/'):
        rel = f[len('server/'):]
        tasks.append((f, f"bongshai-node-app-prod/{rel}"))
        tasks.append((f, f"bongshai-node-app/{rel}"))
    else:
        tasks.append((f, f"bongshaihousing.com/{f}"))

print(f"Total upload tasks: {len(tasks)}")

def delete_phase():
    ftp = ftplib.FTP(FTP_HOST, timeout=20)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.set_pasv(True)
    for f in deleted:
        if f.startswith('server/views/pages/'):
            base = os.path.basename(f)
            for prefix in ['bongshai-node-app-prod', 'bongshai-node-app']:
                try: ftp.delete(f"{prefix}/views/pages/{base}")
                except: pass
        elif f.endswith('.html'):
            try: ftp.delete(f"bongshaihousing.com/{f}")
            except: pass
    ftp.quit()
    print("Delete phase finished.")

delete_phase()

def upload_worker(task_chunk):
    ftp = ftplib.FTP(FTP_HOST, timeout=30)
    ftp.login(FTP_USER, FTP_PASS)
    ftp.set_pasv(True)
    success = 0
    for local_f, remote_dest in task_chunk:
        for attempt in range(2):
            try:
                with open(local_f, 'rb') as fp:
                    ftp.storbinary(f"STOR {remote_dest}", fp)
                success += 1
                break
            except Exception as e:
                time.sleep(0.5)
    ftp.quit()
    return success

# Chunk tasks for 8 threads
NUM_THREADS = 8
chunks = [[] for _ in range(NUM_THREADS)]
for idx, task in enumerate(tasks):
    chunks[idx % NUM_THREADS].append(task)

print(f"Uploading {len(tasks)} files across {NUM_THREADS} threads...")
t0 = time.time()
with ThreadPoolExecutor(max_workers=NUM_THREADS) as executor:
    futures = [executor.submit(upload_worker, ch) for ch in chunks]
    total_done = sum(f.result() for f in as_completed(futures))

print(f"All {total_done}/{len(tasks)} files uploaded in {round(time.time() - t0, 1)}s!")

# Restart Passenger
ftp = ftplib.FTP(FTP_HOST, timeout=20)
ftp.login(FTP_USER, FTP_PASS)
ftp.set_pasv(True)
timestamp = str(time.time()).encode('utf-8')
for app in ['bongshai-node-app-prod', 'bongshai-node-app']:
    ftp.storbinary(f"STOR {app}/tmp/restart.txt", io.BytesIO(timestamp))
    print(f"[RESTART] {app}")
ftp.quit()

print("\nDEPLOYMENT AND RESTART 100% COMPLETE!")
