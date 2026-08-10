const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const htmlDir = path.join(baseDir, '..');

const files = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html') && f.startsWith('bh-sh-'));

files.forEach(file => {
  const filePath = path.join(htmlDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Change button label from "1612 Sq.Ft" to "806*2 Sq.Ft"
  content = content.replace(
    /onclick="selectArea\('(\d+)', '1612', this\)">1612 Sq\.Ft<\/button>/g, 
    `onclick="selectArea('$1', '1612', this)">806*2 Sq.Ft</button>`
  );

  // Change red sub-totals from 804 to 806
  content = content.replace(
    /area: "<span style='color:red;'>804<\/span>"/g,
    `area: "<span style='color:red;'>806</span>"`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
