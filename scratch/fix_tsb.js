const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const tsbFiles = Array.from({length: 12}, (_, i) => `bh-tsb-${101 + i}.html`);

const modernButtonsTemplate = (id) => `<div class="modern-area-selector" id="area-selector-${id}">
<button type="button" class="modern-area-btn active" onclick="selectArea('${id}', '600', this)">600 Sq.Ft</button>
<button type="button" class="modern-area-btn" onclick="selectArea('${id}', '850', this)">850 Sq.Ft</button>
</div>`;

const floorDataStr = (id) => `const floorData${id} = {
      "600": { bed: "3 Bedrooms", bath: "2 Bathrooms", living: "1 Living Room", drawing: "1 Drawing Room", dining: null, rooms: [{"section":"Total Floor Area","area":1200,"length":40,"width":30},{"section":"Master bed","area":168,"length":14,"width":12},{"section":"Child bed 1","area":130,"length":13,"width":10},{"section":"Child bed 2","area":130,"length":13,"width":10},{"section":"Living room","area":180,"length":15,"width":12},{"section":"Drawing room","area":130,"length":13,"width":10},{"section":"Kitchen","area":80,"length":10,"width":8},{"section":"Bath room 1","area":40,"length":8,"width":5},{"section":"Bath room 2","area":40,"length":8,"width":5},{"section":"Porch / Balcony","area":52,"length":13,"width":4},{"section":"Wall & Stairs area","area":250,"length":"-","width":"-"}] },
      "850": { bed: "5 Bedrooms", bath: "4 Bathrooms", living: null, drawing: "1 Drawing Room", dining: "1 Dining Space", rooms: [{"section":"Total Floor Area","area":1700,"length":50,"width":34},{"section":"Master bed","area":180,"length":15,"width":12},{"section":"Child bed 1","area":144,"length":12,"width":12},{"section":"Child bed 2","area":144,"length":12,"width":12},{"section":"Child bed 3","area":144,"length":12,"width":12},{"section":"Child bed 4","area":144,"length":12,"width":12},{"section":"Drawing room","area":180,"length":15,"width":12},{"section":"Dining space","area":144,"length":12,"width":12},{"section":"Kitchen","area":90,"length":10,"width":9},{"section":"Bath room 1","area":48,"length":8,"width":6},{"section":"Bath room 2","area":40,"length":8,"width":5},{"section":"Bath room 3","area":40,"length":8,"width":5},{"section":"Bath room 4","area":40,"length":8,"width":5},{"section":"Porch / Balcony","area":60,"length":15,"width":4},{"section":"Wall & Stairs area","area":302,"length":"-","width":"-"}] }
    };`;

tsbFiles.forEach(file => {
  const filePath = path.join(baseDir, '..', file);
  if (!fs.existsSync(filePath)) {
    console.log("Not found", file);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  
  const idMatch = file.match(/bh-tsb-(\d+)\.html/);
  const id = idMatch ? idMatch[1] : null;
  if (!id) return;

  // Replace Buttons
  const btnRegex = new RegExp('<div class="modern-area-selector" id="area-selector-' + id + '">[\\s\\S]*?</div>');
  content = content.replace(btnRegex, modernButtonsTemplate(id));
  
  // Replace floorData
  const floorStart = "const floorData" + id + " = {";
  const floorEndStr = "    function updateSpecs";
  const startIndex = content.indexOf(floorStart);
  let endIndex = content.indexOf(floorEndStr);
  if (endIndex !== -1) {
    endIndex = content.lastIndexOf("};", endIndex);
  }
  if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + floorDataStr(id) + content.substring(endIndex);
  }
  
  // Replace DOMContentLoaded correctly
  content = content.replace(new RegExp(`updateSpecs${id}\\(["'][0-9]+["']\\)`), `updateSpecs${id}("600")`);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Updated", file);
});
