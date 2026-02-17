import { expect, request, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import ProjectPage from "../../pages/casting/owner/project/projectPage";
import * as data from "../../test-data/test-data.json";
import { projectLocators } from "../../pages/casting/owner/project/projectPageLocators";
import { urls } from "@/utils/urls";

test.describe.serial("Casting owner create project flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(urls.casting);
  });

  test("Create new project and verify it appears in projects list", async ({ page, request }) => {
    test.setTimeout(120000);
    const login = new LoginPage(page);
    await login.validLogin(data.email, data.password, request);
    await expect(page).toHaveURL(/projects/);

    const projectPage = new ProjectPage(page);
    const projectName = `Auto Project name ${Date.now()}`;
    const payload = {
      title: projectName,
      productionCompany: "Launchpad6",
      location: "Remote",
      url: "https://example.com",
      email: "test@example.com",
      phone: "+94 76 899 6899",
      contractFrom: "26 Dec 2025",
      contractTo: "31 Jan 2026",
      rehearsalFrom: "01 Nov 2025",
      rehearsalTo: "10 Nov 2025",
      contractTypeIndex: 1,
      unionIndex: 1,
      productionTypeTestId: "production-type-1",
      // optional: adjust path to an actual fixture file in your workspace
      imagePath: "test-files/images/test-project.jpg",
      descriptionHtml: "Automated test project descriptions",
      personnelHtml: "Personnel information",
      additionalHtml: "Additional information",
      otherHtml: "Other information",
      acceptTerms: true,
      termsUrl: "https://jamargig.com/terms-and-conditions/"
    };

    await projectPage.createNewProject(payload);
    const created = await projectPage.isProjectPresent(projectName);
    expect(created).toBeTruthy();
  });

  test("Submitting empty New Project form shows validation (required fields)", async ({ page, request }) => {
    // login
    const login = new LoginPage(page);
    await login.validLogin(data.email, data.password, request);
    await expect(page).toHaveURL(/projects/);

    // open New Project modal
    const projectPage = new ProjectPage(page);
    await projectPage.openCreateMenu();
    await projectPage.selectNewProject();

    // sanity checks before submit: fields empty / unchecked
    expect(await page.locator(projectLocators.titleInput).inputValue()).toBe("");
    const contractCheckedBefore = await page.locator(projectLocators.contractTypePaidInput).isChecked().catch(() => false);
    expect(contractCheckedBefore).toBeFalsy();
    const unionCheckedBefore = await page.locator(projectLocators.union1Input).isChecked().catch(() => false);
    expect(unionCheckedBefore).toBeFalsy();

    // ensure no file selected for project image
    const fileCountBefore = await page.locator(projectLocators.projectImageFileInput).evaluate((el: HTMLInputElement) => el.files ? el.files.length : 0);
    expect(fileCountBefore).toBe(0);

    // Click submit with empty required fields
    await page.locator(projectLocators.projectNewSubmitButton).click();

    // short wait for validations to show / modal to react
    await page.waitForTimeout(500);

    // The modal should remain open (title input visible) because required fields were not provided
    await expect(page.locator(projectLocators.titleInput)).toBeVisible();

    // Required radios should still be unchecked
    const contractCheckedAfter = await page.locator(projectLocators.contractTypePaidInput).isChecked().catch(() => false);
    expect(contractCheckedAfter).toBeFalsy();

    const unionCheckedAfter = await page.locator(projectLocators.union1Input).isChecked().catch(() => false);
    expect(unionCheckedAfter).toBeFalsy();

    // Project image input should still have zero files
    const fileCountAfter = await page.locator(projectLocators.projectImageFileInput).evaluate((el: HTMLInputElement) => el.files ? el.files.length : 0);
    expect(fileCountAfter).toBe(0);

    // Try to detect some validation signals:
    // - check aria-invalid on title input (if the app sets it)
    const ariaInvalid = await page.locator(projectLocators.titleInput).getAttribute("aria-invalid");
    if (ariaInvalid !== null) {
      expect(ariaInvalid === "true" || ariaInvalid === "true").toBeTruthy();
    } else {
      // fallback: ensure we did not navigate away (still on projects) and modal is visible
      await expect(page).toHaveURL(/projects/);
    }

    // Optionally look for visible alert or feedback inside modal
    const alertCount = await page.locator('[role="alert"]').filter({ has: page.locator(projectLocators.titleInput) }).count().catch(() => 0);
    // If such alerts exist, at least one is expected in robust validation UI
    if (alertCount > 0) {
      expect(alertCount).toBeGreaterThanOrEqual(4);
    }
  });
});