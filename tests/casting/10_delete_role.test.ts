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

test.describe('Casting owner delete role scenarios', () => {
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
    test('Delete role and verify it disappears in roles list when project is not active', async ({ page, request }) => {
        test.setTimeout(90000);

        // Create project
        const { response } = await createProject(request, token);
        projectId = response.data.id;
        projectName = response.data.title;

        // Create role
        await createRole(request, token, projectId);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[roles.data.length - 1];
        expect(role).toBeDefined();

        roleId = role.id;
        roleName = role.role_name;

        const projectPage = new ProjectPage(page);
        const rolePage = new RolePage(page);

        await projectPage.openSearchedProject(projectName);
        await rolePage.gotoRolesTab();

        await rolePage.ensureRoleVisible(roleName);

        // Delete role
        await rolePage.clickDeleteRole(roleName);
        await rolePage.clickDeleteConfirmationButton();

        await expect(page.locator(roleLocators.deleteConfirmationBtn)).not.toBeVisible();
        await expect(page.locator(roleLocators.emptyRoundMessage))
            .toContainText(/no data/i);

        const deletedRow = page.locator('[data-col-key="role_name"]', {
            hasText: roleName
        });

        await expect(deletedRow).toHaveCount(0);

        // Cleanup
        if (projectId) {
            await deleteProject(request, token, projectId);
        }
    });

    // =========================================================
    test('Should not delete role when project is active', async ({ page, request }) => {
        test.setTimeout(90000);

        // Create project
        const { response } = await createProject(request, token);
        const projectId = response.data.id;
        const projectName = response.data.title;

        await publishProject(request, token, projectId);

        // Create role
        await createRole(request, token, projectId);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[roles.data.length - 1];
        expect(role).toBeDefined();

        const roleName = role.role_name;
        const roleId = role.id;

        await createOnlineRound(request, token, projectId, roleId);

        const projectPage = new ProjectPage(page);
        const rolePage = new RolePage(page);

        await projectPage.openSearchedProject(projectName);
        await rolePage.gotoRolesTab();

        await rolePage.ensureRoleVisible(roleName);

        await rolePage.clickDeleteRole(roleName);
        await rolePage.clickDeleteConfirmationButton();

        await expect(page.locator(roleLocators.deleteConfirmationBtn)).toBeVisible();

        await rolePage.clickCloseDeleteConfirmation();

        const roleRow = page.locator('[data-col-key="role_name"]', {
            hasText: roleName
        });

        await expect(roleRow).toBeVisible();

        // Cleanup
        await deleteProject(request, token, projectId);
    });

    test('Should not delete role when project and rounds are active', async ({ page, request }) => {
        test.setTimeout(90000);

        // Create project
        const { response } = await createProject(request, token);
        const projectId = response.data.id;
        const projectName = response.data.title;

        await publishProject(request, token, projectId);

        // Create role
        await createRole(request, token, projectId);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[roles.data.length - 1];
        expect(role).toBeDefined();

        const roleId = role.id;
        const roleName = role.role_name;

        await createOnlineRound(request, token, projectId, roleId);

        const rounds = await getProjectRounds(request, token, projectId);
        const round = rounds.data[rounds.data.length - 1];
        expect(round).toBeDefined();

        const roundId = round.id;

        await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);

        const projectPage = new ProjectPage(page);
        const rolePage = new RolePage(page);

        await projectPage.openSearchedProject(projectName);
        await rolePage.gotoRolesTab();

        await rolePage.ensureRoleVisible(roleName);

        await rolePage.clickDeleteRole(roleName);
        await rolePage.clickDeleteConfirmationButton();

        await expect(page.locator(roleLocators.deleteConfirmationBtn)).toBeVisible();

        await rolePage.clickCloseDeleteConfirmation();

        const roleRow = page.locator('[data-col-key="role_name"]', {
            hasText: roleName
        });

        await expect(roleRow).toBeVisible();

        // Cleanup
        await deleteProject(request, token, projectId);
    });

    test('Should not delete role when question is created and submitted', async ({ page, request }) => {
        test.setTimeout(90000);

        // Create project
        const { response } = await createProject(request, token);
        const projectId = response.data.id;
        const projectName = response.data.title;

        await publishProject(request, token, projectId);

        // Create role
        await createRole(request, token, projectId);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[roles.data.length - 1];
        expect(role).toBeDefined();

        const roleId = role.id;
        const roleName = role.role_name;

        // Create round
        await createOnlineRound(request, token, projectId, roleId);

        const rounds = await getProjectRounds(request, token, projectId);
        const round = rounds.data[rounds.data.length - 1];
        expect(round).toBeDefined();

        const roundId = round.id;

        await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);

        const talentEmail = generateEmail();
        const talentToken = await getTalentAccessToken(request, talentEmail);

        const talentName = "AutoTalent_" + Date.now();
        const result = await registerTalent(request, talentToken, talentName);
        expect(result).toBeTruthy();

        // Create question
        const question = await createTextQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Tell us about yourself"
        );

        await applyForRound(
            request,
            talentToken,
            validLogin.tenant_id,
            projectId,
            roundId,
            roleId,
            question.data.question_id
        );

        const projectPage = new ProjectPage(page);
        const rolePage = new RolePage(page);

        await projectPage.openSearchedProject(projectName);
        await rolePage.gotoRolesTab();

        await rolePage.ensureRoleVisible(roleName);

        await rolePage.clickDeleteRole(roleName);
        await rolePage.clickDeleteConfirmationButton();

        await expect(page.locator(roleLocators.deleteConfirmationBtn)).toBeVisible();

        await rolePage.clickCloseDeleteConfirmation();

        const roleRow = page.locator('[data-col-key="role_name"]', {
            hasText: roleName
        });

        await expect(roleRow).toBeVisible();

        await deleteProject(request, token, projectId);
    });

    test('Should not delete role when assigned to cast list', async ({ page, request }) => {
        test.setTimeout(90000);

        // Create project
        const { response } = await createProject(request, token);
        const projectId = response.data.id;
        const projectName = response.data.title;

        await publishProject(request, token, projectId);

        // Create role
        await createRole(request, token, projectId);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[roles.data.length - 1]; 
        expect(role).toBeDefined();

        const roleId = role.id;
        const roleName = role.role_name;

        await createWorkingCastList(request, token, projectId, roleId, "Automated Cast");

        const projectPage = new ProjectPage(page);
        const rolePage = new RolePage(page);

        await projectPage.openSearchedProject(projectName);
        await rolePage.gotoRolesTab();

        await rolePage.ensureRoleVisible(roleName);

        await rolePage.clickDeleteRole(roleName);
        await rolePage.clickDeleteConfirmationButton();

        await expect(page.locator(roleLocators.deleteConfirmationBtn)).toBeVisible();

        await rolePage.clickCloseDeleteConfirmation();

        const roleRow = page.locator('[data-col-key="role_name"]', {
            hasText: roleName
        });

        await expect(roleRow).toBeVisible();

        // Cleanup
        await deleteProject(request, token, projectId);
    });


});



