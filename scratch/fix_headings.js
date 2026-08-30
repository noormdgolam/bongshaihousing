const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../server/views/pages');

function fixHeadings() {
  const files = fs.readdirSync(dir);
  let changed = 0;

  for (const file of files) {
    if (!file.endsWith('.njk')) continue;
    const filepath = path.join(dir, file);
    let content = fs.readFileSync(filepath, 'utf8');

    // Replace: >What is the Bodorgonj, Rangpur Project?< with >Bodorgonj, Rangpur Project<
    // We can use a regex to match ">What is the (.*?) Project\?<"
    const regex = />What is the (.*?)\?</g;
    
    if (regex.test(content)) {
      const newContent = content.replace(regex, (match, p1) => {
        // if p1 ends with ' Project', maybe keep it, or strip it?
        // Wait, the regex matched ">What is the Bodorgonj, Rangpur Project?<"
        // Let's replace with >$p1<, which would be ">Bodorgonj, Rangpur Project<"
        return `>${p1}<`;
      });
      
      fs.writeFileSync(filepath, newContent, 'utf8');
      changed++;
      console.log(`Updated ${file}`);
    }
  }

  console.log(`Total files updated: ${changed}`);
}

fixHeadings();
