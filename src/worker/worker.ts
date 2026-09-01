// src/worker/worker.ts
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { ping } from './ping';
import { shouldResolveIncident, shouldOpenIncident, shouldSendAlert } from './incident-logic';
import { db } from '../db';
import { checks, incidents, monitors, userSettings } from '../db/schema';
import { eq, and, desc, lt } from 'drizzle-orm';
import { sendIncidentEmail, sendSlackAlert } from './alerts';

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

    // We need the monitor details to send alerts
    const monitorList = await db.select().from(monitors).where(eq(monitors.id, monitorId)).limit(1);
    const monitor = monitorList[0];

    if (!monitor) return result;

    // 2. Incident Detection Logic
    const openIncidents = await db.select().from(incidents).where(
        and(
            eq(incidents.monitorId, monitorId),
            eq(incidents.status, 'open')
        )
    ).limit(1);
    const existingOpenIncident = openIncidents.length > 0 ? openIncidents[0] : null;

    if (shouldResolveIncident(result.isUp, !!existingOpenIncident) && existingOpenIncident) {
        await db.update(incidents)
            .set({ status: 'resolved', resolvedAt: new Date() })
            .where(eq(incidents.id, existingOpenIncident.id));

        console.log(`✅ INCIDENT RESOLVED for monitor ${monitorId}!`);
        
        if (existingOpenIncident.alertSent) {
            const settingsList = await db.select().from(userSettings).where(eq(userSettings.userId, monitor.userId)).limit(1);
            const settings = settingsList[0] || { alertCooldown: 15, emailAlertsEnabled: true, slackAlertsEnabled: true };
            
            if (settings.emailAlertsEnabled) await sendIncidentEmail(monitor.userId, monitor.name, monitor.url, 'resolved');
            if (settings.slackAlertsEnabled) await sendSlackAlert(monitor.name, monitor.url, 'resolved');
        }
    } else if (!result.isUp) {
        const recentChecks = await db.select()
            .from(checks)
            .where(eq(checks.monitorId, monitorId))
            .orderBy(desc(checks.timestamp))
            .limit(3);

        if (shouldOpenIncident(recentChecks, !!existingOpenIncident)) {
            const settingsList = await db.select().from(userSettings).where(eq(userSettings.userId, monitor.userId)).limit(1);
            const settings = settingsList[0] || { alertCooldown: 15, emailAlertsEnabled: true, slackAlertsEnabled: true };
            
            const lastIncidentList = await db.select()
                .from(incidents)
                .where(eq(incidents.monitorId, monitorId))
                .orderBy(desc(incidents.openedAt))
                .limit(1);
            
            const lastIncident = lastIncidentList[0];
            const sendAlert = shouldSendAlert(lastIncident, settings.alertCooldown);
            
            if (!sendAlert) {
                console.log(`⏳ THROTTLING: Skipping alert for monitor ${monitorId} (cooldown: ${settings.alertCooldown}m)`);
            }

            await db.insert(incidents).values({
                monitorId,
                status: 'open',
                alertSent: sendAlert,
            });
            console.log(`🚨 INCIDENT OPENED for monitor ${monitorId}!`);
            
            if (sendAlert) {
                if (settings.emailAlertsEnabled) await sendIncidentEmail(monitor.userId, monitor.name, monitor.url, 'open');
                if (settings.slackAlertsEnabled) await sendSlackAlert(monitor.name, monitor.url, 'open');
            }
        }
    }

    // 3. Data Retention Cleanup
    // Fetch the latest settings (or use a default)
    const settingsListForCleanup = await db.select().from(userSettings).where(eq(userSettings.userId, monitor.userId)).limit(1);
    const retentionDays = settingsListForCleanup.length > 0 ? settingsListForCleanup[0].dataRetentionDays : 30;

    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - retentionDays);

    await db.delete(checks).where(
        and(
            eq(checks.monitorId, monitorId),
            lt(checks.timestamp, retentionDate)
        )
    );

    return result;
}, { 
    connection,
    prefix: process.env.BULLMQ_PREFIX || 'bull'
});

monitorWorker.on('completed', (job) => {
    console.log(`[Job ${job.id}] Completed successfully`);
});

monitorWorker.on('failed', (job, err) => {
    console.log(`[Job ${job?.id}] Failed:`, err);
});

console.log('Worker is listening for jobs...');

// --- Queue Synchronization Loop ---
// Since Vercel cannot reach the private Fly.io Redis network, the worker is responsible
// for keeping its own queue in sync with the Postgres database.
import { upsertMonitorJob, removeMonitorJob, monitorQueue } from './queue';

async function syncQueue() {
    try {
        const allMonitors = await db.select().from(monitors);
        const monitorMap = new Map(allMonitors.map(m => [m.id, m]));
        
        const jobs = await monitorQueue.getJobSchedulers();
        const existingJobIds = new Set(jobs.map(j => j.id));
        
        // 1. Add or update all active monitors in the queue
        for (const m of allMonitors) {
            const schedulerId = `monitor-${m.id}`;
            const isNew = !existingJobIds.has(schedulerId);
            await upsertMonitorJob(m.id, m.url, m.interval, isNew);
        }

        // 2. Remove jobs for monitors that were deleted from the database
        const refreshedJobs = await monitorQueue.getJobSchedulers();
        for (const job of refreshedJobs) {
            if (!job.id) continue;
            const idStr = job.id.replace('monitor-', '');
            if (!monitorMap.has(Number(idStr))) {
                await removeMonitorJob(Number(idStr));
                console.log(`🗑️ Removed deleted monitor ${idStr} from queue`);
            }
        }
    } catch (err) {
        console.error('Error syncing queue:', err);
    }
}

// Run immediately on boot, then every 60 seconds
syncQueue();
setInterval(syncQueue, 60000);
