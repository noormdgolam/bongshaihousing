const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const htmlDir = path.join(baseDir, '..');

const files = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html') && (f.startsWith('bh-dv-') || f.startsWith('bh-cb-')));

files.forEach(file => {
  const match = file.match(/bh-(dv|cb)-(\d+)\.html/);
  if (!match) return;
  const id = match[2];

  const filePath = path.join(htmlDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add the init script if it's not there
  if (!content.includes('document.addEventListener("DOMContentLoaded"')) {
    content = content.replace(
      '</div><!-- End of page-sidebar-content -->',
      `<script>document.addEventListener("DOMContentLoaded", () => { if (typeof updateSpecs${id} === "function") { updateSpecs${id}("600"); } });</script>\n</div><!-- End of page-sidebar-content -->`
    );
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
