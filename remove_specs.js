const fs = require('fs');

const filePath = 'e:\\web\\Bongshaihousing\\cottage-house.html';
let html = fs.readFileSync(filePath, 'utf8');

// Remove property-specs block
html = html.replace(/<div class="property-specs">[\s\S]*?<\/div>\s*(?=<div class="property-price">)/g, '');

fs.writeFileSync(filePath, html, 'utf8');
console.log('Removed specs from cottage-house.html');
