
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

(async () => {
    try {
        console.log('Testing zod import...');
        const z = await import('zod');
        console.log('SUCCESS: Zod imported');
        
        console.log('Testing zod-to-json-schema import...');
        const ztjs = await import('zod-to-json-schema');
        console.log('SUCCESS: zod-to-json-schema imported');
        console.log('Keys:', Object.keys(ztjs));

    } catch (e) {
        console.error('FAILURE:', e.message);
        console.error('Stack:', e.stack);
    }
})();
