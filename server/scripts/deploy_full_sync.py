import os
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import ftplib

FTP_HOST = "ftp.bongshaixpress.com"
FTP_USER = os.environ.get('BONGSHAI_FTP_USER', 'aaa@bongshaihousing.com')
FTP_PASS = os.environ.get('BONGSHAI_FTP_PASS', '@No.hacking_9361#')
USER_PASS = f"{FTP_USER}:{FTP_PASS}"

def get_changed_files():
    out1 = subprocess.check_output(
        ['git', 'diff', '--name-only', '18fbb404', 'HEAD'],
        text=True
    )
    out2 = subprocess.check_output(
        ['git', 'status', '--porcelain'],
        text=True
    )
    files = set()
    for line in out1.strip().splitlines():
        if line.strip():
            files.add(line.strip())
    for line in out2.strip().splitlines():
        if line.strip():
            f = line.strip().split()[-1]
            files.add(f)
    files.add('.htaccess')
    return sorted(list(files))

def upload_file(local_path, remote_path):
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
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            code = res.stdout.strip()
            if code in ('226', '250'):
                return (local_path, remote_path, code, True, attempt, None)
            else:
                err = res.stderr.strip() or f"Unexpected code {code}"
                if attempt < 3:
                    time.sleep(1.5)
                    continue
                return (local_path, remote_path, code, False, attempt, err)
        except Exception as ex:
            if attempt < 3:
                time.sleep(1.5)
                continue
            return (local_path, remote_path, 'ERR', False, attempt, str(ex))

def main():
    changed = get_changed_files()
    print(f"Total changed files in git since 19e2fd01: {len(changed)}\n")

    tasks = []

    for f in changed:
        if not os.path.exists(f):
            print(f"Skipping deleted/missing file: {f}")
            continue

        # Skip zip archives or test scripts
        if f.endswith('.zip') or f.startswith('server/scripts/'):
            continue

        # 1. Server files -> deploy to /bongshai-node-app-prod/ & /bongshai-node-app/
        if f.startswith('server/'):
            rel_server = f[len('server/'):]
            tasks.append((f, f"bongshai-node-app-prod/{rel_server}"))
            tasks.append((f, f"bongshai-node-app/{rel_server}"))
        # 2. Static root/asset files -> deploy to /bongshaihousing.com/
        else:
            tasks.append((f, f"bongshaihousing.com/{f}"))

    print(f"Total upload tasks queued: {len(tasks)}")
    start_time = time.time()
    results = []

    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = {executor.submit(upload_file, lp, rp): (lp, rp) for lp, rp in tasks}
        for future in as_completed(futures):
            res = future.result()
            results.append(res)
            lp, rp, code, success, attempt, err = res
            status = "OK" if success else "FAILED"
            print(f"[{status}] ({code}) {lp} -> {rp} (attempt {attempt})", flush=True)
            if not success:
                print(f"    Error: {err}", flush=True)

    duration = time.time() - start_time
    success_count = sum(1 for r in results if r[3])
    fail_count = sum(1 for r in results if not r[3])

    print(f"\n==========================================")
    print(f"Upload phase completed in {duration:.2f}s")
    print(f"Total: {len(results)} | Successful: {success_count} | Failed: {fail_count}")
    print(f"==========================================\n")

    # Retry any failed files via direct FTPS connection
    if fail_count > 0:
        print("Retrying failed files sequentially via FTPLIB...")
        ftp = ftplib.FTP_TLS()
        ftp.connect(FTP_HOST, 21, timeout=30)
        ftp.auth()
        ftp.prot_p()
        ftp.login(FTP_USER, FTP_PASS)
        for r in results:
            if not r[3]:
                lp, rp = r[0], r[1]
                try:
                    remote_dir = os.path.dirname(rp).replace('\\', '/')
                    if remote_dir:
                        dirs = remote_dir.strip('/').split('/')
                        cur = ''
                        for d in dirs:
                            cur += '/' + d
                            try: ftp.cwd(cur)
                            except:
                                try:
                                    ftp.mkd(cur)
                                    ftp.cwd(cur)
                                except: pass
                    with open(lp, 'rb') as fp:
                        res = ftp.storbinary(f'STOR /{rp}', fp)
                    print(f"  [RETRY-OK] {lp} -> {rp}: {res}")
                except Exception as e:
                    print(f"  [RETRY-FAIL] {lp} -> {rp}: {e}")
        ftp.quit()

    # Restart Passenger on both node apps
    print("\nRestarting Passenger on /bongshai-node-app-prod and /bongshai-node-app...")
    try:
        ftp = ftplib.FTP_TLS()
        ftp.connect(FTP_HOST, 21, timeout=30)
        ftp.auth()
        ftp.prot_p()
        ftp.login(FTP_USER, FTP_PASS)
        for base in ['/bongshai-node-app-prod', '/bongshai-node-app']:
            try:
                ftp.mkd(f"{base}/tmp")
            except:
                pass
            import io
            marker = io.BytesIO(str(time.time()).encode('utf-8'))
            ftp.storbinary(f'STOR {base}/tmp/restart.txt', marker)
            print(f"  [OK] Restart marker written for {base}")
        ftp.quit()
    except Exception as ex:
        print(f"  [WARN] Passenger restart marker: {ex}")

    print("\nDeployment 100% complete!")

if __name__ == '__main__':
    main()
