import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMonitor, deleteMonitor, updateMonitorOrder } from './monitors';
import { db } from '../db';
import { monitors } from '../db/schema';
import { eq } from 'drizzle-orm';
import { upsertMonitorJob, removeMonitorJob } from '../worker/queue';

// Mock Next.js dependencies
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));
vi.mock('server-only', () => ({}));

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
    auth: {
        protect: vi.fn().mockResolvedValue({ userId: 'test_user_123' }),
    },
}));

// Mock BullMQ queue
vi.mock('../worker/queue', () => ({
    upsertMonitorJob: vi.fn(),
    removeMonitorJob: vi.fn(),
}));

describe('Monitors CRUD Integration Tests', () => {
    beforeEach(async () => {
        // Clear test user's data before each test
        await db.delete(monitors).where(eq(monitors.userId, 'test_user_123'));
        vi.clearAllMocks();
    });

    it('creates a new monitor and schedules a job', async () => {
        const formData = new FormData();
        formData.append('name', 'Test Monitor');
        formData.append('url', 'example.com');
        formData.append('interval', '5');

        await createMonitor(formData);

        const saved = await db.select().from(monitors).where(eq(monitors.userId, 'test_user_123'));
        expect(saved.length).toBe(1);
        expect(saved[0].name).toBe('Test Monitor');
        expect(saved[0].url).toBe('https://example.com'); // testing http auto-prepend
        expect(saved[0].interval).toBe(5);

    });

    it('deletes an existing monitor and removes the job', async () => {
        // Seed database
        const [inserted] = await db.insert(monitors).values({
            userId: 'test_user_123',
            name: 'Delete Me',
            url: 'https://deleteme.com',
            interval: 5,
        }).returning();

        await deleteMonitor(inserted.id);

        const remaining = await db.select().from(monitors).where(eq(monitors.id, inserted.id));
        expect(remaining.length).toBe(0);

    });

    it('updates monitor order correctly', async () => {
        // Seed multiple monitors
        const [m1] = await db.insert(monitors).values({
            userId: 'test_user_123', name: 'First', url: 'https://1.com', interval: 5
        }).returning();

        const [m2] = await db.insert(monitors).values({
            userId: 'test_user_123', name: 'Second', url: 'https://2.com', interval: 5
        }).returning();

        await updateMonitorOrder([m2.id, m1.id]);

        const updatedM1 = await db.select().from(monitors).where(eq(monitors.id, m1.id));
        const updatedM2 = await db.select().from(monitors).where(eq(monitors.id, m2.id));

        expect(updatedM1[0].orderIndex).toBe(1); // was moved to second
        expect(updatedM2[0].orderIndex).toBe(0); // was moved to first
    });
});
