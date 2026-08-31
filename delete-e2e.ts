import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from './src/db';
import { monitors } from './src/db/schema';
import { like } from 'drizzle-orm';
import { monitorQueue } from './src/worker/queue';

async function cleanup() {
  console.log("DB URL:", process.env.DATABASE_URL?.substring(0, 20) + "...");
  const e2eMonitors = await db.select().from(monitors).where(like(monitors.name, 'E2E Fake Monitor%'));
  console.log('Found E2E monitors:', e2eMonitors.length);
  
  for (const m of e2eMonitors) {
    console.log('Deleting', m.name);
    await db.delete(monitors).where(like(monitors.name, m.name));
    try {
        await monitorQueue.removeJobScheduler(`monitor-${m.id}`);
        console.log('Removed from queue');
    } catch (e) {
        console.log('Queue removal error', e);
    }
  }
  process.exit(0);
}
cleanup();
