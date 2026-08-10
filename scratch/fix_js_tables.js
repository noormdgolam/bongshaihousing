const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const htmlDir = path.join(baseDir, '..');

const files = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html') && (f.startsWith('bh-') || f.startsWith('lcv-') || f.startsWith('dv-')));

files.forEach(file => {
  const filePath = path.join(htmlDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Regex to match the data.rooms.forEach block that constructs the table rows
  // It handles varying background colors and styles by matching everything from data.rooms.forEach to tbody.innerHTML = html;
  const jsTableRegex = /data\.rooms\.forEach\(\(room, index\) => \{[\s\S]*?\}\);\s*tbody\.innerHTML = html;/g;

  const cleanJsTable = `data.rooms.forEach((room, index) => {
          html += \`<tr>
            <td>\${room.section}</td>
            <td>\${room.area || ''}</td>
            <td>\${room.length || ''}</td>
            <td>\${room.width || ''}</td>
          </tr>\`;
        });
        tbody.innerHTML = html;`;

  content = content.replace(jsTableRegex, cleanJsTable);
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Cleaned JS table for", file);
  }
});
