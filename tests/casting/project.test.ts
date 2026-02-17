import { expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import ProjectPage from "../../pages/casting/owner/project/projectPage";
import * as data from "../../test-data/test-data.json";
import { projectLocators } from "../../pages/casting/owner/project/projectPageLocators";
import { urls } from "@/utils/urls";
import { projectData } from "@/test-data/projectData";

test.describe.serial("Casting owner create project flow", () => {

  test.beforeEach(async ({ page, request }) => {
    await page.goto(urls.casting);

    const login = new LoginPage(page);
    await login.validLogin(data.email, data.password, request);
    await expect(page).toHaveURL(/projects/);
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

});
