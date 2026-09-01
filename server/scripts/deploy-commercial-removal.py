import os
import subprocess
import time
import glob

FTP_HOST = "ftp.bongshaixpress.com"
FTP_USER = os.environ.get('BONGSHAI_FTP_USER', 'aaa@bongshaihousing.com')
FTP_PASS = os.environ.get('BONGSHAI_FTP_PASS')
if not FTP_PASS:
    raise RuntimeError('BONGSHAI_FTP_PASS env var not set - never hardcode the live FTP password in a committed script.')
USER_PASS = f"{FTP_USER}:{FTP_PASS}"

DELETED_TEMPLATES = [
    'industrial-sheds.njk',
    'worker-accommodation.njk',
] + [f'bh-is-10{i:02d}.njk' for i in range(1, 13)] + [f'bh-wa-11{i:02d}.njk' for i in range(1, 13)]

DELETED_HTML = [
    'industrial-sheds.html',
    'worker-accommodation.html',
] + [f'bh-is-10{i:02d}.html' for i in range(1, 13)] + [f'bh-wa-11{i:02d}.html' for i in range(1, 13)]

def delete_remote(path):
    target_url = f"ftp://{FTP_HOST}/{path}"
    cmd = [
        'curl.exe', '--ssl-reqd', '-k',
        '--user', USER_PASS,
        '-Q', f"DELE {path}",
        f"ftp://{FTP_HOST}/",
        '-s', '-w', '%{http_code}'
    ]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
        print(f"[DELE] {path}: {res.stdout.strip()}")
    except Exception as e:
        print(f"[DELE ERR] {path}: {e}")

def upload(local_path, remote_path):
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
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=40)
            code = res.stdout.strip()
            if code in ('226', '250'):
                print(f"[OK] ({code}) {local_path} -> {remote_path}")
                return True
            else:
                print(f"[RETRY {attempt}] ({code}) {local_path} -> {remote_path}")
                time.sleep(2)
        except Exception as e:
            print(f"[ERR {attempt}] {e}")
            time.sleep(2)
    return False

def main():
    print("=== 1. DELETING DISCONTINUED NJK & HTML FILES ===")
    for app in ['bongshai-node-app-prod', 'bongshai-node-app']:
        for t in DELETED_TEMPLATES:
            delete_remote(f"{app}/views/pages/{t}")
    for h in DELETED_HTML:
        delete_remote(f"bongshaihousing.com/{h}")

    print("\n=== 2. UPLOADING CORE SERVER FILES ===")
    core_files = [
        ('server/routes/pages.js', 'routes/pages.js'),
        ('server/lib/ai-assistant.js', 'lib/ai-assistant.js'),
        ('server/page-registry.json', 'page-registry.json'),
        ('server/data/static-sitemap.xml', 'data/static-sitemap.xml'),
        ('server/db/seeds/001_categories_and_products.js', 'db/seeds/001_categories_and_products.js'),
        ('server/db/seeds/data/products.json', 'db/seeds/data/products.json'),
        ('server/db/seeds/data/faqs.json', 'db/seeds/data/faqs.json'),
        ('server/views/partials/nav.njk', 'views/partials/nav.njk'),
    ]

    for lp, rel in core_files:
        upload(lp, f"bongshai-node-app-prod/{rel}")
        upload(lp, f"bongshai-node-app/{rel}")

    print("\n=== 3. UPLOADING ALL MODIFIED NJK PAGES ===")
    all_njk = glob.glob('server/views/pages/*.njk')
    for njk in all_njk:
        basename = os.path.basename(njk)
        if basename in DELETED_TEMPLATES:
            continue
        upload(njk, f"bongshai-node-app-prod/views/pages/{basename}")
        upload(njk, f"bongshai-node-app/views/pages/{basename}")

    print("\n=== 4. UPLOADING MODIFIED STATIC HTML FILES ===")
    all_html = glob.glob('*.html')
    for html in all_html:
        basename = os.path.basename(html)
        if basename in DELETED_HTML:
            continue
        upload(html, f"bongshaihousing.com/{basename}")

    upload('.htaccess', 'bongshaihousing.com/.htaccess')
    upload('sitemap.xml', 'bongshaihousing.com/sitemap.xml')

    print("\n=== 5. RESTARTING PASSENGER ===")
    import tempfile
    with tempfile.NamedTemporaryFile(delete=False) as tf:
        tf.write(str(time.time()).encode('utf-8'))
        tpath = tf.name

    for app in ['bongshai-node-app-prod', 'bongshai-node-app']:
        target_url = f"ftp://{FTP_HOST}/{app}/tmp/restart.txt"
        cmd = [
            'curl.exe', '--ssl-reqd', '-k',
            '--ftp-create-dirs',
            '--user', USER_PASS,
            '-T', tpath,
            target_url,
            '-s', '-w', '%{http_code}'
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=40)
        print(f"[RESTART] {app}: {res.stdout.strip()}")

    try: os.unlink(tpath)
    except: pass
    print("\nDeployment complete!")

if __name__ == '__main__':
    main()
