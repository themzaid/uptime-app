// src/worker/worker.ts
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { ping } from './ping';
import { shouldResolveIncident, shouldOpenIncident, shouldSendAlert } from './incident-logic';
import { db } from '../db';
import { checks, incidents, monitors, userSettings } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
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

    return result;
}, { connection });

monitorWorker.on('completed', (job) => {
    console.log(`[Job ${job.id}] Completed successfully`);
});

monitorWorker.on('failed', (job, err) => {
    console.log(`[Job ${job?.id}] Failed:`, err);
});

console.log('Worker is listening for jobs...');
