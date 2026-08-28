import os
import sys
import subprocess
import urllib.request
import time

def upload_html_to_ftp(slug):
    FTP_HOST = "ftp.bongshaixpress.com"
    FTP_USER = os.environ.get('BONGSHAI_FTP_USER', 'aaa@bongshaihousing.com')
    FTP_PASS = os.environ.get('BONGSHAI_FTP_PASS', '@No.hacking_9361#')
    USER_PASS = f"{FTP_USER}:{FTP_PASS}"

    # Wait for the node app to clear cache and restart if needed
    time.sleep(2)
    
    # 1. Fetch the rendered HTML from the staging site
    url = f"https://test.bongshaihousing.com/{slug}"
    print(f"Fetching {url}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Bongshai-Deploy-Bot/1.0'})
        with urllib.request.urlopen(req, timeout=30) as response:
            html = response.read().decode('utf-8')
    except Exception as e:
        print(f"Failed to fetch {url}: {e}")
        return False

    # 2. Write it locally (optional, but good for local mirror sync)
    local_path = slug
    if not slug.endswith('.html'):
        local_path += '.html'
        
    try:
        with open(local_path, 'w', encoding='utf-8') as f:
            f.write(html)
    except Exception as e:
        print(f"Failed to write locally: {e}")

    # 3. Upload to FTP
    remote_path = f"bongshaihousing.com/{local_path}"
    target_url = f"ftp://{FTP_HOST}/{remote_path}"
    cmd = [
        'curl.exe', '--ssl-reqd', '-k',
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
                print(f"[OK] Uploaded {local_path} to live site successfully.")
                return True
            else:
                err = res.stderr.strip() or f"Unexpected code {code}"
                print(f"[RETRY {attempt}] FTP error: {err}")
                if attempt < 3:
                    time.sleep(2)
        except Exception as e:
            print(f"[ERR {attempt}] {e}")
            if attempt < 3:
                time.sleep(2)
    return False

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python deploy_single_page.py <slug>")
        sys.exit(1)
    
    slug = sys.argv[1]
    success = upload_html_to_ftp(slug)
    if not success:
        sys.exit(1)
