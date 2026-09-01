import os
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

FTP_HOST = "ftp.bongshaixpress.com"
FTP_USER = os.environ.get('BONGSHAI_FTP_USER', 'aaa@bongshaihousing.com')
FTP_PASS = os.environ.get('BONGSHAI_FTP_PASS')
if not FTP_PASS:
    raise RuntimeError('BONGSHAI_FTP_PASS env var not set - never hardcode the live FTP password in a committed script.')
USER_PASS = f"{FTP_USER}:{FTP_PASS}"

def get_file_list():
    out = subprocess.check_output(
        ['git', 'diff', '--name-only', '12298816', 'HEAD', '--', '.', ':!server/'],
        text=True
    )
    files = [
        f.strip() for f in out.strip().splitlines()
        if f.strip().endswith('.html')
    ]
    return sorted(files)

def upload_file(rel_path):
    target_url = f"ftp://{FTP_HOST}/bongshaihousing.com/{rel_path}"
    cmd = [
        'curl.exe', '--ssl-reqd', '-k',
        '--user', USER_PASS,
        '-T', rel_path,
        target_url,
        '-s', '-w', '%{http_code}'
    ]
    
    for attempt in range(1, 4):
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            code = res.stdout.strip()
            if code in ('226', '250'):
                return (rel_path, code, True, attempt, None)
            else:
                err = res.stderr.strip() or f"Unexpected code {code}"
                if attempt < 3:
                    time.sleep(2)
                    continue
                return (rel_path, code, False, attempt, err)
        except Exception as ex:
            if attempt < 3:
                time.sleep(2)
                continue
            return (rel_path, 'ERR', False, attempt, str(ex))

def main():
    files = get_file_list()
    print(f"Total target files to deploy: {len(files)}")
    print(f"Destination: ftp://{FTP_HOST}/bongshaihousing.com/<file>\n")

    start_time = time.time()
    results = []
    
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(upload_file, f): f for f in files}
        for future in as_completed(futures):
            res = future.result()
            results.append(res)
            rel_path, code, success, attempt, err = res
            status = "OK" if success else "FAILED"
            print(f"[{status}] ({code}) {rel_path} (attempt {attempt})", flush=True)
            if not success:
                print(f"    Error: {err}", flush=True)

    duration = time.time() - start_time
    success_count = sum(1 for r in results if r[2])
    fail_count = sum(1 for r in results if not r[2])

    print(f"\n==========================================")
    print(f"Deployment finished in {duration:.2f}s")
    print(f"Total: {len(results)} | Successful: {success_count} | Failed: {fail_count}")
    print(f"==========================================\n")

    if fail_count > 0:
        print("Retrying failed files sequentially via FTPLIB...")
        import ftplib
        ftp = ftplib.FTP_TLS()
        ftp.connect(FTP_HOST, 21, timeout=30)
        ftp.auth()
        ftp.prot_p()
        ftp.login(FTP_USER, FTP_PASS)
        for r in results:
            if not r[2]:
                rel_path = r[0]
                try:
                    with open(rel_path, 'rb') as f:
                        res = ftp.storbinary(f'STOR /bongshaihousing.com/{rel_path}', f)
                    print(f"  [RETRY-OK] {rel_path}: {res}")
                except Exception as e:
                    print(f"  [RETRY-FAIL] {rel_path}: {e}")
        ftp.quit()

if __name__ == '__main__':
    main()
