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

  const validImageFiles = [
    { name: "jpg", file: "test-role.jpg" },
    { name: "png", file: "test-pngFile.png" },
    { name: "gif", file: "test-gifFile.gif" },
    { name: "webp", file: "test-webpFile.webp" },
  ];

  const inValidFiles = [
    { name: "ico", path: "test-files/images/test-icoFile.ico" },
    { name: "svg", path: "test-files/images/test-svgFile.svg" },
    { name: "tiff", path: "test-files/images/test-tiffFile.tiff" },
    { name: "mp3", path: "test-files/audioes/file_example_MP3_700KB.mp3" },
    { name: "mp4", path: "test-files/videos/file_example_MP4_1920_18MG.mp4" },
    { name: "pdf", path: "test-files/pdfs/file-sample_150kB.pdf" },

  ];


  test.beforeEach(async ({ page, request}) => {
    
    const loginPage = new LoginPage(page);
    const twoFaStatus = await loginPage.validLoginwithUI(
      validLogin.email,
      validLogin.password,
      request
    );
    console.log(`2FA status detected: ${twoFaStatus}`);
    
    await page.goto(`${urls.casting}/projects`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page).toHaveURL(/projects/);
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

    await projectPage.openSearchedProject(projectName);

    const projectTitle = page.locator(
      `[data-testid="project-list-card-${id}-title"]`
    );

    await expect(page).toHaveURL(new RegExp(`/projects/${id}`));

    await expect(page.getByText(projectName)).toBeVisible();

    await expect(page).toHaveURL(new RegExp(`/projects/${id}`));
    await expect(page.locator(`text=${projectData.title}`)).toBeVisible();

  });

  // =========================================================
  for (const img of validImageFiles) {

    test(`Upload image and verify preview appears - ${img.name}`, async ({ page }) => {

      const projectPage = new ProjectPage(page);
      await projectPage.openCreateMenu();
      await projectPage.selectNewProject();

      // Upload file
      await page.setInputFiles(
        'input[type="file"]',
        `test-files/images/${img.file}`
      );

      // Preview image
      const previewImage = page.locator(
        '[data-testid="project-image-image-preview"]'
      );

      await expect(previewImage).toBeVisible();
      await expect(previewImage).toHaveAttribute("src", /.+/);

      //s Container state
      const container = page.locator('[data-testid="project-image-dragger"]');
      await expect(container).toHaveClass(/has-preview/);
    });
  }

  // =========================================================
  for (const file of inValidFiles) {

    test(`Upload invalid file - ${file.name} and verify preview NOT shown`, async ({ page }) => {

      const projectPage = new ProjectPage(page);
      await projectPage.openCreateMenu();
      await projectPage.selectNewProject();

      // Upload invalid file
      await page.setInputFiles('input[type="file"]', file.path);

      const previewImage = page.locator(
        '[data-testid="project-image-image-preview"]'
      );

      // Preview should NOT appear
      await expect(previewImage).toHaveCount(0);

      // Container should NOT have preview state
      const container = page.locator('[data-testid="project-image-dragger"]');
      await expect(container).not.toHaveClass(/has-preview/);

      const errorMsg = page.locator("text=Invalid file");
      if (await errorMsg.isVisible()) {
        await expect(errorMsg).toBeVisible();
      }

    });
  }

});
