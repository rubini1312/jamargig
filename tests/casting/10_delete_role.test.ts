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
    test('Delete role and verify it disappears in rounds list when project is not active', async ({ page, request }) => {
        test.setTimeout(90000);

        const { response } = await createProject(request, token);
        projectId = response.data.id;
        projectName = response.data.title;
        console.log(projectId);
        await page.waitForTimeout(7000);

        await createRole(request, token, projectId);
        await page.waitForTimeout(10000);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[0];
        expect(role).toBeDefined();
        roleId = role.id;
        roleName = role.role_name;


        const projectPage = new ProjectPage(page);
        const rolePage = new RolePage(page);

        await projectPage.openSearchedProject(projectName);
        await rolePage.gotoRolesTab();
        await page.reload();
        await page.waitForLoadState('networkidle');

        await rolePage.searchRole(roleName);
        await rolePage.clickDeleteRole(roleName);
        await rolePage.clickDeleteConfirmationButton();

        await expect(page.locator(roundLocators.deleteConfirmationBtn)).toBeHidden();
        await expect(page.locator(roundLocators.emptyRoundMessage)).toContainText('No data');

        if (projectId) {
            await deleteProject(request, token, projectId);
        }

    });

    // =========================================================
    test('Delete rounds and verify it disappears in rounds list when project active and rounds is not active', async ({ page, request }) => {
        test.setTimeout(90000);

        const { response } = await createProject(request, token);
        projectId = response.data.id;
        projectName = response.data.title;
        console.log(projectId);
        await page.waitForTimeout(7000);
        await publishProject(request, token, projectId);

        await createRole(request, token, projectId);
        await page.waitForTimeout(10000);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[0];
        expect(role).toBeDefined();
        roleId = role.id;
        roleName = role.role_name;


        await createOnlineRound(request, token, projectId, roleId);
        const rounds = await getProjectRounds(request, token, projectId);
        await page.waitForTimeout(7000);

        const round = rounds.data[0];
        expect(round).toBeDefined();
        roundId = round.id;
        roundName = round.round_name;
        console.log(roundId);

        const projectPage = new ProjectPage(page);
        const rolePage = new RolePage(page);

        await projectPage.openSearchedProject(projectName);
        await rolePage.gotoRolesTab();

        await page.reload();
        await page.waitForLoadState('networkidle');

        await rolePage.searchRole(roleName);
        await rolePage.clickDeleteRole(roleName);
        await rolePage.clickDeleteConfirmationButton();

        await page.waitForTimeout(5000);
        await rolePage.clickCloseDeleteConfirmation();
        await rolePage.verifyRoleCreated(roleName);


    });

    test('Delete rounds and verify it disappears in rounds list when project and rounds is active', async ({ page, request }) => {
        test.setTimeout(90000);

        const { response } = await createProject(request, token);
        projectId = response.data.id;
        projectName = response.data.title;
        console.log(projectId);
        await page.waitForTimeout(7000);
        await publishProject(request, token, projectId);

        await createRole(request, token, projectId);
        await page.waitForTimeout(10000);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[0];
        expect(role).toBeDefined();
        roleId = role.id;
        roleName = role.role_name;


        await createOnlineRound(request, token, projectId, roleId);
        const rounds = await getProjectRounds(request, token, projectId);
        await page.waitForTimeout(7000);

        const round = rounds.data[0];
        expect(round).toBeDefined();
        roundId = round.id;
        roundName = round.round_name;
        await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);

        const projectPage = new ProjectPage(page);
        const rolePage = new RolePage(page);

        await projectPage.openSearchedProject(projectName);
        await rolePage.gotoRolesTab();

        await page.reload();
        await page.waitForLoadState('networkidle');

        await rolePage.searchRole(roleName);
        await rolePage.clickDeleteRole(roleName);
        await rolePage.clickDeleteConfirmationButton();


        await page.waitForTimeout(5000);
        await rolePage.clickCloseDeleteConfirmation();
        await rolePage.verifyRoleCreated(roleName);

        if (projectId) {
            await deleteProject(request, token, projectId);
        }

    });

    test('should delete role from the list when question is created and submitted', async ({ page, request }) => {
        test.setTimeout(90000);

        const { response } = await createProject(request, token);
        await page.waitForTimeout(7000);

        projectId = response.data.id;
        projectName = response.data.title;
        console.log(projectId);
        await publishProject(request, token, projectId);

        await createRole(request, token, projectId);
        await page.waitForTimeout(10000);

        const roles = await getProjectRoles(request, token, projectId);
        await page.waitForTimeout(7000);

        const role = roles.data[0];
        expect(role).toBeDefined();
        roleId = role.id;
        roleName = role.role_name;


        await createOnlineRound(request, token, projectId, roleId);
        const rounds = await getProjectRounds(request, token, projectId);
        const round = rounds.data[0];
        expect(round).toBeDefined();
        roundId = round.id;
        roundName = round.round_name;
        await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);
        await page.waitForTimeout(7000);

        const talentEmail = generateEmail();
        const talentToken = await getTalentAccessToken(request, talentEmail);

        const talentName = "AutoTalent_" + Date.now();

        const result = await registerTalent(request, talentToken, talentName);
        expect(result).toBeTruthy();

        // text Questions
        const question = await createTextQuestion(
            request, token, projectId, roundId, roleId,
            "Tell us about yourself"
        );

        await page.waitForTimeout(7000);
        const projectPage = new ProjectPage(page);
        const rolePage = new RolePage(page);

        await projectPage.openSearchedProject(projectName);
        await rolePage.gotoRolesTab();

        await page.reload();
        await page.waitForLoadState('networkidle');

        await rolePage.searchRole(roleName);
        await rolePage.clickDeleteRole(roleName);
        await rolePage.clickDeleteConfirmationButton();

        await page.waitForTimeout(5000);
        await rolePage.clickCloseDeleteConfirmation();
        await rolePage.verifyRoleCreated(roleName);

        if (projectId) {
            await deleteProject(request, token, projectId);
        }

    });

    test('should delete role from the list when role is assigned to cast list', async ({ page, request }) => {
        test.setTimeout(90000);

        const { response } = await createProject(request, token);
        await page.waitForTimeout(7000);

        projectId = response.data.id;
        projectName = response.data.title;
        console.log(projectId);
        await publishProject(request, token, projectId);

        await createRole(request, token, projectId);
        await page.waitForTimeout(10000);

        const roles = await getProjectRoles(request, token, projectId);
        await page.waitForTimeout(15000);

        const role = roles.data[0];
        expect(role).toBeDefined();
        roleId = role.id;
        roleName = role.role_name;
        console.log("ROLE ID" + roleId);

        await createWorkingCastList(request, token, projectId, roleId, "Automated Cast")
        await page.waitForTimeout(7000);
        const projectPage = new ProjectPage(page);
        const rolePage = new RolePage(page);

        await projectPage.openSearchedProject(projectName);
        await rolePage.gotoRolesTab();

        await page.reload();
        await page.waitForLoadState('networkidle');

        await rolePage.searchRole(roleName);
        await rolePage.clickDeleteRole(roleName);
        await rolePage.clickDeleteConfirmationButton();

        await expect(page.locator(roundLocators.deleteConfirmationBtn)).toBeHidden();
        await expect(page.locator(roundLocators.emptyRoundMessage)).toContainText('No data');


        if (projectId) {
            await deleteProject(request, token, projectId);
        }

    });



});



