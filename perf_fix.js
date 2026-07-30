const fs = require('fs');
let js = fs.readFileSync('js/global-upgrades.js', 'utf8');

// 1. Fix Custom Cursor Hover
const hoverFixRegex = /const addHoverLinks = \(\) => \{[\s\S]*?hoverObserver\.observe\(document\.body, \{ childList: true, subtree: true \}\);\n\}\);/g;
const hoverFixReplacement = `
    // Event delegation for hover effect - super fast, no observer needed!
    const hoverSelector = 'a, button, input[type="submit"], input[type="button"], .cat-item, .clickable, label, .gallery-item';
    document.body.addEventListener('mouseover', (e) => {
        if (e.target.closest(hoverSelector)) {
            cursor.classList.add('hovering');
            follower.classList.add('hovering');
        }
    });
    document.body.addEventListener('mouseout', (e) => {
        if (e.target.closest(hoverSelector)) {
            cursor.classList.remove('hovering');
            follower.classList.remove('hovering');
        }
    });
});`;
js = js.replace(hoverFixRegex, hoverFixReplacement.trim());

// 2. Fix Lightbox Observer
const lbFixRegex = /const applyLightbox = \(\) => \{[\s\S]*?lbObserver\.observe\(document\.body, \{ childList: true, subtree: true \}\);\n\}\)\(\);/g;
const lbFixReplacement = `
  // Event delegation for lightbox clicks
  document.body.addEventListener('click', (e) => {
    const selectors = [
      '.property-img-wrap img',
      '.property-img img',
      '.project-main-image img',
      '.gallery-item img',
      '.product-image-container img',
      '.zoomable',
      'img[data-zoomable="true"]'
    ].join(', ');
    
    const img = e.target.closest(selectors);
    if (img) {
      if (!img.src || img.width < 60 || img.closest('.navbar') || img.closest('.footer')) return;
      e.preventDefault();
      openLightbox(img.src, img.alt || img.title || '');
    }
  });
})();`;
js = js.replace(lbFixRegex, lbFixReplacement.trim());

// 3. Fix scroll listener
const scrollFixRegex = /window\.addEventListener\('scroll', \(\) => \{[\s\S]*?circle\.style\.strokeDashoffset = circumference - drawLength;\n        \}\n    \}\);/g;
const scrollFixReplacement = `
    let scrollAF;
    window.addEventListener('scroll', () => {
        if (scrollAF) return;
        scrollAF = requestAnimationFrame(() => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            
            if (scrollTop > 300) {
                ring.classList.add('active');
            } else {
                ring.classList.remove('active');
            }
            
            if(scrollHeight > 0) {
                const scrollPercentage = scrollTop / scrollHeight;
                const drawLength = circumference * scrollPercentage;
                circle.style.strokeDashoffset = circumference - drawLength;
            }
            scrollAF = null;
        });
    }, {passive: true});`;
js = js.replace(scrollFixRegex, scrollFixReplacement.trim());

// 4. Fix ambient glow
const glowFixRegex = /document\.addEventListener\('mousemove', \(e\) => \{\n        glow\.style\.setProperty\('--mouse-x', e\.clientX \+ 'px'\);\n        glow\.style\.setProperty\('--mouse-y', e\.clientY \+ 'px'\);\n    \}\);/g;
const glowFixReplacement = `
    let glowAF;
    document.addEventListener('mousemove', (e) => {
        if (glowAF) cancelAnimationFrame(glowAF);
        glowAF = requestAnimationFrame(() => {
            glow.style.setProperty('--mouse-x', e.clientX + 'px');
            glow.style.setProperty('--mouse-y', e.clientY + 'px');
        });
    }, {passive: true});`;
js = js.replace(glowFixRegex, glowFixReplacement.trim());

fs.writeFileSync('js/global-upgrades.js', js, 'utf8');
console.log('Optimized global-upgrades.js');
