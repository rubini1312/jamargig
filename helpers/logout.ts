import { Page, expect } from '@playwright/test';

export async function logout(page: Page): Promise<void> {
  // Click on user avatar to open dropdown
  const profile = page.locator('.profile-button');
  await expect(profile).toBeVisible();
  await profile.click();

  // Click on logout button
  const logoutButton = page.getByRole('button', { name: 'Logout' })
  await expect(logoutButton).toBeVisible();
  await logoutButton.click();
  await page.waitForLoadState('domcontentloaded');

  // Verify redirection to login page
  await expect(page).toHaveURL(/\/login/);
}