// src/worker/worker.ts
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { ping } from './ping';
import { db } from '../db';
import { checks, incidents } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

export const monitorWorker = new Worker('monitor-queue', async (job) => {
    const { monitorId, url } = job.data;
    console.log(`[Job ${job.id}] Checking monitor ${monitorId} at ${url}`);

    const result = await ping(url);
    console.log(`[Job ${job.id}] Result:`, result);

    // 1. Save the check to the database
    await db.insert(checks).values({
        monitorId,
        statusCode: result.status,
        latency: result.latency,
    });

    // 2. Incident Detection Logic
    if (result.isUp) {
        // Site is UP: Resolve any open incidents for this monitor
        await db.update(incidents)
            .set({ status: 'resolved', resolvedAt: new Date() })
            .where(
                and(
                    eq(incidents.monitorId, monitorId),
                    eq(incidents.status, 'open')
                )
            );
    } else {
        // Site is DOWN: Check if we need to open an incident
        // Let's say 3 consecutive failures = an incident
        const recentChecks = await db.select()
            .from(checks)
            .where(eq(checks.monitorId, monitorId))
            .orderBy(desc(checks.timestamp))
            .limit(3);

        // A check failed if status is 0 (network error) or >= 400 (HTTP error)
        const allFailed = recentChecks.length === 3 && recentChecks.every(
            c => c.statusCode === 0 || (c.statusCode !== null && c.statusCode >= 400)
        );

        if (allFailed) {
            // Check if there's already an open incident
            const existingIncident = await db.select()
                .from(incidents)
                .where(
                    and(
                        eq(incidents.monitorId, monitorId),
                        eq(incidents.status, 'open')
                    )
                )
                .limit(1);

            if (existingIncident.length === 0) {
                // Open a new incident!
                await db.insert(incidents).values({
                    monitorId,
                    status: 'open',
                });
                console.log(`🚨 INCIDENT OPENED for monitor ${monitorId}!`);
            }
        }
    }

    return result;
}, { connection });

monitorWorker.on('completed', (job) => {
    console.log(`[Job ${job.id}] Completed successfully`);
});

monitorWorker.on('failed', (job, err) => {
    console.log(`[Job ${job?.id}] Failed:`, err);
});

console.log('Worker is listening for jobs...');
