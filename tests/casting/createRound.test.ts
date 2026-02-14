import { expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import RoundPage from "../../pages/casting/owner/round/roundPage";
import { roundLocators } from "../../pages/casting/owner/round/roundPageLocators";
import * as data from "../../test-data/test-data.json";
import { openFirstProject } from '../../helpers/projects';
import { urls } from "@/utils/urls";

test.describe('Casting owner create round scenarios', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(urls.casting);
    });

    test('Create new online round and verify it appears in rounds list', async ({ page }) => {
        test.setTimeout(90000);
        const login = new LoginPage(page);
        await login.validLogin(data.email, data.password);
        await expect(page).toHaveURL(/projects/);

        const roundPage = new RoundPage(page);
        const projectId = await openFirstProject(page);
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

    test('Create new In-person round and verify it appears in rounds list', async ({ page }) => {
        test.setTimeout(90000);
        const login = new LoginPage(page);
        await login.validLogin(data.email, data.password);
        await expect(page).toHaveURL(/projects/);

        const roundPage = new RoundPage(page);
        const projectId = await openFirstProject(page);
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

        // small wait for list to refresh then verify
        await page.waitForTimeout(2000);
        expect(await roundPage.isRoundPresent(roundName)).toBeTruthy();
    });

    test('Submitting empty New Round form shows validation (required fields)', async ({ page }) => {
        const login = new LoginPage(page);
        await login.validLogin(data.email, data.password);
        await expect(page).toHaveURL(/projects/);

        const roundPage = new RoundPage(page);
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
