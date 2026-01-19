
import { createRequire } from 'module';
import path from 'path';
const require = createRequire(import.meta.url);

try {
  // Resolve main entry point usually lib/index.js or module.mjs
  // We'll try to resolve just '@nuxt/content'
  const entryPath = require.resolve('@nuxt/content');
  console.log('Content Entry:', entryPath);
  
  // Assume package root is up a few levels. 
  // e.g. .../node_modules/@nuxt/content/dist/module.mjs -> node_modules/@nuxt/content
  // If entryPath contains 'dist', we go up 2 levels?
  
  let contentDir = path.dirname(entryPath);
  while (!contentDir.endsWith('@nuxt' + path.sep + 'content') && !contentDir.endsWith('@nuxt/content')) {
      const parent = path.dirname(contentDir);
      if (parent === contentDir) break; 
      contentDir = parent;
  }
  
  // If we can't find it easily, just look for node_modules in the path
  if (!contentDir.includes('content')) {
      // Fallback relative to entry
      contentDir = path.dirname(path.dirname(entryPath)); // Assuming dist/module.mjs
  }
  
  console.log('Content Dir Estimated:', contentDir);
  
  try {
     const zodPath = require.resolve('zod', { paths: [contentDir] });
     console.log('SUCCESS: Zod resolved from content dir:', zodPath);
     const zodPkg = require(path.join(path.dirname(zodPath), 'package.json'));
     console.log('Zod Version:', zodPkg.version);
  } catch (e) {
     console.error('FAILURE: Failed to resolve zod from content dir:', e.message);
     
      // Debug: list node_modules in content dir
     const fs = require('fs');
     const nm = path.join(contentDir, 'node_modules');
     if (fs.existsSync(nm)) {
        console.log('node_modules in content dir:', fs.readdirSync(nm));
     } else {
        console.log('No node_modules in content dir at', nm);
     }
  }
} catch (e) {
  console.error('Global Error:', e);
}
