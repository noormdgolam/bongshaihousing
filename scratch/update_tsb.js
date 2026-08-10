const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const tsbFiles = Array.from({length: 11}, (_, i) => `bh-tsb-${102 + i}.html`);

const cssBlock = `  <style>
    .modern-area-selector {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .modern-area-btn {
      padding: 8px 16px;
      border-radius: 30px;
      border: 1px solid var(--grey-300);
      background: var(--white);
      color: var(--grey-700);
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .modern-area-btn:hover {
      border-color: var(--primary);
      color: var(--primary);
    }
    .modern-area-btn.active {
      background: var(--primary);
      color: var(--white);
      border-color: var(--primary);
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    }
    .modern-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.95rem;
      text-align: left;
    }
    .modern-table th {
      padding: 12px 16px;
      font-weight: 700;
      color: var(--grey-600);
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.5px;
      border-bottom: 2px solid var(--grey-200);
    }
    .modern-table td {
      padding: 16px;
      font-weight: 500;
      border-bottom: 1px solid var(--grey-100);
    }
    .modern-table tbody tr:hover {
      background: #fbfbfc;
    }
  </style>\n`;

const modernButtonsTemplate = (id) => `<div class="modern-area-selector" id="area-selector-${id}">
<button type="button" class="modern-area-btn active" onclick="selectArea('${id}', '400', this)">400 Sq.Ft</button>
<button type="button" class="modern-area-btn" onclick="selectArea('${id}', '600', this)">600 Sq.Ft</button>
<button type="button" class="modern-area-btn" onclick="selectArea('${id}', '750', this)">750 Sq.Ft</button>
<button type="button" class="modern-area-btn" onclick="selectArea('${id}', '900', this)">900 Sq.Ft</button>
<button type="button" class="modern-area-btn" onclick="selectArea('${id}', '1050', this)">1050 Sq.Ft</button>
<button type="button" class="modern-area-btn" onclick="selectArea('${id}', '1200', this)">1200 Sq.Ft</button>
</div>`;

