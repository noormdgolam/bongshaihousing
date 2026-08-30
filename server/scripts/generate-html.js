const fs = require('fs');
const http = require('http');

const registry = JSON.parse(fs.readFileSync('server/page-registry.json'));

Promise.all(Object.keys(registry).map(url => {
  return new Promise(resolve => {
    http.get(`http://localhost:3000${url}`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        fs.writeFileSync('.' + url, data);
        resolve();
      });
    }).on('error', err => {
      console.error(err);
      resolve();
    });
  });
})).then(() => {
  console.log('Finished rendering HTML files');
});
