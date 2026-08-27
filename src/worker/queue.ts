// src/worker/queue.ts
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

export const monitorQueue = new Queue('monitor-queue', { connection });

export async function upsertMonitorJob(monitorId: number, url: string, intervalMinutes: number) {
    const schedulerId = `monitor-${monitorId}`;

    // BullMQ v6 uses upsertJobScheduler for repeatable jobs
    await monitorQueue.upsertJobScheduler(
        schedulerId,
        {
            every: intervalMinutes * 60 * 1000,
        },
        {
            name: 'check-monitor',
            data: { monitorId, url },
        }
    );
}

export async function removeMonitorJob(monitorId: number) {
    const schedulerId = `monitor-${monitorId}`;
    try {
        await monitorQueue.removeJobScheduler(schedulerId);
    } catch (err) {
        // Ignore if it doesn't exist
    }
}
