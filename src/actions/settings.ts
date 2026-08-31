'use server';

import { db } from '../db';
import { userSettings, monitors } from '../db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getUserSettings() {
    const { userId } = await auth.protect();
    
    // Fetch monitors to calculate usage limits
    const userMonitors = await db.select().from(monitors).where(eq(monitors.userId, userId));
    
    let checksPerDay = 0;
    for (const monitor of userMonitors) {
        checksPerDay += Math.ceil((24 * 60) / monitor.interval);
    }

    const settingsList = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

    const baseSettings = settingsList.length === 0 ? {
        alertCooldown: 15,
        emailAlertsEnabled: true,
        slackAlertsEnabled: true,
        dataRetentionDays: 30,
    } : settingsList[0];

    return {
        ...baseSettings,
        stats: {
            monitorsCount: userMonitors.length,
            checksPerDay,
        }
    };
}

export async function updateUserSettings(data: {
    alertCooldown: number;
    emailAlertsEnabled: boolean;
    slackAlertsEnabled: boolean;
    dataRetentionDays: number;
}) {
    const { userId } = await auth.protect();

    const existing = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

    if (existing.length === 0) {
        await db.insert(userSettings).values({
            userId,
            ...data,
        });
    } else {
        await db.update(userSettings)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(userSettings.userId, userId));
    }

    revalidatePath('/dashboard/settings');
}
