import { Page, expect } from '@playwright/test';

export async function openFirstProject(page: Page): Promise<string> {
  const cover = page
    .locator('[data-testid^="project-list-card-"][data-testid$="-cover-image"]')
    .first();

  await expect(cover).toBeVisible();

  const testId = await cover.getAttribute('data-testid');
  if (!testId) {
    throw new Error('data-testid not found on project cover image');
  }

  const match = testId.match(/project-list-card-(\d+)-cover-image/);
  if (!match) {
    throw new Error(`Unexpected data-testid format: ${testId}`);
  }

  // Click and wait for navigation to complete so callers operate on a stable page
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {}),
    cover.click()
  ]);

  return match[1];
}
