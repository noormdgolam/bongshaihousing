import os
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

FTP_HOST = "ftp.bongshaixpress.com"
FTP_USER = os.environ.get('BONGSHAI_FTP_USER')
FTP_PASS = os.environ.get('BONGSHAI_FTP_PASS')

if not FTP_USER or not FTP_PASS:
    raise SystemExit('Set BONGSHAI_FTP_USER and BONGSHAI_FTP_PASS env vars first.')

USER_PASS = f"{FTP_USER}:{FTP_PASS}"

def get_file_list():
    out = subprocess.check_output(
        ['git', 'diff', '--name-only', '18fbb404', 'main', '--', '.', ':!server/'],
        text=True
    )
    files = [
        f.strip() for f in out.strip().splitlines()
        if f.strip().endswith('.html') or f.strip() == 'sitemap.xml'
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
            print(f"[{status}] ({code}) {rel_path} (attempt {attempt})")
            if not success:
                print(f"    Error: {err}")

    duration = time.time() - start_time
    success_count = sum(1 for r in results if r[2])
    fail_count = sum(1 for r in results if not r[2])

    print(f"\n==========================================")
    print(f"Deployment finished in {duration:.2f}s")
    print(f"Total: {len(results)} | Successful: {success_count} | Failed: {fail_count}")
    print(f"==========================================\n")

if __name__ == '__main__':
    main()
