const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const htmlDir = path.join(baseDir, '..');

const files = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html') && f.startsWith('bh-sh-'));

const buttonTemplate = (id) => `<div class="modern-area-selector" id="area-selector-${id}">
<button type="button" class="modern-area-btn active" onclick="selectArea('${id}', '1612', this)">1612 Sq.Ft</button>
</div>`;

const materialsBody = `<tbody style="color: var(--grey-800);">
      <tr style="border-bottom: 1px solid var(--grey-100);">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark); width: 30%;">Footing</td>
        <td style="padding: 12px 16px;">Precast Rc footing, Tie beam with 2200 psi grade concrete</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--grey-100); background: var(--off-white);">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark);">Light Steel Materials</td>
        <td style="padding: 12px 16px;">Column, Rafter, Purlin and others member made of MS steel Grade SS400, Strength 250 Mpa</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--grey-100);">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark);">Ground floor</td>
        <td style="padding: 12px 16px;">24" x 24" x 3" Precast cement concrete block is used</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--grey-100); background: var(--off-white);">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark);">Wall</td>
        <td style="padding: 12px 16px;">16" x 8" x 3" concreate block</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--grey-100);">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark);">Roof</td>
        <td style="padding: 12px 16px;">0.32mm Color steel sheet has to be used.</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--grey-100); background: var(--off-white);">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark);">Door</td>
        <td style="padding: 12px 16px;">7' x 3' Steel frame with single panel shutter.</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--grey-100);">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark);">Toilet &amp; Kitchen door</td>
        <td style="padding: 12px 16px;">7' x 2.5' Steel frame with single panel shutter.</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--grey-100); background: var(--off-white);">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark);">Window</td>
        <td style="padding: 12px 16px;">4' x 3' Steel frame and steel shutter with Grill</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--grey-100);">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark);">Floor finishing</td>
        <td style="padding: 12px 16px;">Net Cement finishing</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--grey-100); background: var(--off-white);">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark);">Celling finishing</td>
        <td style="padding: 12px 16px;">Gypsum board</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--grey-100);">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark);">Bath room fitting</td>
        <td style="padding: 12px 16px;">PVC fitting</td>
      </tr>
      <tr style="background: var(--off-white);">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--primary-dark); border-bottom-left-radius: 8px;">Electric wiring</td>
        <td style="padding: 12px 16px; border-bottom-right-radius: 8px;">2 bulb, 1 fan point, 2 power sockets in each room. BRB cable is to be used.</td>
      </tr>
    </tbody>`;

const scriptTemplate = (id) => `<script>
    const floorData${id} = {
      "1612": { 
        bed: "5 Bedrooms", bath: "4 Bathrooms", living: "1 Living Room", drawing: "1 Drawing Room", dining: "N/A", kitchen: "2 Kitchens",
        rooms: [
          { section: "<b>Ground Floor</b>", area: "", length: "", width: "" },
          { section: "Floor area", area: 806, length: 31, width: 26 },
          { section: "Bed room 1", area: 144, length: 12, width: 12 },
          { section: "Bed room 2", area: 120, length: 12, width: 10 },
          { section: "Living room", area: 264, length: 22, width: 12 },
          { section: "Kitchen", area: 72, length: 12, width: 6 },
          { section: "Bath 1", area: 36, length: 6, width: 6 },
          { section: "Bath 2", area: 36, length: 6, width: 6 },
          { section: "Varanda", area: 84, length: 24, width: 3.5 },
          { section: "Portch", area: 48, length: 8, width: 6 },
          { section: "<span style='color:red;'>Total (Ground Floor)</span>", area: "<span style='color:red;'>804</span>", length: "", width: "" },
          { section: "<b>First floor</b>", area: "", length: "", width: "" },
          { section: "Floor area", area: 806, length: 31, width: 26 },
          { section: "Bed room 1", area: 144, length: 12, width: 12 },
          { section: "Bed room 2", area: 120, length: 12, width: 10 },
          { section: "Bed room 3", area: 144, length: 12, width: 12 },
          { section: "Drawing room", area: 120, length: 12, width: 10 },
          { section: "Kitchen", area: 72, length: 12, width: 6 },
          { section: "Bath 1", area: 36, length: 6, width: 6 },
          { section: "Bath 2", area: 36, length: 6, width: 6 },
          { section: "Varanda", area: 84, length: 24, width: 3.5 },
          { section: "Portch", area: 48, length: 8, width: 6 },
          { section: "<span style='color:red;'>Total (First floor)</span>", area: "<span style='color:red;'>804</span>", length: "", width: "" },
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
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--grey-200); padding-bottom: 8px;"><span style="color: var(--grey-700);"><span style="color:var(--accent);margin-right:8px;font-size:1.2rem;">▪</span>Kitchen</span><span style="font-weight: 700; color: var(--grey-900);">\${data.kitchen}</span></div>
          <div style="display: flex; justify-content: space-between; align-items: center;"><span style="color: var(--grey-700);"><span style="color:var(--accent);margin-right:8px;font-size:1.2rem;">▪</span>Varanda &amp; Porch</span><span style="font-weight: 700; color: var(--grey-900);">Included</span></div>
        \`;
      }
    }
  </script>
  <script>document.addEventListener("DOMContentLoaded", () => { if (typeof updateSpecs${id} === "function") { updateSpecs${id}("1612"); } });</script>`;

files.forEach(file => {
  const match = file.match(/bh-sh-(\d+)\.html/);
  if (!match) return;
  const id = match[1];

  const filePath = path.join(htmlDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // replace buttons
  const buttonRegex = new RegExp(`<div class="modern-area-selector" id="area-selector-${id}">[\\s\\S]*?</div>`);
  content = content.replace(buttonRegex, buttonTemplate(id));

  // replace materials body
  const materialsRegex = /<tbody style="color: var\(--grey-800\);">[\s\S]*?<\/tbody>/;
  content = content.replace(materialsRegex, materialsBody);

  // replace script
  const blockToReplace = new RegExp(`<script>\\s*const floorData${id}[\\s\\S]*?</script>\\s*<script>document\\.addEventListener\\("DOMContentLoaded", \\(\\) => { if \\(typeof updateSpecs${id} === "function"\\) { updateSpecs${id}\\("\\w+"\\); } }\\);</script>`, 'g');
  
  content = content.replace(blockToReplace, scriptTemplate(id));

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
