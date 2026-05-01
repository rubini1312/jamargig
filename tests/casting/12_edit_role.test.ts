import { APIRequestContext, expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import RoundPage from "../../pages/casting/owner/round/roundPage";
import { roundLocators } from "../../pages/casting/owner/round/roundPageLocators";
import { validLogin } from "@/test-data/loginData";
import { urls } from "@/utils/urls";
import { createProject, deleteProject, publishProject } from "@/helpers/api/casting/projectApi";
import { createRole, deleteAllRoles, deleteRole, getProjectRoles } from "@/helpers/api/casting/roleApi";
import { createInPersonRound, createOnlineRound, deleteAllRounds, getProjectRounds, updateRoundSubmissionStatus } from "@/helpers/api/casting/roundApi";
import ProjectPage from "@/pages/casting/owner/project/projectPage";
import { onlineRoundData, inPersonRoundData } from "@/test-data/roundData";
import { getTalentAccessToken } from "@/helpers/api/talent/authApi";
import { generateEmail } from "@/test-data/random-data";
import { applyForRound, registerTalent } from "@/helpers/api/talent/talentApi";
import { getAccessTokenSmartFromCasting } from "@/helpers/api/casting/authApi";
import { applyRegistrationConfig, deleteTalent, getFieldsByPageId, getTalentUuidByName } from "@/helpers/api/casting/talentApi";
import { apiConfig } from "@/test-data/dataModelConfig";
import { createTextQuestion } from "@/helpers/api/casting/questionApi";
import rolePage from "@/pages/casting/owner/role/rolePage";
import RolePage from "@/pages/casting/owner/role/rolePage";
import { createWorkingCastList } from "@/helpers/api/casting/castListApi";
import { roleLocators } from "@/pages/casting/owner/role/rolePageLocators";

test.describe('Casting owner edit role scenarios', () => {
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

        uniqueName = `Automation Talent-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    });

    test.beforeEach(async ({ page, request }) => {
        await page.goto(urls.casting);
        const login = new LoginPage(page);
        const status = await login.validLoginwithUI(validLogin.email, validLogin.password, request);
        console.log("2FA Status:", status);
        await page.goto(urls.casting + "/projects"); await expect(page).toHaveURL(/projects/);
    });


    // =========================================================
    test('should validate required fields when editing role', async ({ page, request }) => {
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

         await page.locator(roleLocators.editRole_name).click()

        await deleteProject(request, token, projectId);
    });

    // =========================================================
    test('edit role when project is active', async ({ page, request }) => {
        test.setTimeout(90000);

        const { response } = await createProject(request, token);
        const projectId = response.data.id;
        const projectName = response.data.title;

        await publishProject(request, token, projectId);
        await createRole(request, token, projectId);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[roles.data.length - 1];

        const roleName = role.role_name;

        const projectPage = new ProjectPage(page);
        const rolePage = new RolePage(page);

        await projectPage.openSearchedProject(projectName);
        await rolePage.gotoRolesTab();

        await rolePage.ensureRoleVisible(roleName);

        await rolePage.clickEditRole(roleName);

        await rolePage.editRole();
        await rolePage.saveEditedRoleData();

        await expect(page.locator(roleLocators.editRole_saveBtn)).not.toBeVisible();

        await rolePage.verifyRoleEdited('Edited Project Role');

        await deleteProject(request, token, projectId);
    });

    // =========================================================
    test('edit role when project is not active', async ({ page, request }) => {
        test.setTimeout(90000);

        const { response } = await createProject(request, token);
        const projectId = response.data.id;
        const projectName = response.data.title;

        await createRole(request, token, projectId);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[roles.data.length - 1];

        const roleName = role.role_name;

        const projectPage = new ProjectPage(page);
        const rolePage = new RolePage(page);

        await projectPage.openSearchedProject(projectName);
        await rolePage.gotoRolesTab();

        await rolePage.ensureRoleVisible(roleName);

        await rolePage.clickEditRole(roleName);

        await rolePage.editRole();
        await rolePage.saveEditedRoleData();

        await expect(page.locator(roleLocators.editRole_saveBtn)).not.toBeVisible();

        await rolePage.verifyRoleEdited('Edited Project Role');

        await deleteProject(request, token, projectId);
    });
});