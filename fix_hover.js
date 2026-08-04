const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const targetScript = `      const resetImage = (panel) => {
        const img = panel.querySelector('.pkg-panel-image img');
        if (img) img.src = img.getAttribute('data-default-img');
      };`;
      
const replaceScript = `      const resetImage = (panel) => {
        const img = panel.querySelector('.pkg-panel-image img');
        if (img) {
          img.src = img.getAttribute('data-default-img');
          if (img.hasAttribute('data-default-srcset')) {
            img.setAttribute('srcset', img.getAttribute('data-default-srcset'));
          }
        }
      };`;

const targetHover = `        hoverLinks.forEach(link => {
          link.addEventListener('mouseenter', () => {
            img.src = link.getAttribute('data-img');
          });
          link.addEventListener('focus', () => {
            img.src = link.getAttribute('data-img');
          });
        });`;
        
const replaceHover = `        // Save initial srcset
        if (img.hasAttribute('srcset')) {
          img.setAttribute('data-default-srcset', img.getAttribute('srcset'));
        }

        hoverLinks.forEach(link => {
          link.addEventListener('mouseenter', () => {
            img.removeAttribute('srcset');
            img.src = link.getAttribute('data-img');
          });
          link.addEventListener('focus', () => {
            img.removeAttribute('srcset');
            img.src = link.getAttribute('data-img');
          });
        });`;

if (content.includes(targetScript) && content.includes(targetHover)) {
    content = content.replace(targetScript, replaceScript);
    content = content.replace(targetHover, replaceHover);
    fs.writeFileSync('index.html', content);
    console.log('Fixed index.html hover logic');
} else {
    console.log('Targets not found');
}
