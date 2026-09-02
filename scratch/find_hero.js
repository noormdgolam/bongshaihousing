const fs = require('fs');
const lines = fs.readFileSync('css/style.css', 'utf8').split('\n');

lines.forEach((line, i) => {
  if (line.includes('.hero-content') || (line.includes('hero') && line.includes('padding'))) {
    console.log(`L${i + 1}: ${line.trim()}`);
  }
});
