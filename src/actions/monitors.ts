'use server';

import { db } from '../db';
import { monitors } from '../db/schema';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';

// Server Action to create a new monitor
export async function createMonitor(formData: FormData) {
    // 1. Ensure the user is logged in and grab their ID
    const { userId } = await auth.protect();

    // 2. Extract data from the incoming form submission
    const name = formData.get('name') as string;
    const url = formData.get('url') as string;
    const interval = parseInt(formData.get('interval') as string, 10);

    if (!name || !url || !interval) {
        throw new Error('Missing required fields');
    }

    // 3. Insert the new record into the database
    await db.insert(monitors).values({
        userId,
        name,
        url,
        interval,
    });

    // 4. Tell Next.js to refresh the dashboard data
    revalidatePath('/dashboard');
}

// Server Action to delete an existing monitor
export async function deleteMonitor(id: number) {
    // 1. Ensure the user is logged in
    const { userId } = await auth.protect();

    // 2. Delete the monitor. We use `and()` to make sure we only delete 
    //    it if the ID matches AND it belongs to the currently logged-in user.
    await db.delete(monitors).where(
        and(
            eq(monitors.id, id),
            eq(monitors.userId, userId)
        )
    );

    // 3. Tell Next.js to refresh the dashboard data
    revalidatePath('/dashboard');
}
