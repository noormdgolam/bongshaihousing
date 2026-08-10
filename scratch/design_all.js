const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const htmlDir = path.join(baseDir, '..');

const cssBlock = `  <style>
    .modern-area-selector {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .modern-area-btn {
      padding: 8px 16px;
      border-radius: 30px;
      border: 1px solid var(--grey-300);
      background: var(--white);
      color: var(--grey-700);
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .modern-area-btn:hover {
      border-color: var(--primary);
      color: var(--primary);
    }
    .modern-area-btn.active {
      background: var(--primary);
      color: var(--white);
      border-color: var(--primary);
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    }
    .modern-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.95rem;
      text-align: left;
    }
    .modern-table th {
      padding: 12px 16px;
      font-weight: 700;
      color: var(--grey-600);
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.5px;
      border-bottom: 2px solid var(--grey-200);
    }
    .modern-table td {
      padding: 16px;
      font-weight: 500;
      border-bottom: 1px solid var(--grey-100);
    }
    .modern-table tbody tr:hover {
      background: #fbfbfc;
    }
  </style>
  <div class="modern-area-selector"`;

// Regex patterns
const tableRegex = /<table class="spec-table" style="width: 100%; border-collapse: collapse; font-size: 0\.95rem; text-align: center;">\s*<thead>\s*<tr style=".*?">/g;
const thRegex = /<th style=".*?">/g;

const files = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html') && (f.startsWith('bh-') || f.startsWith('lcv-') || f.startsWith('dv-')));

files.forEach(file => {
  const filePath = path.join(htmlDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Skip if already upgraded
  if (content.includes('modern-area-selector') || file.startsWith('bh-tsb-')) {
    return;
  }

  // 1. Inject CSS and change class of container
  content = content.replace(/<div class="area-selector"/, cssBlock);
  
  // 2. Change buttons class
  content = content.replace(/class="area-btn\s*"/g, 'class="modern-area-btn"');
  content = content.replace(/class="area-btn\s+active"/g, 'class="modern-area-btn active"');
  content = content.replace(/class='area-btn\s*'/g, 'class="modern-area-btn"');
  content = content.replace(/class='area-btn\s+active'/g, 'class="modern-area-btn active"');

  // 3. Update all spec-table styling
  content = content.replace(/<table class="spec-table" style=".*?">/g, '<table class="modern-table">');
  
  // Clean up table header inline styles
  content = content.replace(/<thead>\s*<tr style=".*?">/g, '<thead>\n        <tr>');
  content = content.replace(/<th style=".*?">/g, '<th>');

  // 4. Update selectArea JS
  content = content.replace(/querySelectorAll\('\.area-btn'\)/g, "querySelectorAll('.area-btn, .modern-area-btn')");
  content = content.replace(/querySelectorAll\("\.area-btn"\)/g, 'querySelectorAll(".area-btn, .modern-area-btn")');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Upgraded JS for", file);
  }
});
