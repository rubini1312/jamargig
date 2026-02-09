import { expect, test } from '@playwright/test';
import LoginPage from '../../pages/casting/owner/login/loginPage';
import RolePage from '../../pages/casting/owner/role/rolePage';
import * as data from '../../test-data/test-data.json';


test.describe('Open project from projects list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('Click project cover image (dynamic data-testid) and verify project page opens', async ({ page }) => {
    const login = new LoginPage(page);
    await login.validLogin(data.email, data.password);
    await expect(page).toHaveURL('/projects');

    const rolePage = new RolePage(page);

    // locate first project cover image by dynamic data-testid
    const coverLocator = page.locator('[data-testid^="project-list-card-"][data-testid$="-cover-image"]');
    await coverLocator.first().waitFor({ state: 'visible', timeout: 5000 });
    const first = coverLocator.first();
    const dataTestId = await first.getAttribute('data-testid');
    expect(dataTestId).toBeTruthy();

    const m = dataTestId!.match(/project-list-card-(\d+)-cover-image/);
    expect(m).not.toBeNull();
    const projectId = m![1];

    // try opening in a new tab, fallback to same-tab navigation if needed
    let targetPage = null as any;
    try {
      targetPage = await rolePage.openProjectInNewTab(projectId, new RegExp(`/projects/${projectId}`), 10000);
    } catch (err) {
      // fallback: some apps navigate in same tab
      await rolePage.openProjectById(projectId, { waitForUrl: new RegExp(`/projects/${projectId}`), timeout: 10000 });
      targetPage = page;
    }

    await targetPage.waitForLoadState('domcontentloaded');
    const url = targetPage.url();
    expect(url).toMatch(new RegExp(`/projects/${projectId}`));
  });
});
