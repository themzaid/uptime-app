// src/worker/start.ts
import { config } from 'dotenv';
config({ path: '.env.local' });

// Use dynamic import so it waits for the env vars to be loaded!
import('./worker').catch(console.error);
