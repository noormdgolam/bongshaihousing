const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

content = content.replace(/const resetImage = \(panel\) => {[\s\S]*?if \(img\) img\.src = img\.getAttribute\('data-default-img'\);\s*};/, 
`const resetImage = (panel) => {
        const img = panel.querySelector('.pkg-panel-image img');
        if (img) {
          img.src = img.getAttribute('data-default-img');
          if (img.hasAttribute('data-default-srcset')) {
            img.setAttribute('srcset', img.getAttribute('data-default-srcset'));
          }
        }
      };`);

content = content.replace(/hoverLinks\.forEach\(link => {\s*link\.addEventListener\('mouseenter', \(\) => {\s*img\.src = link\.getAttribute\('data-img'\);\s*}\);\s*link\.addEventListener\('focus', \(\) => {\s*img\.src = link\.getAttribute\('data-img'\);\s*}\);\s*}\);/,
`// Save initial srcset
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
        });`);

fs.writeFileSync('index.html', content);
