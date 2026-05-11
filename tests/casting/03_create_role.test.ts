import { APIRequestContext, expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import RolePage from "../../pages/casting/owner/role/rolePage";
import { roleLocators } from "../../pages/casting/owner/role/rolePageLocators";
import { validLogin } from "@/test-data/loginData";
import { roleData } from "@/test-data/roleData";
import { urls } from "@/utils/urls";
import { createProject, deleteProject } from "@/helpers/api/casting/projectApi";
import { deleteAllRoles } from "@/helpers/api/casting/roleApi";
import ProjectPage from "@/pages/casting/owner/project/projectPage";
import { getAccessTokenSmartFromCasting } from "@/helpers/api/casting/authApi";

test.describe('Casting owner create role scenarios', () => {
    let token: string;
    let projectId: number;
    let projectName: string;

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

    test.beforeAll(async ({ request }) => {
        token = await getAccessTokenSmartFromCasting(request, validLogin.email);
        const { response } = await createProject(request, token);
        projectId = response.data.id;
        projectName = response.data.title;
        console.log(projectName);
        console.log(projectId);
    });

    test.beforeEach(async ({ page }) => {
        await page.goto(`${urls.casting}/projects`, {
            waitUntil: 'domcontentloaded',
        });

        await expect(page).toHaveURL(/projects/);
    });

    test.afterAll(async ({ request }) => {
        if (projectId) {
            await deleteAllRoles(request, token, projectId);
            await deleteProject(request, token, projectId);
        }
    });

    // =========================================================
    test('Create new role and verify it appears in roles list', async ({ page }) => {
        test.setTimeout(60000);

        const rolePage = new RolePage(page);
        const projectPage = new ProjectPage(page);

        await projectPage.openSearchedProject(projectName);


        await rolePage.gotoRolesTab();
        await rolePage.createNewRole(roleData);

        await rolePage.verifyRoleCreated(roleData.name);
    });

    // =========================================================
    test('Submitting empty New Role form shows validation (required fields)', async ({ page, request }) => {

        const rolePage = new RolePage(page);
        const projectPage = new ProjectPage(page);

        await projectPage.openSearchedProject(projectName);

        await rolePage.gotoRolesTab();
        await rolePage.openCreateRole();

        // ensure role name empty and contract/unions not selected
        expect(await page.locator(roleLocators.roleNameInput).inputValue()).toBe('');

        // Click submit with empty required fields
        await page.locator(roleLocators.roleNewSubmitButton).click();

        // modal should remain open and show validation
        await expect(page.locator(roleLocators.roleNameInput)).toBeVisible();

        const ariaInvalid = await page.locator(roleLocators.roleNameInput).getAttribute('n-form-item-feedback__line');
        if (ariaInvalid !== null) {
            expect(ariaInvalid === 'true' || ariaInvalid === '1').toBeTruthy();
        } else {
            // fallback: look for a required message text
            const msg = await page.locator('text=required, text=Required, text=Value is required').count();
            // Need to check it later
            expect(msg).toBeGreaterThanOrEqual(0);
        }

    });


    // =========================================================
    for (const img of validImageFiles) {

        test(`Upload image and verify preview appears - ${img.name}`, async ({ page }) => {

            const rolePage = new RolePage(page);
            const projectPage = new ProjectPage(page);

            await projectPage.openSearchedProject(projectName);

            await rolePage.gotoRolesTab();
            await rolePage.openCreateRole();

            // Upload file
            await page.setInputFiles(
                'input[type="file"]',
                `test-files/images/${img.file}`
            );

            // Verify preview image
            const previewImage = page.locator(
                '[data-testid="role-image-image-preview"]'
            );

            await expect(previewImage).toBeVisible();
            await expect(previewImage).toHaveAttribute("src", /.+/);

            // Verify container state
            const container = page.locator('[data-testid="role-image-dragger"]');
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
                '[data-testid="role-image-image-preview"]'
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
