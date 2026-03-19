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
import { getTalentAccessToken } from "@/helpers/api/talent/authApi";
import { generateEmail } from "@/test-data/random-data";
import { applyForRound, registerTalent } from "@/helpers/api/talent/talentApi";
import { getAccessTokenSmartFromCasting } from "@/helpers/api/casting/authApi";
import { applyRegistrationConfig, deleteTalent, getFieldsByPageId, getTalentUuidByName } from "@/helpers/api/casting/talentApi";
import { createTextQuestion } from "@/helpers/api/casting/questionApi";
import RolePage from "@/pages/casting/owner/role/rolePage";


test.describe('Casting owner edit  round  scenarios', () => {
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
        await page.goto(urls.casting, { waitUntil: "domcontentloaded" }); const login = new LoginPage(page);
        const status = await login.validLoginwithUI(validLogin.email, validLogin.password, request);
        console.log("2FA Status:", status);
        await page.goto(urls.casting + "/projects"); await expect(page).toHaveURL(/projects/);
    });


    // =========================================================
    test('should validate the required fields when project is editing', async ({ page, request }) => {
        test.setTimeout(90000);

        const { response } = await createProject(request, token);
        projectId = response.data.id;
        projectName = response.data.title;
        console.log(projectId);
        await page.waitForTimeout(7000);

        await createRole(request, token, projectId);
        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[0];
        expect(role).toBeDefined();
        roleId = role.id;
        roleName = role.role_name;

        await createInPersonRound(request, token, projectId, roleId);
        const newRounds = await getProjectRounds(request, token, projectId);
        const newRound = newRounds.data[0];
        expect(newRound).toBeDefined();
        roundId = newRound.id;
        roundName = newRound.round_name;

        const projectPage = new ProjectPage(page);
        const roundPage = new RoundPage(page);

        await projectPage.openSearchedProject(projectName);
        await roundPage.gotoRoundsTab();

        await roundPage.searchRound(roundName);
        await roundPage.clickEditRound(roundName);
        await roundPage.gotoRoundDetailsTab();

        await page.locator(roundLocators.editRound_name).click();
        await page.locator(roundLocators.roundNameInput_editable).press('Control+A');
        await page.locator(roundLocators.roundNameInput_editable).press('Delete');

        await expect(page.locator(roundLocators.emptyRoundName_error)).toContainText('Value is required');


        if (projectId) {
            await deleteProject(request, token, projectId);
        }

    });

    test('edit round and verify edited data when project is active', async ({ page, request }) => {
        test.setTimeout(90000);

        const { response } = await createProject(request, token);
        projectId = response.data.id;
        projectName = response.data.title;
        console.log(projectId);
        await page.waitForTimeout(7000);
        await publishProject(request, token, projectId);

        await createRole(request, token, projectId);
        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[0];
        expect(role).toBeDefined();
        roleId = role.id;
        roleName = role.role_name;

        await createInPersonRound(request, token, projectId, roleId);
        const newRounds = await getProjectRounds(request, token, projectId);
        const newRound = newRounds.data[0];
        expect(newRound).toBeDefined();
        roundId = newRound.id;
        roundName = newRound.round_name;

        const projectPage = new ProjectPage(page);
        const rolePage = new RolePage(page);
        const roundPage = new RoundPage(page);

        await projectPage.openSearchedProject(projectName);
        await roundPage.gotoRoundsTab();

        await roundPage.searchRound(roundName);
        await roundPage.clickEditRound(roundName);
        await roundPage.gotoRoundDetailsTab();

        await roundPage.editRound();
        await roundPage.saveEditedRoleData();

        await roundPage.verifyRoundEdited('Edited Automated Round');


        if (projectId) {
            await deleteProject(request, token, projectId);
        }

    });

    test('edit round and verify edited data when project is not active', async ({ page, request }) => {
        test.setTimeout(90000);

        const { response } = await createProject(request, token);
        projectId = response.data.id;
        projectName = response.data.title;
        console.log(projectId);
        await page.waitForTimeout(7000);

        await createRole(request, token, projectId);
        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[0];
        expect(role).toBeDefined();
        roleId = role.id;
        roleName = role.role_name;

        await createInPersonRound(request, token, projectId, roleId);
        const newRounds = await getProjectRounds(request, token, projectId);
        const newRound = newRounds.data[0];
        expect(newRound).toBeDefined();
        roundId = newRound.id;
        roundName = newRound.round_name;
        await page.waitForTimeout(7000);

        const projectPage = new ProjectPage(page);
        const rolePage = new RolePage(page);
        const roundPage = new RoundPage(page);

        await projectPage.openSearchedProject(projectName);
        await roundPage.gotoRoundsTab();

        await roundPage.searchRound(roundName);
        await roundPage.clickEditRound(roundName);
        await roundPage.gotoRoundDetailsTab();

        await roundPage.editRound();
        await roundPage.saveEditedRoleData();

        await roundPage.verifyRoundEdited('Edited Automated Round');


        if (projectId) {
            await deleteProject(request, token, projectId);
        }
    });

    test('edit round and verify edited data when question is added to the round', async ({ page, request }) => {
        test.setTimeout(90000);

        const { response } = await createProject(request, token);
        projectId = response.data.id;
        projectName = response.data.title;
        console.log(projectId);
        await page.waitForTimeout(7000);

        await createRole(request, token, projectId);
        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[0];
        expect(role).toBeDefined();
        roleId = role.id;
        roleName = role.role_name;

        await createInPersonRound(request, token, projectId, roleId);
        const newRounds = await getProjectRounds(request, token, projectId);
        const newRound = newRounds.data[0];
        expect(newRound).toBeDefined();
        roundId = newRound.id;
        roundName = newRound.round_name;
        await page.waitForTimeout(7000);

        await createTextQuestion(
            request, token, projectId, roundId, roleId,
            "Tell us about yourself"
        );

        const projectPage = new ProjectPage(page);
        const rolePage = new RolePage(page);
        const roundPage = new RoundPage(page);

        await projectPage.openSearchedProject(projectName);
        await roundPage.gotoRoundsTab();

        await roundPage.searchRound(roundName);
        await roundPage.clickEditRound(roundName);
        await roundPage.gotoRoundDetailsTab();

        await roundPage.editRound();
        await roundPage.saveEditedRoleData();

        await roundPage.verifyRoundEdited('Edited Automated Round');


        if (projectId) {
            await deleteProject(request, token, projectId);
        }
    });

    test('edit round, verify edited data when question is added to the round and talent is applied to the round', async ({ page, request }) => {
        test.setTimeout(90000);

        const { response } = await createProject(request, token);
        projectId = response.data.id;
        projectName = response.data.title;
        console.log(projectId);
        await page.waitForTimeout(7000);
        await publishProject(request, token, projectId);

        await createRole(request, token, projectId);
        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[0];
        expect(role).toBeDefined();
        roleId = role.id;
        roleName = role.role_name;

        await createInPersonRound(request, token, projectId, roleId);
        const newRounds = await getProjectRounds(request, token, projectId);
        const newRound = newRounds.data[0];
        expect(newRound).toBeDefined();
        roundId = newRound.id;
        roundName = newRound.round_name;
        await page.waitForTimeout(7000);

        await publishProject(request, token, projectId);

        await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);
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

        await applyForRound(
            request,
            talentToken,
            validLogin.tenant_id,
            projectId,
            roundId,
            roleId,
            question.data.question_id
        );
        await page.waitForTimeout(3000);

        const projectPage = new ProjectPage(page);
        const rolePage = new RolePage(page);
        const roundPage = new RoundPage(page);

        await projectPage.openSearchedProject(projectName);
        await roundPage.gotoRoundsTab();

        await roundPage.searchRound(roundName);
        await roundPage.clickEditRound(roundName);
        await roundPage.gotoRoundDetailsTab();

        await roundPage.editRound();
        await roundPage.saveEditedRoleData();

        await roundPage.verifyRoundEdited('Edited Automated Round');


        if (projectId) {
            await deleteProject(request, token, projectId);
        }
    });

});