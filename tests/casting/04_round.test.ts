import { APIRequestContext, expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import RoundPage from "../../pages/casting/owner/round/roundPage";
import { roundLocators } from "../../pages/casting/owner/round/roundPageLocators";
import { validLogin } from "@/test-data/loginData";
import { urls } from "@/utils/urls";
import { getAccessTokenSmart } from "@/helpers/api/authApi";
import { createProject, deleteProject } from "@/helpers/api/projectApi";
import { createRole, deleteAllRoles } from "@/helpers/api/roleApi";
import { deleteAllRounds } from "@/helpers/api/roundApi";
import ProjectPage from "@/pages/casting/owner/project/projectPage";

test.describe('Casting owner create round scenarios', () => {
    let token: string;
    let projectId: number;
    let projectName: string;
    let uniqueName: string;

    test.beforeAll(async ({request }) => {
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
            await deleteAllRoles(request, token, projectId);
            await deleteAllRounds(request, token, projectId);
            await deleteProject(request, token, projectId);
        }
    });


    // =========================================================
    test('Create new online round and verify it appears in rounds list', async ({ page, request }) => {
        test.setTimeout(90000);

        const roundPage = new RoundPage(page);
        const projectPage = new ProjectPage(page);
        projectPage.openSearchedProject(projectName);
        await roundPage.openProjectById(projectId, { waitForUrl: new RegExp(`/projects/${projectId}`) });
        await roundPage.gotoRoundsTab();

        const roundName = `Automation Round ${Date.now()}`;
        await roundPage.createNewRound({
            name: roundName,
            typeIndex: 1,
            timezone: 'Asia/Colombo',
            roundDateFrom: '2026-01-01 13:40:30',
            roundDateTo: '2026-01-31 13:40:30',
            submissionTypeIndex: 1,
            displayApplicationNumberIndex: 1,
            submissionDateFrom: '2026-01-01 13:40:30',
            submissionDateTo: '2026-01-31 13:40:30',
            assessmentDateFrom: '2026-01-20 13:40:30',
            assessmentDateTo: '2026-01-30 13:40:30',
            instructionHtml: 'Automated round instruction for testing purposes -Audition round descriptions specify the requirements for each stage of the casting process, which can vary by discipline and project. They generally outline the material to prepare, the required format (e.g., self-tape, in-person), and the specific skills being evaluated'
        });

        // small wait for list to refresh then verify
        await page.waitForTimeout(2000);
        expect(await roundPage.isRoundPresent(roundName)).toBeTruthy();
    });

    // =========================================================
    test('Create new In-person round and verify it appears in rounds list', async ({ page, request }) => {
        test.setTimeout(90000);

        const roundPage = new RoundPage(page);
        const projectPage = new ProjectPage(page);
        projectPage.openSearchedProject(projectName);
        await roundPage.openProjectById(projectId, { waitForUrl: new RegExp(`/projects/${projectId}`) });
        await roundPage.gotoRoundsTab();

        const roundName = `Automation Round ${Date.now()}`;
        await roundPage.createNewRound({
            name: roundName,
            typeIndex: 2,
            timezone: 'Asia/Colombo',
            location: 'Colombo, LKA',
            radius: '50',
            units: 'Miles',
            defaultNumberOfTalents: '20',
            minimumNumberOfTalents: '5',
            roundDateFrom: '2026-01-01 13:40:30',
            roundDateTo: '2026-01-31 13:40:30',
            submissionTypeIndex: 1,
            displayApplicationNumberIndex: 1,
            submissionDateFrom: '2026-01-01 13:40:30',
            submissionDateTo: '2026-01-31 13:40:30',
            assessmentDateFrom: '2026-01-20 13:40:30',
            assessmentDateTo: '2026-01-30 13:40:30',
            instructionHtml: 'Automated round instruction for testing purposes -Audition round descriptions specify the requirements for each stage of the casting process, which can vary by discipline and project. They generally outline the material to prepare, the required format (e.g., self-tape, in-person), and the specific skills being evaluated'
        });
        roundPage.setLocation("Colombo, LKA")

        // small wait for list to refresh then verify
        await page.waitForTimeout(2000);
        expect(await roundPage.isRoundPresent(roundName)).toBeTruthy();
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

        // Click submit with empty required fields
        await page.locator(roundLocators.roundNewSubmitButton).click();

        // modal should remain open and show validation
        await expect(page.locator(roundLocators.roundNameInput)).toBeVisible();

        const ariaInvalid = await page.locator(roundLocators.roundNameInput).getAttribute('aria-invalid');
        if (ariaInvalid !== null) {
            expect(ariaInvalid === 'true' || ariaInvalid === '1').toBeTruthy();
        } else {
            // fallback: look for a required message text
            //const msg = await page.locator('text=required, text=Required, text=Value is required').count();
            const msg = await page.locator('div').filter({ hasText: 'Value is required' }).count();
            expect(msg).toBeGreaterThanOrEqual(3);
        }

        // Close the modal
        await roundPage.closeNewRoundModal();
    });
});
