import { expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import ProjectPage from "../../pages/casting/owner/project/projectPage";
import { validLogin } from "@/test-data/loginData";
import { projectLocators } from "../../pages/casting/owner/project/projectPageLocators";
import { urls } from "@/utils/urls";
import { projectData } from "@/test-data/projectData";
import RolePage from '../../pages/casting/owner/role/rolePage';
import { getAccessTokenSmartFromCasting } from "@/helpers/api/casting/authApi";
import { createProject } from "@/helpers/api/casting/projectApi";

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

    const titleInput = page.locator(projectLocators.titleInput);
    const contractCheckbox = page.locator(projectLocators.contractTypePaidInput);
    const unionCheckbox = page.locator(projectLocators.union1Input);
    const fileInput = page.locator(projectLocators.projectImageFileInput);
    const submitBtn = page.locator(projectLocators.projectNewSubmitButton);

    // Initial state checks
    await expect(titleInput).toHaveValue("");

    await expect(contractCheckbox).not.toBeChecked();
    await expect(unionCheckbox).not.toBeChecked();

    const fileCountBefore = await fileInput.evaluate((el: HTMLInputElement) => el.files?.length ?? 0);
    expect(fileCountBefore).toBe(0);

    await submitBtn.click();

    const errors = page.locator('.n-form-item-feedback__line');

    await expect(errors).toHaveCount(4);

    const texts = await errors.allTextContents();

    expect(texts.filter(t => t === "Value is required").length).toBe(3);
    expect(texts).toContain("Project image is required");

  });

  // =========================================================
  test("Create new project and verify it appears in projects list", async ({ page }) => {
    test.setTimeout(120000);

    const projectPage = new ProjectPage(page);
    await projectPage.createNewProject(projectData);
    await expect(page.locator(`text=${projectData.title}`)).toBeVisible();
    await expect(page).toHaveURL(/\/projects\/\d+/);

  });

  // =========================================================
  test('Click project cover image and verify the added project page opens', async ({ page, request }) => {

    const projectPage = new ProjectPage(page);

    const coverLocator = page.locator(projectLocators.projectCoverimage);
    await expect(coverLocator.first()).toBeVisible({ timeout: 30000 });
    const first = coverLocator.first();

    await expect(first).toHaveAttribute('data-testid', /project-list-card-/);
    const dataTestId = await first.getAttribute('data-testid');
    expect(dataTestId).toBeTruthy();

    const match = dataTestId!.match(/project-list-card-(\d+)-cover-image/);
    expect(match).not.toBeNull();

    const token = await getAccessTokenSmartFromCasting(request, validLogin.email);
    const { response } = await createProject(request, token);
    const id = response.data.id;
    const projectName = response.data.title;
    console.log(projectName);
    console.log(id);

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(async () => {
      await projectPage.openSearchedProject(projectName);

      const projectTitle = page.locator(
        `[data-testid="project-list-card-${id}-title"]`
      );

      await expect(projectTitle).toBeVisible();
      await projectTitle.click();

    }).toPass({ timeout: 15000 });

    await expect(page).toHaveURL(new RegExp(`/projects/${id}`));
    await expect(page.locator(`text=${projectData.title}`)).toBeVisible();

  });

});
