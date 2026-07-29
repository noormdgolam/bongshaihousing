const fs = require('fs');
const code = fs.readFileSync('css/bangla-translation.js', 'utf8');
const match1 = code.match(/"Single Story Building":\s*"([^"]+)"/);
if (match1) console.log("Single Story Building:", match1[1]);

const match2 = code.match(/"Durable and cost-effective single story building ideal for commercial or residential needs.":\s*"([^"]+)"/);
if (match2) console.log("Durable...", match2[1]);

const match3 = code.match(/"4 Bathrooms":\s*"([^"]+)"/);
if (match3) console.log("4 Bathrooms:", match3[1]);

const match4 = code.match(/"Smart Design":\s*"([^"]+)"/);
if (match4) console.log("Smart Design:", match4[1]);
