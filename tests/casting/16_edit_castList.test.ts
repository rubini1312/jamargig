import { APIRequestContext, expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import RolePage from "../../pages/casting/owner/role/rolePage";
import { roleLocators } from "../../pages/casting/owner/role/rolePageLocators";
import { validLogin } from "@/test-data/loginData";
import { roleData } from "@/test-data/roleData";
import { urls } from "@/utils/urls";
import { createProject, deleteProject, publishProject } from "@/helpers/api/casting/projectApi";
import { createRole, deleteAllRoles, getProjectRoles } from "@/helpers/api/casting/roleApi";
import ProjectPage from "@/pages/casting/owner/project/projectPage";
import { getAccessTokenSmartFromCasting } from "@/helpers/api/casting/authApi";
import CastListPage from "@/pages/casting/owner/workingCastList/workingCastListPage";
import { createWorkingCastList } from "@/helpers/api/casting/castListApi";

test.describe('Casting owner edit wcl scenarios', () => {
    let token: string;
    let projectId: number;
    let projectName: string;

    test.beforeAll(async ({ request }) => {
        token = await getAccessTokenSmartFromCasting(request, validLogin.email);

    });

    test.beforeEach(async ({ page }) => {
        await page.goto(`${urls.casting}/projects`, {
            waitUntil: 'domcontentloaded',
        });

        await expect(page).toHaveURL(/projects/);
    });


    // =========================================================
    test('Edit wcl and verify data when project is not active', async ({ page, request }) => {
        test.setTimeout(60000);

        const { response } = await createProject(request, token);
        projectId = response.data.id;
        projectName = response.data.title;
        console.log(projectName);
        console.log(projectId);

        const projectPage = new ProjectPage(page);
        const castListPage = new CastListPage(page);

        await projectPage.openSearchedProject(projectName);

        // Create role
        await createRole(request, token, projectId);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[roles.data.length - 1];
        expect(role).toBeDefined();

        const roleId = role.id;
        const roleName = role.role_name;

        const wclName = `Automated Cast-${Date.now()}`;
        const editedName = `edited-wcl-${Date.now()}`;

        await createWorkingCastList(request, token, projectId, roleId, wclName);

        await castListPage.gotoCastListTab();

        await expect(async () => {
            const row = page.locator('[data-col-key="name"]', {
                hasText: wclName
            });

            if (!(await row.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
                await castListPage.gotoCastListTab();
            }

            await expect(row).toBeVisible();
        }).toPass({ timeout: 15000 });

        await castListPage.clickEditBtn();
        await castListPage.enterWclName(editedName);
        await castListPage.clickUpdateBtn();

        await castListPage.verifyWclRow({
            name: editedName,
            role: roleName,
            status: "Open"
        });

        if (projectId) {
            await deleteProject(request, token, projectId);
        }

    });

    test('Edit wcl and verify it appears in wcl list when project is active', async ({ page, request }) => {
        test.setTimeout(60000);

        const { response } = await createProject(request, token);
        projectId = response.data.id;
        projectName = response.data.title;
        console.log(projectName);
        console.log(projectId);

        const projectPage = new ProjectPage(page);
        const castListPage = new CastListPage(page);

        await publishProject(request, token, projectId);

        await projectPage.openSearchedProject(projectName);

        await createRole(request, token, projectId);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[roles.data.length - 1]
        expect(role).toBeDefined();

        const roleId = role.id;
        const roleName = role.role_name;

        const wclName = `Automated-Cast-${Date.now()}`;
        const editedName = `edited-wcl-${Date.now()}`;

        await createWorkingCastList(request, token, projectId, roleId, wclName);

        await castListPage.gotoCastListTab();

        await expect(async () => {
            const row = page.locator('[data-col-key="name"]', {
                hasText: wclName
            });

            if (!(await row.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
                await castListPage.gotoCastListTab();
            }

            await expect(row).toBeVisible();

        }).toPass({ timeout: 15000 });

        await castListPage.clickEditBtn();
        await castListPage.enterWclName(editedName);
        await castListPage.clickUpdateBtn();

        await castListPage.verifyWclRow({
            name: editedName,
            role: roleName,
            status: "Open"
        });

        if (projectId) {
            await deleteProject(request, token, projectId);
        }

    });

});
