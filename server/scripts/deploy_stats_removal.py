import os, subprocess

FTP_HOST = "ftp.bongshaixpress.com"
FTP_USER = os.environ.get('BONGSHAI_FTP_USER', 'aaa@bongshaihousing.com')
FTP_PASS = os.environ.get('BONGSHAI_FTP_PASS')
if not FTP_PASS:
    raise RuntimeError('BONGSHAI_FTP_PASS env var not set')
USER_PASS = f"{FTP_USER}:{FTP_PASS}"

target_url = f"ftp://{FTP_HOST}/bongshaihousing.com/index.html"
cmd = ['curl.exe', '--ssl-reqd', '-k', '--ftp-create-dirs', '--user', USER_PASS,
       '-T', 'index.html', target_url, '-s', '-w', '%{http_code}']
res = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
print(f"index.html -> {res.stdout.strip()}")
