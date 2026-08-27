// src/worker/test-queue.ts
import { config } from 'dotenv';
config({ path: '.env.local' });

import { upsertMonitorJob } from './queue';

async function run() {
    console.log('Adding test monitor to queue...');
    // We'll schedule a check for google.com every 1 minute
    await upsertMonitorJob(999, 'https://google.com', 1);
    console.log('Job added!');
    process.exit(0);
}

run().catch(console.error);
