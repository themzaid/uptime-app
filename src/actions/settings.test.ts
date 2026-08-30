import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserSettings, updateUserSettings } from './settings';
import { db } from '../db';
import { userSettings } from '../db/schema';
import { eq } from 'drizzle-orm';

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
    auth: {
        protect: vi.fn().mockResolvedValue({ userId: 'test_user_123' }),
    },
}));

describe('Settings CRUD Integration Tests', () => {
    beforeEach(async () => {
        // Clear test user's data
        await db.delete(userSettings).where(eq(userSettings.userId, 'test_user_123'));
        vi.clearAllMocks();
    });

    it('returns default settings when none exist in DB', async () => {
        const settings = await getUserSettings();
        expect(settings).toEqual({
            alertCooldown: 15,
            emailAlertsEnabled: true,
            slackAlertsEnabled: true,
        });
    });

    it('creates new settings on first update', async () => {
        await updateUserSettings({
            alertCooldown: 30,
            emailAlertsEnabled: false,
            slackAlertsEnabled: true,
        });

        const saved = await db.select().from(userSettings).where(eq(userSettings.userId, 'test_user_123'));
        expect(saved.length).toBe(1);
        expect(saved[0].alertCooldown).toBe(30);
        expect(saved[0].emailAlertsEnabled).toBe(false);
    });

    it('updates existing settings', async () => {
        // First update creates
        await updateUserSettings({
            alertCooldown: 30,
            emailAlertsEnabled: false,
            slackAlertsEnabled: true,
        });

        // Second update edits
        await updateUserSettings({
            alertCooldown: 60,
            emailAlertsEnabled: true,
            slackAlertsEnabled: false,
        });

        const saved = await db.select().from(userSettings).where(eq(userSettings.userId, 'test_user_123'));
        expect(saved.length).toBe(1);
        expect(saved[0].alertCooldown).toBe(60);
        expect(saved[0].emailAlertsEnabled).toBe(true);
        expect(saved[0].slackAlertsEnabled).toBe(false);
    });
});
