const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const htmlDir = path.join(baseDir, '..');

const files = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html') && f.startsWith('bh-sh-'));

const addition600 = `      "1200": { 
        bed: "3 Bedrooms", bath: "2 Bathrooms", living: "1 Living Room", drawing: "1 Drawing Room", dining: "N/A", kitchen: "1 Kitchen",
        rooms: [
          { section: "<b>Ground Floor</b>", area: "", length: "", width: "" },
          { section: "Floor area", area: 600, length: 30, width: 20 },
          { section: "Living room", area: 180, length: 15, width: 12 },
          { section: "Child bed 1", area: 130, length: 13, width: 10 },
          { section: "Kitchen", area: 80, length: 10, width: 8 },
          { section: "Bath 1", area: 40, length: 8, width: 5 },
          { section: "Varanda & Porch", area: 26, length: 13, width: 2 },
          { section: "Wall & Stairs", area: 144, length: "-", width: "-" },
          { section: "<span style='color:red;'>Total (Ground Floor)</span>", area: "<span style='color:red;'>600</span>", length: "", width: "" },
          { section: "<b>First floor</b>", area: "", length: "", width: "" },
          { section: "Floor area", area: 600, length: 30, width: 20 },
          { section: "Master bed", area: 168, length: 14, width: 12 },
          { section: "Drawing room", area: 130, length: 13, width: 10 },
          { section: "Child bed 2", area: 130, length: 13, width: 10 },
          { section: "Bath 2", area: 40, length: 8, width: 5 },
          { section: "Varanda", area: 26, length: 13, width: 2 },
          { section: "Wall & Stairs", area: 106, length: "-", width: "-" },
          { section: "<span style='color:red;'>Total (First floor)</span>", area: "<span style='color:red;'>600</span>", length: "", width: "" },
          { section: "<b>Total Building Area</b>", area: "<b>1200</b>", length: "", width: "" }
        ]
      },
`;

files.forEach(file => {
  const match = file.match(/bh-sh-(\d+)\.html/);
  if (!match) return;
  const id = match[1];

  const filePath = path.join(htmlDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add the 1200 object to floorData before "1612": {
  content = content.replace(`"1612": {`, `${addition600}      "1612": {`);

  // Add the 600*2 button next to the 806*2 button
  const buttonRegex = new RegExp(`onclick="selectArea\\('${id}', '1612', this\\)">806\\*2 Sq\\.Ft</button>`);
  content = content.replace(buttonRegex, `onclick="selectArea('${id}', '1612', this)">806*2 Sq.Ft</button>\n<button type="button" class="modern-area-btn" onclick="selectArea('${id}', '1200', this)">600*2 Sq.Ft</button>`);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
