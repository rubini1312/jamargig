import { APIRequestContext, expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import RolePage from "../../pages/casting/owner/role/rolePage";
import { roleLocators } from "../../pages/casting/owner/role/rolePageLocators";
import { validLogin } from "@/test-data/loginData";
import { roleData } from "@/test-data/roleData";
import { urls } from "@/utils/urls";
import { createProject, deleteProject } from "@/helpers/api/casting/projectApi";
import { createRole, deleteAllRoles, getProjectRoles } from "@/helpers/api/casting/roleApi";
import ProjectPage from "@/pages/casting/owner/project/projectPage";
import { getAccessTokenSmartFromCasting } from "@/helpers/api/casting/authApi";

test.describe('Casting owner project material scenarios', () => {
    let token: string;
    let projectId: number;
    let projectName: string;


    test.beforeAll(async ({ request }) => {
        token = await getAccessTokenSmartFromCasting(request, validLogin.email);
        const { response } = await createProject(request, token);
        projectId = response.data.id;
        projectName = response.data.title;
        console.log(projectName);
        console.log(projectId);
    });

    test.beforeEach(async ({ page, request }) => {
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

    test.afterAll(async ({ request }) => {
        if (projectId) {
            await deleteAllRoles(request, token, projectId);
            await deleteProject(request, token, projectId);
        }
    });

    // =========================================================
    test('should upload project material and display it in the list', async ({ page, request }) => {
        test.setTimeout(90000);

        const { response } = await createProject(request, token);
        const projectId = response.data.id;
        const projectName = response.data.title;

        await createRole(request, token, projectId);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[roles.data.length - 1];
        expect(role).toBeDefined();

        const roleName = role.role_name;

        const projectPage = new ProjectPage(page);
        const rolePage = new RolePage(page);

        await projectPage.openSearchedProject(projectName);
        await rolePage.gotoRolesTab();

        await rolePage.ensureRoleVisible(roleName);
        await rolePage.clickEditRole(roleName);

        await rolePage.goToMaterialsTab();
        await rolePage.openAddMaterialModel();
        await rolePage.uploadMaterial('test-files/images/test-role.jpg');
        await rolePage.clickAddFile();
        await rolePage.verifyMaterialAdded('test-role.jpg');



    });

    // =========================================================
    test('should enable & disable downloadable toggle for material', async ({ page, request }) => {
        test.setTimeout(90000);

        const { response } = await createProject(request, token);
        const projectId = response.data.id;
        const projectName = response.data.title;

        await createRole(request, token, projectId);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[roles.data.length - 1];
        expect(role).toBeDefined();

        const roleName = role.role_name;

        const projectPage = new ProjectPage(page);
        const rolePage = new RolePage(page);

        await projectPage.openSearchedProject(projectName);
        await rolePage.gotoRolesTab();

        await rolePage.ensureRoleVisible(roleName);
        await rolePage.clickEditRole(roleName);

        await rolePage.goToMaterialsTab();
        await rolePage.openAddMaterialModel();
        await rolePage.uploadMaterial('test-files/images/test-role.jpg');
        await rolePage.clickAddFile();
        await rolePage.verifyMaterialAdded('test-role.jpg');

        //verify toggle status
        await rolePage.verifyDefaultStatusOfDownloadableToggle();
        await rolePage.verifyEnableStatusOfDownloadableToggle();
        await rolePage.verifyDisableStatusOfDownloadableToggle();

    });
});