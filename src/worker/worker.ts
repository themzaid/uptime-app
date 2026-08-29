// src/worker/worker.ts
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { ping } from './ping';
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
    if (result.isUp) {
        const openIncidents = await db.select().from(incidents).where(
            and(
                eq(incidents.monitorId, monitorId),
                eq(incidents.status, 'open')
            )
        ).limit(1);

        if (openIncidents.length > 0) {
            const incident = openIncidents[0];
            await db.update(incidents)
                .set({ status: 'resolved', resolvedAt: new Date() })
                .where(eq(incidents.id, incident.id));

            console.log(`✅ INCIDENT RESOLVED for monitor ${monitorId}!`);
            
            if (incident.alertSent) {
                const settingsList = await db.select().from(userSettings).where(eq(userSettings.userId, monitor.userId)).limit(1);
                const settings = settingsList[0] || { alertCooldown: 15, emailAlertsEnabled: true, slackAlertsEnabled: true };
                
                if (settings.emailAlertsEnabled) await sendIncidentEmail(monitor.userId, monitor.name, monitor.url, 'resolved');
                if (settings.slackAlertsEnabled) await sendSlackAlert(monitor.name, monitor.url, 'resolved');
            }
        }
    } else {
        const recentChecks = await db.select()
            .from(checks)
            .where(eq(checks.monitorId, monitorId))
            .orderBy(desc(checks.timestamp))
            .limit(3);

        const allFailed = recentChecks.length === 3 && recentChecks.every(
            c => c.statusCode === 0 || (c.statusCode !== null && c.statusCode >= 400)
        );

        if (allFailed) {
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
                // Fetch user settings and the most recent incident to check cooldown
                const settingsList = await db.select().from(userSettings).where(eq(userSettings.userId, monitor.userId)).limit(1);
                const settings = settingsList[0] || { alertCooldown: 15, emailAlertsEnabled: true, slackAlertsEnabled: true };
                
                const lastIncidentList = await db.select()
                    .from(incidents)
                    .where(eq(incidents.monitorId, monitorId))
                    .orderBy(desc(incidents.openedAt))
                    .limit(1);
                
                const lastIncident = lastIncidentList[0];
                let shouldSendAlert = true;
                
                if (lastIncident && lastIncident.alertSent) {
                    const minutesSinceLastAlert = (Date.now() - new Date(lastIncident.openedAt).getTime()) / (1000 * 60);
                    if (minutesSinceLastAlert < settings.alertCooldown) {
                        shouldSendAlert = false;
                        console.log(`⏳ THROTTLING: Skipping alert for monitor ${monitorId} (cooldown: ${settings.alertCooldown}m)`);
                    }
                }

                await db.insert(incidents).values({
                    monitorId,
                    status: 'open',
                    alertSent: shouldSendAlert,
                });
                console.log(`🚨 INCIDENT OPENED for monitor ${monitorId}!`);
                
                if (shouldSendAlert) {
                    if (settings.emailAlertsEnabled) await sendIncidentEmail(monitor.userId, monitor.name, monitor.url, 'open');
                    if (settings.slackAlertsEnabled) await sendSlackAlert(monitor.name, monitor.url, 'open');
                }
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
