import { test, expect } from '@playwright/test';

test.describe('Authentication Wall', () => {
    test('redirects unauthenticated users to the sign-in page', async ({ page }) => {
        // Attempt to go directly to the protected dashboard
        await page.goto('/dashboard');

        // Wait for the URL to change (Next.js/Clerk will redirect)
        await page.waitForURL('**/sign-in**');

        // Verify the URL now contains 'sign-in'
        expect(page.url()).toContain('sign-in');
    });
});
