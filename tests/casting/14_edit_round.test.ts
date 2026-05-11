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


test.describe('Casting owner edit round scenarios', () => {
    let token: string;
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
    test('should validate required fields when editing round', async ({ page, request }) => {
        test.setTimeout(90000);

        const { response } = await createProject(request, token);
        const projectId = response.data.id;
        const projectName = response.data.title;

        await createRole(request, token, projectId);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[roles.data.length - 1];

        const roleId = role.id;

        await createInPersonRound(request, token, projectId, roleId);

        const rounds = await getProjectRounds(request, token, projectId);
        const round = rounds.data[rounds.data.length - 1];

        const roundName = round.round_name;

        const projectPage = new ProjectPage(page);
        const roundPage = new RoundPage(page);

        await projectPage.openSearchedProject(projectName);
        await roundPage.gotoRoundsTab();

        await roundPage.ensureRoundVisible(roundName);

        await roundPage.clickEditRound(roundName);
        await roundPage.gotoRoundDetailsTab();

        await page.locator(roundLocators.editRound_name).click()

        await deleteProject(request, token, projectId);
    });

    // =========================================================
    test('edit round and verify edited data when project is active', async ({ page, request }) => {
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

        // Create round
        await createInPersonRound(request, token, projectId, roleId);

        const rounds = await getProjectRounds(request, token, projectId);
        const round = rounds.data[rounds.data.length - 1];
        expect(round).toBeDefined();

        const roundName = round.round_name;

        const projectPage = new ProjectPage(page);
        const roundPage = new RoundPage(page);

        // Open UI
        await projectPage.openSearchedProject(projectName);
        await roundPage.gotoRoundsTab();

        await roundPage.ensureRoundVisible(roundName);

        // Edit round
        await roundPage.clickEditRound(roundName);
        await roundPage.gotoRoundDetailsTab();

        await roundPage.editRound();
        await roundPage.saveEditedRoundData();

        // Verify
        await roundPage.verifyRoundEdited('Edited Automated Round');

        // Cleanup
        await deleteProject(request, token, projectId);
    });

    test('edit round and verify edited data when project is not active', async ({ page, request }) => {
        test.setTimeout(90000);

        // Create project
        const { response } = await createProject(request, token);
        const projectId = response.data.id;
        const projectName = response.data.title;

        // Create role
        await createRole(request, token, projectId);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[roles.data.length - 1];
        expect(role).toBeDefined();

        const roleId = role.id;

        // Create round
        await createInPersonRound(request, token, projectId, roleId);

        const rounds = await getProjectRounds(request, token, projectId);
        const round = rounds.data[rounds.data.length - 1];
        expect(round).toBeDefined();

        const roundName = round.round_name;

        const projectPage = new ProjectPage(page);
        const roundPage = new RoundPage(page);

        await projectPage.openSearchedProject(projectName);
        await roundPage.gotoRoundsTab();

        await roundPage.ensureRoundVisible(roundName);

        // Edit round
        await roundPage.clickEditRound(roundName);
        await roundPage.gotoRoundDetailsTab();

        await roundPage.editRound();
        await roundPage.saveEditedRoundData();

        // Verify
        await roundPage.verifyRoundEdited('Edited Automated Round');

        // Cleanup
        await deleteProject(request, token, projectId);
    });

    test('edit round and verify edited data when question is added to the round', async ({ page, request }) => {
        test.setTimeout(90000);

        // Create project
        const { response } = await createProject(request, token);
        const projectId = response.data.id;
        const projectName = response.data.title;

        // Create role
        await createRole(request, token, projectId);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[roles.data.length - 1];
        expect(role).toBeDefined();

        const roleId = role.id;

        // Create round
        await createInPersonRound(request, token, projectId, roleId);

        const rounds = await getProjectRounds(request, token, projectId);
        const round = rounds.data[rounds.data.length - 1];
        expect(round).toBeDefined();

        const roundId = round.id;
        const roundName = round.round_name;

        await createTextQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Tell us about yourself"
        );

        const projectPage = new ProjectPage(page);
        const roundPage = new RoundPage(page);

        await projectPage.openSearchedProject(projectName);
        await roundPage.gotoRoundsTab();

        await roundPage.ensureRoundVisible(roundName);

        await roundPage.clickEditRound(roundName);
        await roundPage.gotoRoundDetailsTab();

        await roundPage.editRound();
        await roundPage.saveEditedRoundData();

        await roundPage.verifyRoundEdited('Edited Automated Round');

        await deleteProject(request, token, projectId);
    });

    test('edit round, verify edited data when question is added and talent is applied', async ({ page, request }) => {
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

        // Create round
        await createInPersonRound(request, token, projectId, roleId);

        const rounds = await getProjectRounds(request, token, projectId);
        const round = rounds.data[rounds.data.length - 1];
        expect(round).toBeDefined();

        const roundId = round.id;
        const roundName = round.round_name;

        // Activate round
        await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);

        // Create talent
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

        // Apply for round
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
        const roundPage = new RoundPage(page);

        await projectPage.openSearchedProject(projectName);
        await roundPage.gotoRoundsTab();

        await roundPage.ensureRoundVisible(roundName);

        await roundPage.clickEditRound(roundName);
        await roundPage.gotoRoundDetailsTab();

        await roundPage.editRound();
        await roundPage.saveEditedRoundData();

        await roundPage.verifyRoundEdited('Edited Automated Round');

        // Cleanup
        await deleteProject(request, token, projectId);
    });

});