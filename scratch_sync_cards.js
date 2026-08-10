const fs = require('fs');
const path = require('path');

const dir = __dirname;
const projectDir = dir;

const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.html'));
let filesUpdated = 0;

for (const file of files) {
    if (file.startsWith('bh-')) continue; // Skip product pages
    
    const filePath = path.join(projectDir, file);
    let html = fs.readFileSync(filePath, 'utf8');
    
    // Only process listing pages (which contain cards with property-specs)
    if (!html.includes('class="property-specs"')) continue;
    
    console.log(`Processing: ${file}`);
    let modifications = 0;
    
    const regex = /<h2 class="property-name">([\s\S]{1,100}?)<\/h2>([\s\S]{1,500}?)<div class="property-specs">([\s\S]{1,1000}?)<\/div>\s*<div class="property-price">([\s\S]{1,500}?)href="([^"]+\.html)"/g;
    
    html = html.replace(regex, (match, rawTitle, desc, specs, priceAndBtn, href) => {
        let cleanTitle = rawTitle.replace('What is ', '').replace('?', '').trim();
        
        let bed = "3 Bedrooms";
        let bath = "2 Bathrooms";
        let kitchen = "1 Kitchen";
        
        try {
            const productPath = path.join(projectDir, href);
            if (fs.existsSync(productPath)) {
                const productHtml = fs.readFileSync(productPath, 'utf8');
                const floorDataMatch = productHtml.match(/const floorData.*? = (\{[\s\S]*?\n\s*\});/);
                
                if (floorDataMatch) {
                    let dataString = floorDataMatch[0];
                    let bedMatch = dataString.match(/bed:\s*"([^"]+)"/);
                    let bathMatch = dataString.match(/bath:\s*"([^"]+)"/);
                    let kitchenMatch = dataString.match(/kitchen:\s*"([^"]+)"/);
                    
                    if (bedMatch) bed = bedMatch[1];
                    if (bathMatch) bath = bathMatch[1];
                    if (kitchenMatch) kitchen = kitchenMatch[1];
                    
                    if (kitchen === "N/A" || kitchen === "") kitchen = "Kitchen";
                }
            } else {
                console.warn(`  Product file not found: ${href}`);
            }
        } catch (err) {
            console.error(`  Error reading product file: ${href}`, err.message);
        }
        
        let newSpecs = `\n<div class="spec-item"><span aria-hidden="true" class="spec-icon">🛏️</span> ${bed}</div>\n<div class="spec-item"><span aria-hidden="true" class="spec-icon">🚿</span> ${bath}</div>\n<div class="spec-item"><span aria-hidden="true" class="spec-icon">🍳</span> ${kitchen}</div>\n`;
        
        modifications++;
        return `<h2 class="property-name">${cleanTitle}</h2>${desc}<div class="property-specs">${newSpecs}</div>\n<div class="property-price">${priceAndBtn}href="${href}"`;
    });
    
    if (modifications > 0) {
        fs.writeFileSync(filePath, html, 'utf8');
        console.log(`  Updated ${modifications} cards in ${file}`);
        filesUpdated++;
    }
}

console.log(`\nFinished! Updated ${filesUpdated} files.`);
