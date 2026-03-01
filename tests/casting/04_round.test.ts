import { APIRequestContext, expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import RoundPage from "../../pages/casting/owner/round/roundPage";
import { roundLocators } from "../../pages/casting/owner/round/roundPageLocators";
import { validLogin } from "@/test-data/loginData";
import { urls } from "@/utils/urls";
import { getAccessTokenSmart } from "@/helpers/api/authApi";
import { createProject, deleteProject } from "@/helpers/api/projectApi";
import { createRole, deleteAllRoles, deleteRole } from "@/helpers/api/roleApi";
import { deleteAllRounds } from "@/helpers/api/roundApi";
import ProjectPage from "@/pages/casting/owner/project/projectPage";
import { onlineRoundData, inPersonRoundData } from "@/test-data/roundData";

test.describe('Casting owner create round scenarios', () => {
    let token: string;
    let projectId: number;
    let projectName: string;
    let uniqueName: string;

    test.beforeAll(async ({ request }) => {
        token = await getAccessTokenSmart(request, validLogin.email);

        const { response } = await createProject(request, token);
        projectId = response.data.id;
        projectName = response.data.title;
        console.log(projectId);
        await createRole(request, token, projectId);

        uniqueName = `Automation Talent-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
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
            await deleteAllRounds(request, token, projectId);
            await deleteAllRoles(request, token, projectId);
            await deleteProject(request, token, projectId);
        }
    });


    // =========================================================
    test('Submitting empty New Round form shows validation (required fields)', async ({ page, request }) => {

        const roundPage = new RoundPage(page);
        const projectPage = new ProjectPage(page);
        projectPage.openSearchedProject(projectName);
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

        // Close the modal
        await roundPage.closeNewRoundModal();
    });

    // =========================================================
    test('Create new online-anyone can submit round and verify it appears in rounds list', async ({ page, request }) => {
        test.setTimeout(90000);

        const roundPage = new RoundPage(page);
        const projectPage = new ProjectPage(page);
        projectPage.openSearchedProject(projectName);
        await roundPage.openProjectById(projectId, { waitForUrl: new RegExp(`/projects/${projectId}`) });
        await roundPage.gotoRoundsTab();

        const roundName = `Automation Online-Round ${Date.now()}`;
        const roundData = onlineRoundData(1, roundName);

        await roundPage.createNewRound(roundData);
        await page.waitForTimeout(2000);
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
        projectPage.openSearchedProject(projectName);
        await roundPage.openProjectById(projectId, { waitForUrl: new RegExp(`/projects/${projectId}`) });
        await roundPage.gotoRoundsTab();

        const roundName = `Automation Online-Round ${Date.now()}`;
        const roundData = onlineRoundData(2, roundName);

        await roundPage.createNewRound(roundData);
        await page.waitForTimeout(2000);
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
        projectPage.openSearchedProject(projectName);
        await roundPage.openProjectById(projectId, { waitForUrl: new RegExp(`/projects/${projectId}`) });
        await roundPage.gotoRoundsTab();

        const roundName = `Automation Online-Round ${Date.now()}`;
        const roundData = onlineRoundData(3, roundName);

        await roundPage.createNewRound(roundData);
        await page.waitForTimeout(2000);
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
        projectPage.openSearchedProject(projectName);
        await roundPage.openProjectById(projectId, { waitForUrl: new RegExp(`/projects/${projectId}`) });
        await roundPage.gotoRoundsTab();

        const roundName = `Automation InPerson-Round ${Date.now()}`;
        const roundData = onlineRoundData(1, roundName);

        await roundPage.createNewRound(roundData);
        await page.waitForTimeout(2000);
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
        projectPage.openSearchedProject(projectName);
        await roundPage.openProjectById(projectId, { waitForUrl: new RegExp(`/projects/${projectId}`) });
        await roundPage.gotoRoundsTab();

        const roundName = `Automation InPerson-Round ${Date.now()}`;
        const roundData = onlineRoundData(2, roundName);

        await roundPage.createNewRound(roundData);
        await page.waitForTimeout(2000);
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
        projectPage.openSearchedProject(projectName);
        await roundPage.openProjectById(projectId, { waitForUrl: new RegExp(`/projects/${projectId}`) });
        await roundPage.gotoRoundsTab();

        const roundName = `Automation InPerson-Round ${Date.now()}`;
        const roundData = onlineRoundData(3, roundName);

        await roundPage.createNewRound(roundData);
        await page.waitForTimeout(2000);
        await roundPage.verifyRoundRow({
            name: roundName,
            submissionType: "Internal submission",
            roundType: "Online",
            status: "Upcoming"
        });
    });
});
