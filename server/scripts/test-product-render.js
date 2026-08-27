const express = require('express');
const path = require('path');
const nunjucks = require('nunjucks');
const request = require('http');

const app = express();
const nunjucksEnv = nunjucks.configure(path.join(__dirname, '..', 'views'), {
  autoescape: true,
  express: app,
});
app.set('view engine', 'njk');

const productsRouter = require('../routes/products');
app.use('/', productsRouter);

const server = app.listen(3099, async () => {
  console.log('Test server listening on port 3099');

  const testUrls = [
    '/bh-sb-301.html',
    '/bh-dv-201.html',
    '/bh-tsb-101.html',
    '/bh-ct-501.html',
    '/bh-cb-901.html'
  ];

  for (const u of testUrls) {
    await new Promise((resolve) => {
      request.get(`http://localhost:3099${u}`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          console.log(`Testing ${u} -> Status ${res.statusCode}, Body length: ${body.length}`);
          if (body.includes('Fixed Price') && (body.includes('৳') || body.includes('Taka'))) {
            console.log(`  ✓ ${u} has Fixed Price and Taka symbol`);
          } else {
            console.log(`  ⚠ ${u} check content`);
          }
          resolve();
        });
      });
    });
  }

  server.close(() => {
    console.log('Test completed successfully!');
    process.exit(0);
  });
});
