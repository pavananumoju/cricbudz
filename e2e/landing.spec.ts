import { test, expect } from '@playwright/test';

test('landing page shows the Google sign-in CTA', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
});
