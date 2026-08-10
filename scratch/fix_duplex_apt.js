const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const htmlDir = path.join(baseDir, '..');

const files = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html') && (f.startsWith('bh-dv-') || f.startsWith('bh-cb-')));

const scriptTemplate = (id) => `<script>
    const floorData${id} = {
      "600": { 
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
      "850": { 
        bed: "5 Bedrooms", bath: "4 Bathrooms", living: "N/A", drawing: "1 Drawing Room", dining: "1 Dining Space", kitchen: "1 Kitchen",
        rooms: [
          { section: "<b>Ground Floor</b>", area: "", length: "", width: "" },
          { section: "Floor area", area: 850, length: 50, width: 34 },
          { section: "Master bed", area: 180, length: 15, width: 12 },
          { section: "Child bed 1", area: 144, length: 12, width: 12 },
          { section: "Dining space", area: 144, length: 12, width: 12 },
          { section: "Kitchen", area: 90, length: 10, width: 9 },
          { section: "Bath 1", area: 48, length: 8, width: 6 },
          { section: "Bath 2", area: 40, length: 8, width: 5 },
          { section: "Porch / Balcony", area: 30, length: 15, width: 2 },
          { section: "Wall & Stairs", area: 174, length: "-", width: "-" },
          { section: "<span style='color:red;'>Total (Ground Floor)</span>", area: "<span style='color:red;'>850</span>", length: "", width: "" },
          { section: "<b>First floor</b>", area: "", length: "", width: "" },
          { section: "Floor area", area: 850, length: 50, width: 34 },
          { section: "Drawing room", area: 180, length: 15, width: 12 },
          { section: "Child bed 2", area: 144, length: 12, width: 12 },
          { section: "Child bed 3", area: 144, length: 12, width: 12 },
          { section: "Child bed 4", area: 144, length: 12, width: 12 },
          { section: "Bath 3", area: 40, length: 8, width: 5 },
          { section: "Bath 4", area: 40, length: 8, width: 5 },
          { section: "Porch / Balcony", area: 30, length: 15, width: 2 },
          { section: "Wall & Stairs", area: 128, length: "-", width: "-" },
          { section: "<span style='color:red;'>Total (First floor)</span>", area: "<span style='color:red;'>850</span>", length: "", width: "" },
          { section: "<b>Total Building Area</b>", area: "<b>1700</b>", length: "", width: "" }
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
          // special styling for floor headers and totals
          let isHeader = room.section.includes("<b>");
          let isTotal = room.area.toString().includes("color:red");
          let trStyle = isTotal ? "border-bottom: 2px solid var(--grey-200); background: #fffcfc;" : (isHeader ? "background: var(--off-white);" : "");
          html += \`<tr style="\${trStyle}">
            <td>\${room.section}</td>
            <td>\${room.area || ''}</td>
            <td>\${room.length || ''}</td>
            <td>\${room.width || ''}</td>
          </tr>\`;
        });
        tbody.innerHTML = html;
      }

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
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;"><span style="color: var(--grey-700);"><span style="color:var(--accent);margin-right:8px;font-size:1.2rem;">▪</span>Kitchen</span><span style="font-weight: 700; color: var(--grey-900);">\${data.kitchen || "1 Kitchen"}</span></div>
          <div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: var(--grey-700);"><span style="color:var(--accent);margin-right:8px;font-size:1.2rem;">▪</span>Varanda &amp; Porch</span><span style="font-weight: 700; color: var(--grey-900);">Included</span></div>
        \`;
      }
    }
  </script>
  <script>document.addEventListener("DOMContentLoaded", () => { if (typeof updateSpecs${id} === "function") { updateSpecs${id}("600"); } });</script>`;

files.forEach(file => {
  const match = file.match(/bh-(dv|cb)-(\d+)\.html/);
  if (!match) return;
  const id = match[2];

  const filePath = path.join(htmlDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace script completely
  const blockToReplace = new RegExp(`<script>\\s*const floorData${id}[\\s\\S]*?</script>\\s*<script>document\\.addEventListener\\("DOMContentLoaded", \\(\\) => { if \\(typeof updateSpecs${id} === "function"\\) { updateSpecs${id}\\("\\w+"\\); } }\\);</script>`, 'g');
  
  if (content.match(blockToReplace)) {
    content = content.replace(blockToReplace, scriptTemplate(id));
  } else {
    // If it fails to match perfectly, replace from const floorData to end of that block
    const fallbackRegex = new RegExp(`<script>\\s*const floorData${id}[\\s\\S]*?</script>`, 'g');
    content = content.replace(fallbackRegex, scriptTemplate(id).split('<script>document.addEventListener')[0] + '</script>');
  }

  // Also replace button labels from 600 Sq.Ft -> 600*2 Sq.Ft and 850 Sq.Ft -> 850*2 Sq.Ft
  content = content.replace(/>600 Sq\.Ft<\/button>/g, `>600*2 Sq.Ft</button>`);
  content = content.replace(/>850 Sq\.Ft<\/button>/g, `>850*2 Sq.Ft</button>`);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
