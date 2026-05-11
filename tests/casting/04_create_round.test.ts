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
import { onlineRoundData, inPersonRoundData } from "@/test-data/roundData";
import { getTalentAccessToken } from "@/helpers/api/talent/authApi";
import { generateEmail } from "@/test-data/random-data";
import { registerTalent } from "@/helpers/api/talent/talentApi";
import { getAccessTokenSmartFromCasting } from "@/helpers/api/casting/authApi";
import { applyRegistrationConfig, deleteTalent, getFieldsByPageId, getTalentUuidByName } from "@/helpers/api/casting/talentApi";
import { apiConfig } from "@/test-data/dataModelConfig";

test.describe('Casting owner create round scenarios', () => {
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

    test.beforeEach(async ({ page }) => {
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
    test('Submitting empty New Round form shows validation (required fields)', async ({ page, request }) => {

        const roundPage = new RoundPage(page);
        const projectPage = new ProjectPage(page);

        await projectPage.openSearchedProject(projectName);

        await roundPage.gotoRoundsTab();
        await roundPage.openCreateRound();

        // ensure round name empty
        expect(await page.locator(roundLocators.roundNameInput).inputValue()).toBe('');
        await page.locator(roundLocators.roundNewSubmitButton).click();
        await expect(page.locator(roundLocators.roundNameInput)).toBeVisible();

        const ariaInvalid = await page.locator(roundLocators.roundNameInput).getAttribute('aria-invalid');
        if (ariaInvalid !== null) {
            expect(ariaInvalid === 'true' || ariaInvalid === '1').toBeTruthy();
        } else {
            const msg = await page.locator('div').filter({ hasText: 'Value is required' }).count();
            expect(msg).toBeGreaterThanOrEqual(3);
        }

    });

    // =========================================================
    test('Create new online-anyone can submit round and verify it appears in rounds list', async ({ page, request }) => {
        test.setTimeout(90000);

        const roundPage = new RoundPage(page);
        const projectPage = new ProjectPage(page);
        await projectPage.openSearchedProject(projectName);

        await roundPage.gotoRoundsTab();

        const roundName = `Automation Online-Round ${Date.now()}`;
        const roundData = onlineRoundData(1, roundName);

        await roundPage.createNewRound(roundData);
        await expect(
            page.locator(`text=${roundName}`)
        ).toBeVisible({ timeout: 10000 });

        await roundPage.verifyRoundRow({
            name: roundName,
            submissionType: "Any one can submit",
            roundType: "Online",
            status: "Upcoming"
        });
    });

    // =========================================================
    test('Create new online-invite only submission round and verify it appears in rounds list', async ({ page, request }) => {
        test.setTimeout(90000);

        const roundPage = new RoundPage(page);
        const projectPage = new ProjectPage(page);
        await projectPage.openSearchedProject(projectName);

        await roundPage.gotoRoundsTab();

        const roundName = `Automation Online-Round ${Date.now()}`;
        const roundData = onlineRoundData(2, roundName);

        await roundPage.createNewRound(roundData);
        await expect(
            page.locator(`text=${roundName}`)
        ).toBeVisible({ timeout: 10000 });

        await roundPage.verifyRoundRow({
            name: roundName,
            submissionType: "Invite only submission",
            roundType: "Online",
            status: "Upcoming"
        });
    });

    // =========================================================
    test('Create new online-internal round and verify it appears in rounds list', async ({ page, request }) => {
        test.setTimeout(90000);

        const roundPage = new RoundPage(page);
        const projectPage = new ProjectPage(page);
        await projectPage.openSearchedProject(projectName);

        await roundPage.gotoRoundsTab();

        const roundName = `Automation Online-Round ${Date.now()}`;
        const roundData = onlineRoundData(3, roundName);

        await roundPage.createNewRound(roundData);
        await expect(
            page.locator(`text=${roundName}`)
        ).toBeVisible({ timeout: 10000 });

        await roundPage.verifyRoundRow({
            name: roundName,
            submissionType: "Internal submission",
            roundType: "Online",
            status: "Upcoming"
        });
    });

    // =========================================================
    test('Create new InPerson-any one can submit round and verify it appears in rounds list', async ({ page, request }) => {
        test.setTimeout(90000);

        const roundPage = new RoundPage(page);
        const projectPage = new ProjectPage(page);
        await projectPage.openSearchedProject(projectName);

        await roundPage.gotoRoundsTab();

        const roundName = `Automation InPerson-Round ${Date.now()}`;
        const roundData = onlineRoundData(1, roundName);

        await roundPage.createNewRound(roundData);
        await expect(
            page.locator(`text=${roundName}`)
        ).toBeVisible({ timeout: 10000 });

        await roundPage.verifyRoundRow({
            name: roundName,
            submissionType: "Any one can submit",
            roundType: "Online",
            status: "Upcoming"
        });
    });

    // =========================================================
    test('Create new InPerson-invite only submission round and verify it appears in rounds list', async ({ page, request }) => {
        test.setTimeout(90000);

        const roundPage = new RoundPage(page);
        const projectPage = new ProjectPage(page);
        await projectPage.openSearchedProject(projectName);

        await roundPage.gotoRoundsTab();

        const roundName = `Automation InPerson-Round ${Date.now()}`;
        const roundData = onlineRoundData(2, roundName);

        await roundPage.createNewRound(roundData);
        await expect(
            page.locator(`text=${roundName}`)
        ).toBeVisible({ timeout: 10000 });

        await roundPage.verifyRoundRow({
            name: roundName,
            submissionType: "Invite only submission",
            roundType: "Online",
            status: "Upcoming"
        });
    });

    // =========================================================
    test('Create new InPerson-internal round and verify it appears in rounds list', async ({ page, request }) => {
        test.setTimeout(90000);

        const roundPage = new RoundPage(page);
        const projectPage = new ProjectPage(page);
        await projectPage.openSearchedProject(projectName);

        await roundPage.gotoRoundsTab();

        const roundName = `Automation InPerson-Round ${Date.now()}`;
        const roundData = onlineRoundData(3, roundName);

        await roundPage.createNewRound(roundData);
        await expect(
            page.locator(`text=${roundName}`)
        ).toBeVisible({ timeout: 10000 });

        await roundPage.verifyRoundRow({
            name: roundName,
            submissionType: "Internal submission",
            roundType: "Online",
            status: "Upcoming"
        });
    });

});



