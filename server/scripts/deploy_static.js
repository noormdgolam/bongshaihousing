const { execSync } = require('child_process');
const fs = require('fs');

const status = execSync('git status --porcelain', { encoding: 'utf8' });
const lines = status.split('\n');
const htmlFiles = lines
  .filter(line => line.length > 3)
  .map(line => line.substring(3).trim())
  .filter(file => file.endsWith('.html'));

console.log(`Found ${htmlFiles.length} changed HTML files.`);

const FTP_HOST = 'ftp.bongshaixpress.com';
const FTP_USER = process.env.BONGSHAI_FTP_USER;
const FTP_PASS = process.env.BONGSHAI_FTP_PASS;
if (!FTP_USER || !FTP_PASS) {
  console.error('Set BONGSHAI_FTP_USER and BONGSHAI_FTP_PASS env vars first.');
  process.exit(1);
}
const USER_PASS = `${FTP_USER}:${FTP_PASS}`;
const REMOTE_BASE = 'bongshaihousing.com'; // User said explicitly NOT public_html

for (const file of htmlFiles) {
  const remotePath = `${REMOTE_BASE}/${file}`;
  const targetUrl = `ftp://${FTP_HOST}/${remotePath}`;
  
  const cmd = `curl.exe --ssl-reqd -k --ftp-create-dirs --user "${USER_PASS}" -T "${file}" "${targetUrl}" -s -w "%{http_code}"`;
  
  console.log(`Uploading ${file} to ${remotePath}...`);
  try {
    const output = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    if (output.trim() === '226' || output.trim() === '250') {
        console.log(`[OK] ${file}`);
    } else {
        console.log(`[WARN] Code: ${output.trim()} for ${file}`);
    }
  } catch(e) {
    console.error(`[ERROR] Failed to upload ${file}`, e.message);
  }
}
