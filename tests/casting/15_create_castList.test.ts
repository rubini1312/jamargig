import { APIRequestContext, expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import { validLogin } from "@/test-data/loginData";
import { urls } from "@/utils/urls";
import { createProject, deleteProject, publishProject } from "@/helpers/api/casting/projectApi";
import { createRole, deleteAllRoles, getProjectRoles } from "@/helpers/api/casting/roleApi";
import ProjectPage from "@/pages/casting/owner/project/projectPage";
import { getAccessTokenSmartFromCasting } from "@/helpers/api/casting/authApi";
import CastListPage from "@/pages/casting/owner/workingCastList/workingCastListPage";

test.describe('Casting owner create wcl scenarios', () => {
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
    test('Create new wcl and verify it appears in wcl list when project is not active', async ({ page, request }) => {
        test.setTimeout(60000);

        const projectPage = new ProjectPage(page);
        const castListPage = new CastListPage(page);

        // Open project
        await projectPage.openSearchedProject(projectName);

        // Create role
        await createRole(request, token, projectId);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[roles.data.length - 1];
        expect(role).toBeDefined();

        const roleName = role.role_name;

        await castListPage.gotoCastListTab();

        await expect(async () => {
            await castListPage.clickCreateWcl();

            const option = page.locator('text=' + roleName);

            if (!(await option.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
                await castListPage.gotoCastListTab();
                await castListPage.clickCreateWcl();
            }

        }).toPass({ timeout: 15000 });

        const wclName = `automated-wcl-${Date.now()}`;

        await castListPage.enterWclName(wclName);
        await castListPage.selectRole(roleName);
        await castListPage.clickAdd();
        await castListPage.clickSubmitBtn();

        await castListPage.verifyWclRow({
            name: wclName,
            role: roleName,
            status: "Open"
        });
    });

    test('Create new wcl and verify it appears in wcl list when project is active', async ({ page, request }) => {
        test.setTimeout(60000);

        const projectPage = new ProjectPage(page);
        const castListPage = new CastListPage(page);

        await publishProject(request, token, projectId);

        await projectPage.openSearchedProject(projectName);

        await createRole(request, token, projectId);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[roles.data.length - 1];
        expect(role).toBeDefined();

        const roleName = role.role_name;

        await castListPage.gotoCastListTab();

        await expect(async () => {
            await castListPage.clickCreateWcl();

            const option = page.locator('text=' + roleName);

            if (!(await option.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
                await castListPage.gotoCastListTab();
                await castListPage.clickCreateWcl();
            }


        }).toPass({ timeout: 15000 });

        const wclName = `automated-wcl-${Date.now()}`;

        await castListPage.enterWclName(wclName);
        await castListPage.selectRole(roleName);
        await castListPage.clickAdd();
        await castListPage.clickSubmitBtn();

        await castListPage.verifyWclRow({
            name: wclName,
            role: roleName,
            status: "Open"
        });
    });

});
