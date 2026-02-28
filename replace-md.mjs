import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.md')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('d:/demo/shadcn-docs-nuxt-starter/content/2.components');
let count = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Handle both single and double quotes for componentFiles just in case
  const regex = /:componentFiles=(['"])(.*?)(['"])\s+:uniapp="true"/g;
  const regex2 = /:uniapp="true"\s+:componentFiles=(['"])(.*?)(['"])/g;
  
  let modified = false;
  if (regex.test(content)) {
    content = content.replace(regex, ":componentFiles=$1$2$3 :uniappFiles=$1$2$3");
    modified = true;
  }
  if (regex2.test(content)) {
    content = content.replace(regex2, ":componentFiles=$1$2$3 :uniappFiles=$1$2$3");
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
    count++;
  }
});
console.log(`Updated ${count} files.`);
