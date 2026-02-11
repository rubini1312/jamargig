import { Page, expect } from "@playwright/test";

export async function openFirstProject(page: Page): Promise<string> {

  // wait for ANY project card (not image)
  const card = page.locator('[data-testid^="project-list-card-"]').first();

  await expect(card).toBeVisible({ timeout: 60000 });

  const testId = await card.getAttribute("data-testid");
  if (!testId) throw new Error("Project card testid missing");

  const match = testId.match(/project-list-card-(\d+)/);
  if (!match) throw new Error(`Unexpected testid format: ${testId}`);

  const projectId = match[1];

  await Promise.all([
    page.waitForURL(new RegExp(`/projects/${projectId}`), { timeout: 60000 }),
    card.click()
  ]);

  return projectId;
}
