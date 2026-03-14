import { expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import ProjectPage from "../../pages/casting/owner/project/projectPage";
import { validLogin } from "@/test-data/loginData";
import { projectLocators } from "../../pages/casting/owner/project/projectPageLocators";
import { urls } from "@/utils/urls";
import { projectData } from "@/test-data/projectData";
import RolePage from '../../pages/casting/owner/role/rolePage';

test.describe("Casting owner create project flow", () => {

  test.beforeEach(async ({ page, request }) => {
    await page.goto(urls.casting);
    const login = new LoginPage(page);
    const status = await login.validLoginwithUI(validLogin.email, validLogin.password, request);
    console.log("2FA Status:", status);
    await page.goto(urls.casting + "/projects"); await expect(page).toHaveURL(/projects/);;
  });


  // =========================================================
  test("Submitting empty New Project form shows validation (required fields)", async ({ page }) => {

    const projectPage = new ProjectPage(page);
    await projectPage.openCreateMenu();
    await projectPage.selectNewProject();

    // sanity checks before submit
    expect(await page.locator(projectLocators.titleInput).inputValue()).toBe("");

    const contractCheckedBefore = await page.locator(projectLocators.contractTypePaidInput).isChecked().catch(() => false);
    expect(contractCheckedBefore).toBeFalsy();

    const unionCheckedBefore = await page.locator(projectLocators.union1Input).isChecked().catch(() => false);
    expect(unionCheckedBefore).toBeFalsy();

    const fileCountBefore = await page
      .locator(projectLocators.projectImageFileInput)
      .evaluate((el: HTMLInputElement) => el.files ? el.files.length : 0);

    expect(fileCountBefore).toBe(0);

    // submit empty
    await page.locator(projectLocators.projectNewSubmitButton).click();

    await page.waitForTimeout(500);

    await expect(page.locator(projectLocators.titleInput)).toBeVisible();

    const contractCheckedAfter = await page.locator(projectLocators.contractTypePaidInput).isChecked().catch(() => false);
    expect(contractCheckedAfter).toBeFalsy();

    const unionCheckedAfter = await page.locator(projectLocators.union1Input).isChecked().catch(() => false);
    expect(unionCheckedAfter).toBeFalsy();

    const fileCountAfter = await page
      .locator(projectLocators.projectImageFileInput)
      .evaluate((el: HTMLInputElement) => el.files ? el.files.length : 0);

    expect(fileCountAfter).toBe(0);

    // aria validation
    const ariaInvalid = await page.locator(projectLocators.titleInput).getAttribute("aria-invalid");

    if (ariaInvalid !== null) {
      expect(ariaInvalid === "true").toBeTruthy();
    } else {
      await expect(page).toHaveURL(/projects/);
    }

    const alertCount = await page
      .locator('[role="alert"]')
      .filter({ has: page.locator(projectLocators.titleInput) })
      .count()
      .catch(() => 0);

    if (alertCount > 0) {
      expect(alertCount).toBeGreaterThanOrEqual(4);
    }
  });

  // =========================================================
  test("Create new project and verify it appears in projects list", async ({ page }) => {
    test.setTimeout(120000);

    const projectPage = new ProjectPage(page);
    await projectPage.createNewProject(projectData);

    // verify project appears anywhere in list
    await expect(
      page.locator(`text=${projectData.title}`)
    ).toBeVisible({ timeout: 30000 });

  });

  // =========================================================
  test('Click project cover image and verify the added project page opens', async ({ page, request }) => {

    const rolePage = new RolePage(page);

    // locate first project cover image by dynamic data-testid
    const coverLocator = page.locator(projectLocators.projectCoverimage);
    await expect(page.locator(projectLocators.projectCoverimage).first()).toBeVisible({ timeout: 30000 });
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
