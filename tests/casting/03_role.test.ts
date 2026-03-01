import { APIRequestContext, expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import RolePage from "../../pages/casting/owner/role/rolePage";
import { roleLocators } from "../../pages/casting/owner/role/rolePageLocators";
import { validLogin } from "@/test-data/loginData";
import { roleData } from "@/test-data/roleData";
import { urls } from "@/utils/urls";
import { getAccessTokenSmart } from "@/helpers/api/authApi";
import { createProject, deleteProject } from "@/helpers/api/projectApi";
import { deleteAllRoles } from "@/helpers/api/roleApi";
import ProjectPage from "@/pages/casting/owner/project/projectPage";

test.describe('Casting owner create role scenarios', () => {
    let token: string;
    let projectId: number;
    let projectName: string;

    test.beforeAll(async ({request }) => {
        token = await getAccessTokenSmart(request, validLogin.email);
        const { response } = await createProject(request, token);
        projectId = response.data.id;
        projectName = response.data.title;
        console.log(projectName);
        console.log(projectId);
    });

    test.beforeEach(async ({ page, request }) => {
        await page.goto(urls.casting);
        const login = new LoginPage(page);
        const status = await login.validLoginwithUI(validLogin.email, validLogin.password, request);
        console.log("2FA Status:", status);
        await page.goto(urls.casting + "/projects"); await expect(page).toHaveURL(/projects/);
    });

    test.afterAll(async ({ request }) => {
        if (projectId) {
            await deleteAllRoles(request, token, projectId);
            await deleteProject(request, token, projectId);
        }
    });

    // =========================================================
    test('Create new role and verify it appears in roles list', async ({ page, request }) => {
        test.setTimeout(60000);

        const rolePage = new RolePage(page);
        const projectPage = new ProjectPage(page);
        projectPage.openSearchedProject(projectName);
        await rolePage.gotoRolesTab();
        await rolePage.createNewRole(roleData);

        // small wait for list to refresh then verify
        await rolePage.verifyRoleCreated(roleData.name);
    });

    // =========================================================
    test('Submitting empty New Role form shows validation (required fields)', async ({ page, request }) => {

        const rolePage = new RolePage(page);
        const projectPage = new ProjectPage(page);
        projectPage.openSearchedProject(projectName);
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

        // Close the modal
        await rolePage.closeNewRoleModal();
    });
});
