// src/worker/start.ts
import { config } from 'dotenv';
config({ path: '.env.local' });

// Use dynamic import so it waits for the env vars to be loaded!
import('./worker').catch((err) => {
    console.error('Fatal error during worker startup:', err);
    process.exit(1); // Force exit with error code so Fly.io knows it crashed!
});
