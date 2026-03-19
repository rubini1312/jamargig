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
import CastListPage from "@/pages/casting/owner/castList/castListPage";
import { createWorkingCastList } from "@/helpers/api/casting/castListApi";

test.describe('Casting owner edit wcl scenarios', () => {
    let token: string;
    let projectId: number;
    let roundId: number;
    let roleId: number;
    let roleName: string;
    let roundName: string;
    let projectName: string;
    let uniqueName: string;

    test.beforeAll(async ({ request }) => {
        token = await getAccessTokenSmartFromCasting(request, validLogin.email);
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
    test('Edit  wcl and verify data when project is not active', async ({ page, request }) => {
        test.setTimeout(60000);

        const projectPage = new ProjectPage(page);
        const castListPage = new CastListPage(page);
        projectPage.openSearchedProject(projectName);
        await page.waitForTimeout(7000);

        await createRole(request, token, projectId);
        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[0];
        expect(role).toBeDefined();
        roleId = role.id;
        roleName = role.role_name;

        await createWorkingCastList(request, token, projectId, roleId, "Automated Cast")
        await page.waitForTimeout(7000);

        await castListPage.gotoCastListTab();
        await castListPage.clickEditBtn();

        await castListPage.enterWclName("edited automated wcl");
        await castListPage.clickUpdateBtn();


        await castListPage.verifyWclRow({
            name: "edited automated wcl",
            role: roleName,
            status: "Open"
        });

    });

    test('Create new wcl and verify it appears in wcl list when project is active', async ({ page, request }) => {
        test.setTimeout(60000);

        const projectPage = new ProjectPage(page);
        const castListPage = new CastListPage(page);
        await publishProject(request, token, projectId);
        projectPage.openSearchedProject(projectName);
        await page.waitForTimeout(7000);

        await createRole(request, token, projectId);
        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[0];
        expect(role).toBeDefined();
        roleId = role.id;
        roleName = role.role_name;


        await createWorkingCastList(request, token, projectId, roleId, "Automated Cast")
        await page.waitForTimeout(7000);

        await castListPage.gotoCastListTab();
        await castListPage.clickEditBtn();

        await castListPage.enterWclName("edited automated wcl");
        await castListPage.clickUpdateBtn();


        await castListPage.verifyWclRow({
            name: "edited automated wcl",
            role: roleName,
            status: "Open"
        });

    });

});
