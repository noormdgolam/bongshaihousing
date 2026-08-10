const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const htmlDir = path.join(baseDir, '..');

const files = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html') && (f.startsWith('bh-dv-') || f.startsWith('bh-cb-')));

const replacement1612 = `"1612": { 
        bed: "5 Bedrooms", bath: "4 Bathrooms", living: "1 Living Room", drawing: "1 Drawing Room", dining: "N/A", kitchen: "2 Kitchens",
        rooms: [
          { section: "<b>Ground Floor</b>", area: "", length: "", width: "" },
          { section: "Floor area", area: 806, length: 31, width: 26 },
          { section: "Guest bed", area: 130, length: 13, width: 10 },
          { section: "Living room", area: 221, length: 17, width: 13 },
          { section: "Kitchen 1", area: 72, length: 9, width: 8 },
          { section: "Bath 1", area: 40, length: 8, width: 5 },
          { section: "Bath 2", area: 40, length: 8, width: 5 },
          { section: "Varanda & porch", area: 36, length: 12, width: 3 },
          { section: "Wall & stairs area", area: 267, length: "-", width: "-" },
          { section: "<span style='color:red;'>Total (Ground Floor)</span>", area: "<span style='color:red;'>806</span>", length: "", width: "" },
          { section: "<b>First floor</b>", area: "", length: "", width: "" },
          { section: "Floor area", area: 806, length: 31, width: 26 },
          { section: "Master bed", area: 182, length: 14, width: 13 },
          { section: "Child bed 1", area: 130, length: 13, width: 10 },
          { section: "Child bed 2", area: 130, length: 13, width: 10 },
          { section: "Child bed 3", area: 120, length: 12, width: 10 },
          { section: "Kitchen 2 / Store", area: 72, length: 9, width: 8 },
          { section: "Bath 3", area: 40, length: 8, width: 5 },
          { section: "Bath 4", area: 40, length: 8, width: 5 },
          { section: "Varanda", area: 12, length: 12, width: 1 },
          { section: "Wall & stairs area", area: 80, length: "-", width: "-" },
          { section: "<span style='color:red;'>Total (First floor)</span>", area: "<span style='color:red;'>806</span>", length: "", width: "" },
          { section: "<b>Total Building Area</b>", area: "<b>1612</b>", length: "", width: "" }
        ]
      }`;

files.forEach(file => {
  const match = file.match(/bh-(dv|cb)-(\d+)\.html/);
  if (!match) return;
  const id = match[2];

  const filePath = path.join(htmlDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace "850": { ... } to the end of floorData
  const regex850 = /"850":\s*\{[\s\S]*?\}\s*};\s*function updateSpecs/g;
  
  if (content.match(regex850)) {
    content = content.replace(regex850, replacement1612 + "\n    };\n\n    function updateSpecs");
  } else {
      console.log(`Could not find 850 block in ${file}`);
  }

  // Replace buttons
  content = content.replace(new RegExp(`onclick="selectArea\\('${id}', '850', this\\)">850\\*2 Sq\\.Ft</button>`, 'g'), `onclick="selectArea('${id}', '1612', this)">806*2 Sq.Ft</button>`);

  fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Fixed 850 -> 1612 (806*2)');
