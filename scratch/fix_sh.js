const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const htmlDir = path.join(baseDir, '..');

const files = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html') && f.startsWith('bh-sh-'));

const buttonTemplate = (id) => `<div class="modern-area-selector" id="area-selector-${id}">
<button type="button" class="modern-area-btn active" onclick="selectArea('${id}', '600', this)">600 Sq.Ft</button>
<button type="button" class="modern-area-btn" onclick="selectArea('${id}', '850', this)">850 Sq.Ft</button>
</div>`;

const scriptTemplate = (id) => `<script>
    const floorData${id} = {
      "600": { 
        bed: "3 Bedrooms", bath: "2 Bathrooms", living: "1 Living Room", drawing: "1 Drawing Room", dining: "N/A",
        rooms: [
          { section: "Total Floor Area", area: 1200, length: 40, width: 30 },
          { section: "Master bed", area: 168, length: 14, width: 12 },
          { section: "Child bed 1", area: 130, length: 13, width: 10 },
          { section: "Child bed 2", area: 130, length: 13, width: 10 },
          { section: "Living room", area: 180, length: 15, width: 12 },
          { section: "Drawing room", area: 130, length: 13, width: 10 },
          { section: "Kitchen", area: 80, length: 10, width: 8 },
          { section: "Bath room 1", area: 40, length: 8, width: 5 },
          { section: "Bath room 2", area: 40, length: 8, width: 5 },
          { section: "Porch / Balcony", area: 52, length: 13, width: 4 },
          { section: "Wall & Stairs area", area: 250, length: "-", width: "-" }
        ]
      },
      "850": { 
        bed: "5 Bedrooms", bath: "4 Bathrooms", living: "N/A", drawing: "1 Drawing Room", dining: "1 Dining Space",
        rooms: [
          { section: "Total Floor Area", area: 1700, length: 50, width: 34 },
          { section: "Master bed", area: 180, length: 15, width: 12 },
          { section: "Child bed 1", area: 144, length: 12, width: 12 },
          { section: "Child bed 2", area: 144, length: 12, width: 12 },
          { section: "Child bed 3", area: 144, length: 12, width: 12 },
          { section: "Child bed 4", area: 144, length: 12, width: 12 },
          { section: "Drawing room", area: 180, length: 15, width: 12 },
          { section: "Dining space", area: 144, length: 12, width: 12 },
          { section: "Kitchen", area: 90, length: 10, width: 9 },
          { section: "Bath room 1", area: 48, length: 8, width: 6 },
          { section: "Bath room 2", area: 40, length: 8, width: 5 },
          { section: "Bath room 3", area: 40, length: 8, width: 5 },
          { section: "Bath room 4", area: 40, length: 8, width: 5 },
          { section: "Porch / Balcony", area: 60, length: 15, width: 4 },
          { section: "Wall & Stairs area", area: 302, length: "-", width: "-" }
        ]
      }
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

      // Also update space-allocation if it exists in SH
      const spaceAlloc = document.getElementById("space-allocation-${id}");
      if (spaceAlloc) {
        let drawingHtml = (data.drawing && data.drawing !== "N/A") ? \`<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;"><span style="color: var(--grey-700);"><span style="color:var(--accent);margin-right:8px;font-size:1.2rem;">▪</span>Drawing Room</span><span style="font-weight: 700; color: var(--primary); background: var(--off-white); padding: 4px 12px; border-radius: 20px;">\${data.drawing}</span></div>\` : "";
        let diningHtml = (data.dining && data.dining !== "N/A") ? \`<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;"><span style="color: var(--grey-700);"><span style="color:var(--accent);margin-right:8px;font-size:1.2rem;">▪</span>Dining Space</span><span style="font-weight: 700; color: var(--grey-900);">\${data.dining}</span></div>\` : "";
        let livingHtml = (data.living && data.living !== "N/A") ? \`<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;"><span style="color: var(--grey-700);"><span style="color:var(--accent);margin-right:8px;font-size:1.2rem;">▪</span>Living Room</span><span style="font-weight: 700; color: var(--primary); background: var(--off-white); padding: 4px 12px; border-radius: 20px;">\${data.living}</span></div>\` : "";

        spaceAlloc.innerHTML = \`
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;"><span style="color: var(--grey-700);"><span style="color:var(--accent);margin-right:8px;font-size:1.2rem;">▪</span>Bedrooms</span><span style="font-weight: 700; color: var(--primary); background: var(--off-white); padding: 4px 12px; border-radius: 20px;">\${data.bed}</span></div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;"><span style="color: var(--grey-700);"><span style="color:var(--accent);margin-right:8px;font-size:1.2rem;">▪</span>Bathrooms</span><span style="font-weight: 700; color: var(--primary); background: var(--off-white); padding: 4px 12px; border-radius: 20px;">\${data.bath}</span></div>
          \${livingHtml}
          \${diningHtml}
          \${drawingHtml}
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;"><span style="color: var(--grey-700);"><span style="color:var(--accent);margin-right:8px;font-size:1.2rem;">▪</span>Kitchen</span><span style="font-weight: 700; color: var(--grey-900);">1 Kitchen</span></div>
          <div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: var(--grey-700);"><span style="color:var(--accent);margin-right:8px;font-size:1.2rem;">▪</span>Front Veranda</span><span style="font-weight: 700; color: var(--grey-900);">Included</span></div>
        \`;
      }
    }
  </script>
  <script>document.addEventListener("DOMContentLoaded", () => { if (typeof updateSpecs${id} === "function") { updateSpecs${id}("600"); } });</script>`;

files.forEach(file => {
  const match = file.match(/bh-sh-(\d+)\.html/);
  if (!match) return;
  const id = match[1];

  const filePath = path.join(htmlDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // replace buttons
  const buttonRegex = new RegExp(`<div class="modern-area-selector" id="area-selector-${id}">[\\s\\S]*?</div>`);
  content = content.replace(buttonRegex, buttonTemplate(id));

  // replace script
  const scriptRegex = new RegExp(`<script>\\s*const floorData${id}[\\s\\S]*?</script>`, 'g');
  // Need to replace the whole block up to the DOMContentLoaded script
  // Since my regex is simple, I'll use a better approach
  
  const blockToReplace = new RegExp(`<script>\\s*const floorData${id}[\\s\\S]*?</script>\\s*<script>document\\.addEventListener\\("DOMContentLoaded", \\(\\) => { if \\(typeof updateSpecs${id} === "function"\\) { updateSpecs${id}\\("\\w+"\\); } }\\);</script>`, 'g');
  
  content = content.replace(blockToReplace, scriptTemplate(id));

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
