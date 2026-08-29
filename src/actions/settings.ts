'use server';

import { db } from '../db';
import { userSettings } from '../db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getUserSettings() {
    const { userId } = await auth.protect();
    const settings = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

    if (settings.length === 0) {
        return {
            alertCooldown: 15, // Industry standard default
            emailAlertsEnabled: true,
            slackAlertsEnabled: true,
        };
    }
    return settings[0];
}

export async function updateUserSettings(data: {
    alertCooldown: number;
    emailAlertsEnabled: boolean;
    slackAlertsEnabled: boolean;
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
