"""
Fast FTP deploy - single persistent FTPS connection instead of spawning a new
curl.exe (new TCP + full TLS handshake + login) per file. That per-file
handshake overhead was the dominant cost in the curl-per-file scripts
(~15-20s/file even though actual data transfer is under 2s) - this reuses
one connection for the whole batch, which should be several times faster.

Usage:
  BONGSHAI_FTP_PASS=... python server/scripts/fast_deploy.py <file1> <file2> ...
  BONGSHAI_FTP_PASS=... python server/scripts/fast_deploy.py --git-modified-html
  BONGSHAI_FTP_PASS=... python server/scripts/fast_deploy.py --glob "bh-*.html"
"""
import os
import sys
import glob
import time
import ftplib
import subprocess

FTP_HOST = "ftp.bongshaixpress.com"
FTP_USER = os.environ.get('BONGSHAI_FTP_USER', 'aaa@bongshaihousing.com')
FTP_PASS = os.environ.get('BONGSHAI_FTP_PASS')
if not FTP_PASS:
    raise RuntimeError('BONGSHAI_FTP_PASS env var not set - never hardcode the live FTP password in a committed script.')

REMOTE_ROOT = 'bongshaihousing.com'


def get_files():
    args = sys.argv[1:]
    if not args:
        raise SystemExit('Pass file paths, --git-modified-html, or --glob "<pattern>"')
    if args[0] == '--git-modified-html':
        out = subprocess.check_output(['git', 'status', '--short'], text=True)
        files = []
        for line in out.splitlines():
            status, path = line[:2].strip(), line[3:].strip()
            if status == 'M' and path.endswith('.html'):
                files.append(path)
        return files
    if args[0] == '--glob':
        return sorted(glob.glob(args[1]))
    return args


def connect():
    ftp = ftplib.FTP_TLS()
    ftp.connect(FTP_HOST, 21, timeout=30)
    ftp.auth()
    ftp.prot_p()
    ftp.login(FTP_USER, FTP_PASS)
    ftp.cwd(REMOTE_ROOT)
    return ftp


def upload_one(ftp, local_path, retry_connect):
    remote_dir = os.path.dirname(local_path).replace('\\', '/')
    fname = os.path.basename(local_path)
    for attempt in range(1, 4):
        try:
            if remote_dir:
                try:
                    ftp.cwd('/' + REMOTE_ROOT + '/' + remote_dir)
                except ftplib.error_perm:
                    # create nested dirs one segment at a time
                    ftp.cwd('/' + REMOTE_ROOT)
                    cur = ''
                    for seg in remote_dir.split('/'):
                        cur += '/' + seg
                        try:
                            ftp.cwd('/' + REMOTE_ROOT + cur)
                        except ftplib.error_perm:
                            ftp.mkd('/' + REMOTE_ROOT + cur)
                            ftp.cwd('/' + REMOTE_ROOT + cur)
            else:
                ftp.cwd('/' + REMOTE_ROOT)
            with open(local_path, 'rb') as fh:
                ftp.storbinary(f'STOR {fname}', fh)
            return ftp, True
        except (ftplib.error_temp, ftplib.error_perm, OSError, EOFError) as e:
            if attempt == 3:
                print(f"    giving up on {local_path}: {e}")
                return ftp, False
            time.sleep(1.5)
            try:
                ftp.quit()
            except Exception:
                pass
            ftp = retry_connect()
    return ftp, False


def main():
    files = [f for f in get_files() if os.path.exists(f)]
    print(f"Deploying {len(files)} files over one persistent connection...", flush=True)
    ftp = connect()
    ok, failed = 0, []
    start = time.time()
    for i, f in enumerate(files, 1):
        ftp, success = upload_one(ftp, f, connect)
        if success:
            ok += 1
        else:
            failed.append(f)
        if i % 20 == 0 or i == len(files):
            elapsed = time.time() - start
            print(f"  {i}/{len(files)} done ({ok} ok, {len(failed)} failed) - {elapsed:.1f}s elapsed, {elapsed/i:.2f}s/file avg", flush=True)
    try:
        ftp.quit()
    except Exception:
        pass
    if failed:
        print(f"\nFAILED ({len(failed)}): {failed}")
    else:
        print(f"\nAll {ok} files uploaded successfully in {time.time()-start:.1f}s.")


if __name__ == '__main__':
    main()
