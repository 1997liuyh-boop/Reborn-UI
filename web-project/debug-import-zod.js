
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

(async () => {
    try {
        const entryPath = require.resolve('@nuxt/content');
        let contentDir = path.dirname(entryPath);
        while (!contentDir.endsWith('@nuxt' + path.sep + 'content') && !contentDir.endsWith('@nuxt/content')) {
            const parent = path.dirname(contentDir);
            if (parent === contentDir) break; 
            contentDir = parent;
        }
        if (!contentDir.includes('content')) {
             contentDir = path.dirname(path.dirname(entryPath)); 
        }

        console.log('Content Dir:', contentDir);

        // Mimic the import structure in module.mjs
        // We need to import 'zod' as if we are inside contentDir.
        // Node.js doesn't easily allow "import from path" without a custom loader or hacking paths.
        // But we can check if we can import it from THIS script, assuming we are peer.
        
        try {
            const z = await import('zod');
            console.log('SUCCESS: Imported zod from current script context');
            console.log('Zod keys:', Object.keys(z));
        } catch (e) {
            console.error('FAILURE: Failed to import zod from script context:', e.message);
        }

    } catch (e) {
        console.error('Error:', e);
    }
})();
