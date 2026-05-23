import { APIRequestContext, expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import RoundPage from "../../pages/casting/owner/round/roundPage";
import { roundLocators } from "../../pages/casting/owner/round/roundPageLocators";
import { validLogin } from "@/test-data/loginData";
import { urls } from "@/utils/urls";
import { createProject, deleteProject } from "@/helpers/api/casting/projectApi";
import { createRole, deleteAllRoles, deleteRole, getProjectRoles } from "@/helpers/api/casting/roleApi";
import { createOnlineRound, deleteAllRounds, getProjectRounds, updateRoundSubmissionStatus } from "@/helpers/api/casting/roundApi";
import ProjectPage from "@/pages/casting/owner/project/projectPage";
import { getTalentAccessToken } from "@/helpers/api/talent/authApi";
import { generateEmail } from "@/test-data/random-data";
import { registerTalent } from "@/helpers/api/talent/talentApi";
import { getAccessTokenSmartFromCasting } from "@/helpers/api/casting/authApi";
import { applyRegistrationConfig, deleteTalent, getFieldsByPageId, getTalentUuidByName } from "@/helpers/api/casting/talentApi";
import { apiConfig } from "@/test-data/dataModelConfig";

test.describe('Casting owner invite talent scenarios', () => {
    let token: string;
    let projectId: number;
    let projectName: string;
    let uniqueName: string;

    test.beforeAll(async ({ request }) => {
        token = await getAccessTokenSmartFromCasting(request, validLogin.email);

        const { response } = await createProject(request, token);
        projectId = response.data.id;
        projectName = response.data.title;
        console.log(projectId);
        await createRole(request, token, projectId);
        uniqueName = `Automation Talent-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
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
            await deleteAllRounds(request, token, projectId);
            await deleteAllRoles(request, token, projectId);
            await deleteProject(request, token, projectId);
        }
    });



    // =========================================================
    test('Should validate user input in invite talent functionality via round', async ({ page, request }) => {

        test.setTimeout(90000);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[0];
        expect(role).toBeDefined();

        const roleId = role.id;
        const roleName = role.name;

        await createOnlineRound(request, token, projectId, roleId);

        const rounds = await getProjectRounds(request, token, projectId);
        const round = rounds.data[0];
        expect(round).toBeDefined();

        const roundId = round.id;
        const roundName = round.round_name;

        await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);
        await applyRegistrationConfig(request, token, apiConfig);

        await expect.poll(async () => {
            const f = await getFieldsByPageId(request, 1, token);
            return f.length;
        }).toBeGreaterThan(0);

        const talentEmail = generateEmail();
        const talentToken = await getTalentAccessToken(request, talentEmail);

        const talentName = "AutoTalent_" + Date.now();

        const result = await registerTalent(request, talentToken, talentName);
        expect(result).toBeTruthy();

        const roundPage = new RoundPage(page);
        const projectPage = new ProjectPage(page);

        await projectPage.openSearchedProject(projectName);

        await roundPage.gotoRoundsTab();

        console.log("Round name:", roundName);

        await roundPage.openSearchedRound(roundName);

        await roundPage.clickInviteTalent();

        await roundPage.selectSearchedTalent(talentName);
        await roundPage.clickAddToRound();

        await roundPage.clickSend();
        await expect(page.locator(roundLocators.valueRequiredErrorMsg_inviteTalent)).toContainText('Value is required');

        await roundPage.setTalentRole(roleName);
        await roundPage.clickSend();
        await expect(page.locator(roundLocators.invalidTalentMessageError_inviteTalent)).toContainText("Please update message and remove 'Enter message here' before sending");

        await roundPage.clearDeafultMsg();
        await roundPage.clickSend();
        await expect(page.locator(roundLocators.valueRequiredErrorMsg_inviteTalent)).toContainText('Value is required');

        const uuid = await getTalentUuidByName(request, token, talentName)
        await deleteTalent(request, token, uuid);
        await deleteAllRounds(request, token, projectId);

    });


    // =========================================================
    test('Invite talent and verify invited talent appears in the list', async ({ page, request }) => {

        test.setTimeout(90000);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[0];
        expect(role).toBeDefined();

        const roleId = role.id;
        const roleName = role.name;

        await createOnlineRound(request, token, projectId, roleId);

        const rounds = await getProjectRounds(request, token, projectId);
        const round = rounds.data[0];
        expect(round).toBeDefined();

        const roundId = round.id;
        const roundName = round.round_name;

        await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);
        await applyRegistrationConfig(request, token, apiConfig);

        await expect.poll(async () => {
            const f = await getFieldsByPageId(request, 1, token);
            return f.length;
        }).toBeGreaterThan(0);

        const talentEmail = generateEmail();
        const talentToken = await getTalentAccessToken(request, talentEmail);

        const talentName = "AutoTalent_" + Date.now();

        const result = await registerTalent(request, talentToken, talentName);
        expect(result).toBeTruthy();

        const roundPage = new RoundPage(page);
        const projectPage = new ProjectPage(page);

        await projectPage.openSearchedProject(projectName);

        await roundPage.gotoRoundsTab();

        console.log("Round name:", roundName);

        await roundPage.openSearchedRound(roundName);

        await roundPage.clickInviteTalent();

        await roundPage.selectSearchedTalent(talentName);
        await roundPage.clickAddToRound();

        await roundPage.setTalentRole(roleName);
        await roundPage.enterTalentMessage("Automated Talent Invitation Message");

        await roundPage.clickSend();
        await expect(page.getByText('Send a Message to Invited Talent')).toBeHidden();

        //verify 
        await expect(page.locator(roundLocators.invitedTalentCard_title)).toContainText(talentName);

        const status = page.getByText('Invited - Pending application');

        await status.waitFor({ state: 'visible' });
        await expect(status).toHaveText('Invited - Pending application');

        const uuid = await getTalentUuidByName(request, token, talentName)
        await deleteTalent(request, token, uuid);

    });
});
