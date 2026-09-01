// src/worker/queue.ts
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

export const monitorQueue = new Queue('monitor-queue', { 
    connection,
    prefix: process.env.BULLMQ_PREFIX || 'bull'
});

export async function upsertMonitorJob(monitorId: number, url: string, intervalMinutes: number, isNew: boolean = false) {
    const schedulerId = `monitor-${monitorId}`;

    function getCron(minutes: number) {
        if (minutes < 60) return `*/${minutes} * * * *`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `0 */${hours} * * *`;
        const days = Math.floor(hours / 24);
        return `0 0 */${days} * *`;
    }

    // BullMQ v6 uses upsertJobScheduler for repeatable jobs
    await monitorQueue.upsertJobScheduler(
        schedulerId,
        {
            pattern: getCron(intervalMinutes),
            immediately: isNew,
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
