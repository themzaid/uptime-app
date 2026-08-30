import { test, expect } from '@playwright/test';
import { setupClerkTestingToken, clerkSetup } from '@clerk/testing/playwright';

test.describe('E2E Monitor Flow', () => {
    test.beforeAll(async () => {
        await clerkSetup({ publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY });
    });

    test('creates a new monitor and verifies it appears on dashboard', async ({ page, request }) => {
        // 1. Fetch a secure backend ticket by passing the email from Playwright's env
        const email = encodeURIComponent(process.env.E2E_TEST_EMAIL!);
        const res = await request.get(`/api/e2e/login?email=${email}`);

        if (!res.ok()) {
            throw new Error(`Backend API failed: ${await res.text()}`);
        }
        const { ticket } = await res.json();

        // 2. Bypass frontend bot protection
        await setupClerkTestingToken({ page });

        // 3. Load the Clerk JS SDK on the public homepage to avoid unpredictable <SignIn /> component behavior
        await page.goto('/');
        await page.waitForFunction(() => (window as any).Clerk && (window as any).Clerk.client);
        
        // Wait for Next.js to fully hydrate. If we inject the session too fast, Next.js throws a hydration error!
        await page.waitForTimeout(1500);

        // 4. Consume the ticket programmatically! No UI, no OTP, no cross-origin redirects!
        await page.evaluate(async (t) => {
            const signIn = await (window as any).Clerk.client.signIn.create({
                strategy: 'ticket',
                ticket: t,
            });
            await (window as any).Clerk.setActive({ session: signIn.createdSessionId });
        }, ticket);

        // 5. We are instantly logged in! Give Clerk a split second to set the cookies, then navigate!
        await page.waitForTimeout(500);
        await page.goto('/dashboard');

        // 4. Wait for the button to appear on screen and then click it!
        const addMonitorBtn = page.getByRole('button', { name: '+ Add Monitor' });
        await addMonitorBtn.waitFor({ state: 'visible' });
        await addMonitorBtn.click();

        // Generate a unique name for this specific test run to avoid parallel worker collisions
        const uniqueMonitorName = `E2E Fake Monitor ${Date.now()}`;

        // 5. Fill out the form pointing to a URL that always returns a 500 error
        await page.getByLabel('Name').fill(uniqueMonitorName);
        await page.getByLabel('URL to Check').fill('httpstat.us/500');
        await page.getByLabel('Check Interval').selectOption('1');

        // 6. Submit (clicks the "Create Monitor" button inside the modal)
        await page.getByRole('button', { name: 'Create Monitor' }).click();

        // 7. Verify the modal closes
        await expect(page.getByRole('button', { name: 'Cancel' })).not.toBeVisible();

        // 8. Verify the new monitor was added to the DOM list
        await expect(page.getByText(uniqueMonitorName)).toBeVisible();
        await expect(page.getByText('httpstat.us/500').first()).toBeVisible();

        // 9. Clean up! Delete the monitor so we don't spam Slack/Email with downtime alerts
        // Find the specific card for this monitor by its card CSS class and click its delete button
        const monitorCard = page.locator('.bg-white.p-6.rounded-2xl').filter({ hasText: uniqueMonitorName });
        await monitorCard.getByRole('button', { name: 'Delete' }).click();

        // The beautiful new custom DOM modal will pop up. Click the confirmation button!
        await page.getByRole('button', { name: 'Yes, Delete' }).click();

        // 10. Verify it disappears from the dashboard
        await expect(page.getByText(uniqueMonitorName)).not.toBeVisible();
    });
});
