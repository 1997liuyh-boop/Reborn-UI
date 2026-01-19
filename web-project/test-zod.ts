
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

console.log('Zod version:', z.ZodSchema ? 'Found' : 'Unknown');
console.log('zod-to-json-schema loaded');
