const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const htmlDir = path.join(baseDir, '..');

// 1. Process bh-tsb- files to match the layout split and 850->806
const tsbFiles = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html') && f.startsWith('bh-tsb-'));

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
          { section: "<span style='font-weight:700; color:var(--primary);'>Total (Ground Floor)</span>", area: "<span style='font-weight:700; color:var(--primary);'>600</span>", length: "", width: "" },
          { section: "<b>First floor</b>", area: "", length: "", width: "" },
          { section: "Floor area", area: 600, length: 30, width: 20 },
          { section: "Master bed", area: 168, length: 14, width: 12 },
          { section: "Drawing room", area: 130, length: 13, width: 10 },
          { section: "Child bed 2", area: 130, length: 13, width: 10 },
          { section: "Bath 2", area: 40, length: 8, width: 5 },
          { section: "Varanda", area: 26, length: 13, width: 2 },
          { section: "Wall & Stairs", area: 106, length: "-", width: "-" },
          { section: "<span style='font-weight:700; color:var(--primary);'>Total (First floor)</span>", area: "<span style='font-weight:700; color:var(--primary);'>600</span>", length: "", width: "" },
          { section: "<b>Total Building Area</b>", area: "<b>1200</b>", length: "", width: "" }
        ]
      },
      "1612": { 
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
          { section: "<span style='font-weight:700; color:var(--primary);'>Total (Ground Floor)</span>", area: "<span style='font-weight:700; color:var(--primary);'>806</span>", length: "", width: "" },
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
          { section: "<span style='font-weight:700; color:var(--primary);'>Total (First floor)</span>", area: "<span style='font-weight:700; color:var(--primary);'>806</span>", length: "", width: "" },
          { section: "<b>Total Building Area</b>", area: "<b>1612</b>", length: "", width: "" }
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
          let isTotal = room.area.toString().includes("var(--primary)");
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

tsbFiles.forEach(file => {
  const match = file.match(/bh-tsb-(\d+)\.html/);
  if (!match) return;
  const id = match[1];
  const filePath = path.join(htmlDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Completely replace the script block
  const blockToReplace = new RegExp(`<script>\\s*const floorData${id}[\\s\\S]*?</script>(\\s*<script>document\\.addEventListener\\("DOMContentLoaded"[\\s\\S]*?</script>)?`, 'g');
  if (content.match(blockToReplace)) {
    content = content.replace(blockToReplace, scriptTemplate(id));
  } else {
    const fallbackRegex = new RegExp(`<script>\\s*const floorData${id}[\\s\\S]*?</script>`, 'g');
    content = content.replace(fallbackRegex, scriptTemplate(id));
  }
  
  // Replace button labels and handlers
  content = content.replace(/>600 Sq\.Ft<\/button>/g, `>600*2 Sq.Ft</button>`);
  content = content.replace(/onclick="selectArea\('\d+', '850', this\)">850 Sq\.Ft<\/button>/g, `onclick="selectArea('${id}', '1612', this)">806*2 Sq.Ft</button>`);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated TSB file ${file}`);
});

// 2. Remove the red color from all bh-dv-, bh-cb-, bh-sh- files
const otherFiles = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html') && (f.startsWith('bh-dv-') || f.startsWith('bh-cb-') || f.startsWith('bh-sh-')));

otherFiles.forEach(file => {
  const filePath = path.join(htmlDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes("color:red")) {
      content = content.replace(/color:red/g, "font-weight:700; color:var(--primary)");
      // Update the JS matching logic for 'isTotal' inside these files
      content = content.replace(/room.area.toString\(\).includes\("color:red"\)/g, `room.area.toString().includes("var(--primary)")`);
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Removed red from ${file}`);
  }
});