const scriptTemplate = (id) => `const floorData${id} = {
      "400": { bed: "2 Bedrooms", bath: "1 Bathrooms", living: "1 Living Room", drawing: null, dining: null, rooms: [{"section":"Total Floor Area","area":800,"length":40,"width":20},{"section":"Master bed","area":140,"length":14,"width":10},{"section":"Child bed","area":120,"length":12,"width":10},{"section":"Living room","area":160,"length":16,"width":10},{"section":"Kitchen","area":60,"length":10,"width":6},{"section":"Bath room","area":40,"length":8,"width":5},{"section":"Wall & Stairs area","area":280,"length":"-","width":"-"}] },
      "600": { bed: "3 Bedrooms", bath: "2 Bathrooms", living: "1 Living Room", drawing: "1 Drawing Room", dining: null, rooms: [{"section":"Total Floor Area","area":1200,"length":40,"width":30},{"section":"Master bed","area":168,"length":14,"width":12},{"section":"Child bed 1","area":130,"length":13,"width":10},{"section":"Child bed 2","area":130,"length":13,"width":10},{"section":"Living room","area":180,"length":15,"width":12},{"section":"Drawing room","area":130,"length":13,"width":10},{"section":"Kitchen","area":80,"length":10,"width":8},{"section":"Bath room 1","area":40,"length":8,"width":5},{"section":"Bath room 2","area":40,"length":8,"width":5},{"section":"Porch / Balcony","area":52,"length":13,"width":4},{"section":"Wall & Stairs area","area":250,"length":"-","width":"-"}] },
      "750": { bed: "4 Bedrooms", bath: "3 Bathrooms", living: "1 Living Room", drawing: "1 Drawing Room", dining: "1 Dining Space", rooms: [{"section":"Total Floor Area","area":1500,"length":50,"width":30},{"section":"Master bed","area":168,"length":14,"width":12},{"section":"Child bed 1","area":130,"length":13,"width":10},{"section":"Child bed 2","area":130,"length":13,"width":10},{"section":"Child bed 3","area":130,"length":13,"width":10},{"section":"Living room","area":180,"length":15,"width":12},{"section":"Drawing room","area":130,"length":13,"width":10},{"section":"Kitchen","area":80,"length":10,"width":8},{"section":"Bath rooms","area":120,"length":"-","width":"-"},{"section":"Porch / Balcony","area":52,"length":13,"width":4},{"section":"Wall & Stairs area","area":380,"length":"-","width":"-"}] },
      "900": { bed: "5 Bedrooms", bath: "4 Bathrooms", living: null, drawing: "1 Drawing Room", dining: "1 Dining Space", rooms: [{"section":"Total Floor Area","area":1800,"length":50,"width":36},{"section":"Master bed","area":180,"length":15,"width":12},{"section":"Child bed 1","area":144,"length":12,"width":12},{"section":"Child bed 2","area":144,"length":12,"width":12},{"section":"Child bed 3","area":144,"length":12,"width":12},{"section":"Child bed 4","area":144,"length":12,"width":12},{"section":"Drawing room","area":180,"length":15,"width":12},{"section":"Dining space","area":144,"length":12,"width":12},{"section":"Kitchen","area":90,"length":10,"width":9},{"section":"Bath rooms","area":168,"length":"-","width":"-"},{"section":"Porch / Balcony","area":60,"length":15,"width":4},{"section":"Wall & Stairs area","area":402,"length":"-","width":"-"}] },
      "1050": { bed: "6 Bedrooms", bath: "5 Bathrooms", living: "1 Living Room", drawing: "1 Drawing Room", dining: "1 Dining Space", rooms: [{"section":"Total Floor Area","area":2100,"length":60,"width":35},{"section":"Master bed","area":200,"length":"-","width":"-"},{"section":"Beds","area":750,"length":"-","width":"-"},{"section":"Drawing/Dining/Living","area":500,"length":"-","width":"-"},{"section":"Kitchen","area":100,"length":"-","width":"-"},{"section":"Bath rooms","area":200,"length":"-","width":"-"},{"section":"Porch / Balcony","area":100,"length":"-","width":"-"},{"section":"Wall & Stairs area","area":250,"length":"-","width":"-"}] },
      "1200": { bed: "7 Bedrooms", bath: "5 Bathrooms", living: "1 Living Room", drawing: "1 Drawing Room", dining: "1 Dining Space", rooms: [{"section":"Total Floor Area","area":2400,"length":60,"width":40},{"section":"Master bed","area":200,"length":"-","width":"-"},{"section":"Beds","area":900,"length":"-","width":"-"},{"section":"Drawing/Dining/Living","area":600,"length":"-","width":"-"},{"section":"Kitchen","area":100,"length":"-","width":"-"},{"section":"Bath rooms","area":200,"length":"-","width":"-"},{"section":"Porch / Balcony","area":100,"length":"-","width":"-"},{"section":"Wall & Stairs area","area":300,"length":"-","width":"-"}] }
    };

    function updateSpecs${id}(sqft) {
      const data = floorData${id}[sqft];
      if(!data) return;

      document.getElementById("spec-bed-${id}").innerText = data.bed;
      document.getElementById("spec-bath-${id}").innerText = data.bath;
      const priceEl = document.getElementById("spec-price-${id}"); 
      if (priceEl) { priceEl.innerText = "Contact for Quote"; }

      const tbody = document.getElementById("room-sizes-table-body-${id}");
      if (tbody && data.rooms) {
        let html = "";
        data.rooms.forEach((room, index) => {
          html += \`<tr>
            <td>\${room.section}</td>
            <td>\${room.area || ''}</td>
            <td>\${room.length || ''}</td>
            <td>\${room.width || ''}</td>
          </tr>\`;
        });
        tbody.innerHTML = html;
      }

      let livingHtml = data.living ? \`<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;"><span style="color: var(--grey-700);"><span style="color:var(--accent);margin-right:8px;font-size:1.2rem;">▪</span>Living Room</span><span style="font-weight: 700; color: var(--primary); background: var(--off-white); padding: 4px 12px; border-radius: 20px;">\${data.living}</span></div>\` : "";
      let diningHtml = data.dining ? \`<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;"><span style="color: var(--grey-700);"><span style="color:var(--accent);margin-right:8px;font-size:1.2rem;">▪</span>Dining Space</span><span style="font-weight: 700; color: var(--primary); background: var(--off-white); padding: 4px 12px; border-radius: 20px;">\${data.dining}</span></div>\` : "";
      let drawingHtml = data.drawing ? \`<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;"><span style="color: var(--grey-700);"><span style="color:var(--accent);margin-right:8px;font-size:1.2rem;">▪</span>Drawing Room</span><span style="font-weight: 700; color: var(--primary); background: var(--off-white); padding: 4px 12px; border-radius: 20px;">\${data.drawing}</span></div>\` : "";

      const spaceAllocation = document.getElementById("space-allocation-${id}");
      if (spaceAllocation) {
        spaceAllocation.innerHTML = \`
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;"><span style="color: var(--grey-700);"><span style="color:var(--accent);margin-right:8px;font-size:1.2rem;">▪</span>Bedrooms</span><span style="font-weight: 700; color: var(--primary); background: var(--off-white); padding: 4px 12px; border-radius: 20px;">\${data.bed}</span></div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;"><span style="color: var(--grey-700);"><span style="color:var(--accent);margin-right:8px;font-size:1.2rem;">▪</span>Bathrooms</span><span style="font-weight: 700; color: var(--primary); background: var(--off-white); padding: 4px 12px; border-radius: 20px;">\${data.bath}</span></div>
          \${livingHtml}
          \${diningHtml}
          \${drawingHtml}
        \`;
      }
    }`;

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

  const btnRegex = new RegExp("<div class=\"area-selector\" id=\"area-selector-" + id + "\">[\\s\\S]*?</div>");
  content = content.replace(btnRegex, cssBlock + modernButtonsTemplate(id));
  
  const jsRegex = new RegExp("const floorData" + id + " = \\{[\\s\\S]*?function updateSpecs" + id + "\\(sqft\\) \\{[\\s\\S]*?}\\s*</script>", "m");
  const replacement = `${scriptTemplate(id)}\n  </script>`;
  content = content.replace(jsRegex, replacement);
  
  content = content.replace(/const buttons = container\.querySelectorAll\('\\.area-btn'\);/, "const buttons = container.querySelectorAll('.area-btn, .modern-area-btn');");
  
  // Replace DOMContentLoaded correctly
  content = content.replace(new RegExp(`updateSpecs${id}\\(["'][0-9]+["']\\)`), `updateSpecs${id}("400")`);

  // Replace table
  content = content.replace(/<table class="spec-table" style="width: 100%; border-collapse: collapse; font-size: 0.95rem; text-align: center;">\\s*<thead>\\s*<tr style=".*?">/g, '<table class="modern-table">\\n      <thead>\\n        <tr>');
  content = content.replace(/<th style=".*?">/g, '<th>');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Updated", file);
});
