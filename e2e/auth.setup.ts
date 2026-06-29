import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/admin.json');

setup('authenticate as admin', async ({ page }) => {
  // Navigate to login
  await page.goto('/login');
  
  // Rely on semantic selectors
  await page.getByPlaceholder('Email address').fill('admin@mithilaenterprise.com');
  await page.getByPlaceholder('Password').fill('AdminPassword123!');
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  // Wait until the dashboard navigation completes
  await page.waitForURL('**/admin/dashboard');
  
  // Explicit assertion to confirm successful login
  await expect(page.getByRole('heading', { name: /dashboard|overview/i })).toBeVisible();

  // Save the authenticated state (cookies, local storage)
  await page.context().storageState({ path: authFile });
});
