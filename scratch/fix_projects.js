const fs = require('fs');
const path = require('path');

// 1. Fix Baunia, Airport project page
const bauniaFile = path.join(__dirname, '../server/views/pages/project-baunia-airport.njk');
let bauniaContent = fs.readFileSync(bauniaFile, 'utf8');

// Replace all Cumilla references with Baunia, Airport
bauniaContent = bauniaContent.replace(/Cumilla/g, 'Baunia, Airport');
bauniaContent = bauniaContent.replace(/cumilla_1784362514071\.webp/g, 'baunia-airport.jpg');
bauniaContent = bauniaContent.replace(/cumilla_1784362514071-400w\.webp 400w, images\/projects\/completed\/cumilla_1784362514071-700w\.webp 700w, images\/projects\/completed\/baunia-airport\.jpg 1024w/g, 'baunia-airport.jpg 1000w');
bauniaContent = bauniaContent.replace(/srcset=".*?" sizes=".*?"/g, ''); // Remove srcset and sizes for simple jpg
bauniaContent = bauniaContent.replace(/Completed interior space/g, 'Completed exterior');
bauniaContent = bauniaContent.replace(/interior space/g, 'multi-story residential steel building');

fs.writeFileSync(bauniaFile, bauniaContent, 'utf8');
console.log('Updated project-baunia-airport.njk');

// 2. Insert into projects.njk
const projectsFile = path.join(__dirname, '../server/views/pages/projects.njk');
let projectsContent = fs.readFileSync(projectsFile, 'utf8');

const asuliaCard = `          <article class="property-card filter-item reveal visible" data-tilt="" data-aos="fade-up" style="--i:0">
            <div class="property-img-wrap">
              <img src="images/projects/completed/asulia-dhaka.jpg" alt="Completed exterior of prefab steel building in Asulia, Dhaka" title="Prefab building exterior in Asulia, Dhaka" style="width:100%; height:auto; display:block;" loading="lazy" width="1024" height="1024">
            </div>
            <div class="property-card-body filter-item-body" data-aos="fade-up">
              <span class="property-type">Completed Project</span>
              <h2 class="property-name">Asulia, Dhaka Project</h2>
              <p class="property-desc">A beautifully finished multi-story residential steel building in <strong>Asulia, Dhaka</strong>. Our steel building expertise ensures sturdy construction and premium quality residential housing.</p>
              <a href="project-asulia-dhaka.html" class="btn-card-link">View Details</a>
            </div>
          </article>
`;

const bauniaCard = `          <article class="property-card filter-item reveal visible" data-tilt="" data-aos="fade-up" style="--i:1">
            <div class="property-img-wrap">
              <img src="images/projects/completed/baunia-airport.jpg" alt="Completed exterior of prefab steel building in Baunia, Airport" title="Prefab building exterior in Baunia, Airport" style="width:100%; height:auto; display:block;" loading="lazy" width="1024" height="1024">
            </div>
            <div class="property-card-body filter-item-body" data-aos="fade-up">
              <span class="property-type">Completed Project</span>
              <h2 class="property-name">Baunia, Airport Project</h2>
              <p class="property-desc">A beautifully finished multi-story residential steel building in <strong>Baunia, Airport</strong>. Our steel building expertise ensures sturdy construction and premium quality residential prefab housing across the region.</p>
              <a href="project-baunia-airport.html" class="btn-card-link">View Details</a>
            </div>
          </article>
`;

if (!projectsContent.includes('Asulia, Dhaka Project')) {
  projectsContent = projectsContent.replace('<div class="properties-grid stagger">', '<div class="properties-grid stagger">\n' + asuliaCard + bauniaCard);
  fs.writeFileSync(projectsFile, projectsContent, 'utf8');
  console.log('Inserted Asulia and Baunia into projects.njk');
} else {
  console.log('Asulia already exists in projects.njk');
}
