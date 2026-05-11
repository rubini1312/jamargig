import { APIRequestContext, expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import { roundLocators } from "../../pages/casting/owner/round/roundPageLocators";
import { validLogin } from "@/test-data/loginData";
import { urls } from "@/utils/urls";
import { createProject, deleteProject, publishProject } from "@/helpers/api/casting/projectApi";
import { createRole, deleteAllRoles, deleteRole, getProjectRoles } from "@/helpers/api/casting/roleApi";
import ProjectPage from "@/pages/casting/owner/project/projectPage";
import { getAccessTokenSmartFromCasting } from "@/helpers/api/casting/authApi";
import RolePage from "@/pages/casting/owner/role/rolePage";


test.describe('Casting owner delete project scenarios', () => {
    let token: string;
    let projectId: number;
    let roleId: number;
    let roleName: string;
    let projectName: string;
    let uniqueName: string;

    test.beforeAll(async ({ request }) => {
        token = await getAccessTokenSmartFromCasting(request, validLogin.email);

        uniqueName = `Automation Talent-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    });

    test.beforeEach(async ({ page }) => {
        await page.goto(`${urls.casting}/projects`, {
            waitUntil: 'domcontentloaded',
        });

        await expect(page).toHaveURL(/projects/);
    });


    // =========================================================
    test('Delete project  and verify it disappears in project list when project is not active', async ({ page, request }) => {
        test.setTimeout(90000);

        const { response } = await createProject(request, token);
        projectId = response.data.id;
        projectName = response.data.title;
        console.log(projectId);

        await createRole(request, token, projectId);
        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[0];
        expect(role).toBeDefined();
        roleId = role.id;
        roleName = role.role_name;


        const projectPage = new ProjectPage(page);
        const rolePage = new RolePage(page);

        await projectPage.searchProject(projectName);
        await projectPage.clickDeleteProject(projectName);
        await projectPage.clickDeleteConfirmationBtn();

        await expect(page.locator(roundLocators.deleteConfirmationBtn)).toBeHidden();

        await page.reload();
        await page.waitForLoadState('networkidle');

        await projectPage.verifyDeletedProject(projectName);
        if (projectId) {
            await deleteProject(request, token, projectId);
        }

    });

    test('Delete project  and verify it disappears in project list when project is active', async ({ page, request }) => {
        test.setTimeout(90000);

        const { response } = await createProject(request, token);
        projectId = response.data.id;
        projectName = response.data.title;
        console.log(projectId);
        await publishProject(request, token, projectId);

        await createRole(request, token, projectId);
        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[0];
        expect(role).toBeDefined();
        roleId = role.id;
        roleName = role.role_name;


        const projectPage = new ProjectPage(page);
        const rolePage = new RolePage(page);

        await projectPage.searchProject(projectName);
        await projectPage.clickDeleteProject(projectName);
        await projectPage.clickDeleteConfirmationBtn();


        await expect(page.locator(roundLocators.deleteConfirmationBtn)).toBeHidden();

        await page.reload();
        await page.waitForLoadState('networkidle');

        await projectPage.verifyDeletedProject(projectName);
        if (projectId) {
            await deleteProject(request, token, projectId);
        }

    });

});


