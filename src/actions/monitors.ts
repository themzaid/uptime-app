// src/actions/monitors.ts
'use server';

import { db } from '../db';
import { monitors } from '../db/schema';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';
import { upsertMonitorJob, removeMonitorJob } from '../worker/queue';

// Server Action to create a new monitor
export async function createMonitor(formData: FormData) {
    // 1. Ensure the user is logged in and grab their ID
    const { userId } = await auth.protect();

    // 2. Extract data from the incoming form submission
    const name = formData.get('name') as string;
    let url = formData.get('url') as string;
    const interval = parseInt(formData.get('interval') as string, 10);

    if (!name || !url || !interval) {
        throw new Error('Missing required fields');
    }

    // Auto-prepend https:// if the user didn't type a protocol
    if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
    }

    // 3. Insert the new record into the database and get its ID back
    const [newMonitor] = await db.insert(monitors).values({
        userId,
        name,
        url,
        interval,
    }).returning();

    // 4. Schedule the job in BullMQ
    await upsertMonitorJob(newMonitor.id, url, interval);

    // 5. Tell Next.js to refresh the dashboard data
    revalidatePath('/dashboard');
}

// Server Action to delete an existing monitor
export async function deleteMonitor(id: number) {
    // 1. Ensure the user is logged in
    const { userId } = await auth.protect();

    // 2. Delete the monitor
    await db.delete(monitors).where(
        and(
            eq(monitors.id, id),
            eq(monitors.userId, userId)
        )
    );

    // 3. Remove the job from the BullMQ schedule
    await removeMonitorJob(id);

    // 4. Tell Next.js to refresh the dashboard data
    revalidatePath('/dashboard');
}

// Server Action to update an existing monitor
export async function updateMonitor(id: number, data: { name: string, url: string, interval: number }) {
    const { userId } = await auth.protect();
    
    let url = data.url;
    if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
    }

    await db.update(monitors)
        .set({ name: data.name, url, interval: data.interval, updatedAt: new Date() })
        .where(
            and(
                eq(monitors.id, id),
                eq(monitors.userId, userId)
            )
        );

    // Update the BullMQ job with new settings (upsert will overwrite the old interval)
    await upsertMonitorJob(id, url, data.interval);

    revalidatePath('/dashboard');
}

// Server Action to update the order of monitors
export async function updateMonitorOrder(orderedIds: number[]) {
    const { userId } = await auth.protect();

    // Update each monitor's orderIndex
    for (let i = 0; i < orderedIds.length; i++) {
        await db.update(monitors)
            .set({ orderIndex: i })
            .where(
                and(
                    eq(monitors.id, orderedIds[i]),
                    eq(monitors.userId, userId)
                )
            );
    }
    revalidatePath('/dashboard');
}

