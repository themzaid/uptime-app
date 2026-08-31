/**
 * Global authentication setup.
 * Runs once before the test suite to authenticate and save session state.
 */
import { test as setup } from '@playwright/test';
import path from 'path';
import { clerkSetup } from '@clerk/testing/playwright';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup.beforeAll(async () => {
  await clerkSetup();
});

setup('authenticate', async ({ page }) => {
  // Hit our magic E2E backdoor route. 
  // It uses the Clerk Backend SDK to instantly generate a one-time valid session URL and redirects us there.
  await page.goto('/api/e2e/login');

  // Wait until we are redirected away from the API and Clerk's internal auth pages
  // (Meaning we successfully landed back inside our app!)
  await page.waitForLoadState('networkidle');

  // Save the authentication state (cookies, local storage) to a file
  await page.context().storageState({ path: authFile });
});
