import { expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import QuestionPage from "../../pages/casting/owner/question/questionPage";
import { questionLocators } from "../../pages/casting/owner/question/questionPageLocators";
import { validLogin } from "@/test-data/loginData";
import { questionData } from "@/test-data/questionData";
import { openFirstProject } from '../../helpers/projects';
import { urls } from "@/utils/urls";

test.describe('Casting owner create question scenarios', () => {
    test.beforeEach(async ({ page, request }) => {
        await page.goto(urls.casting);
        const login = new LoginPage(page);
        const status = await login.validLoginwithUI(validLogin.email, validLogin.password, request);
        console.log("2FA Status:", status);
        await page.goto(urls.casting + "/projects"); await expect(page).toHaveURL(/projects/);
    });

    // =========================================================
    test('Create new checkbox question with options and verify it appears in questions list', async ({ page, request }) => {
        test.setTimeout(90000);

        const questionPage = new QuestionPage(page);
        const projectId = await openFirstProject(page);
        await questionPage.openProjectById(projectId, { waitForUrl: new RegExp(`/projects/${projectId}`) });
        await questionPage.gotoQuestionsTab();

        // Open question modal
        await questionPage.openCreateQuestion();

        // Continue creating question manually
        await questionPage.fillQuestionText(questionData.questionText);
        await questionPage.selectQuestionType(2);

        // Fill and add checkbox options in correct sequence
        await questionPage.fillCheckboxOption(0, 'Option 1');
        await questionPage.addCheckboxOption();
        await questionPage.fillCheckboxOption(1, 'Option 2');
        await questionPage.addCheckboxOption();
        await questionPage.fillCheckboxOption(2, 'Option 3');

        await questionPage.fillQuestionDescription(questionData.questionDescription);
        await questionPage.toggleRequiredCheckbox(false);
        await questionPage.toggleStatusToggle(true);
        await page.waitForTimeout(2000);

        const rounds = await questionPage.getAvailableRounds();
        if (rounds.length) await questionPage.setQuestionRound();

        const roles = await questionPage.getAvailableRoles();
        if (roles.length) await questionPage.setQuestionRole();

        await questionPage.submitQuestion();
        // small wait for list to refresh then verify
        await page.waitForTimeout(2000);

        expect(await questionPage.isQuestionPresent(questionData.questionText)).toBeTruthy();
    });

    // =========================================================
    test('Create new radio button question with options and verify it appears in questions list', async ({ page, request }) => {
        test.setTimeout(90000);

        const questionPage = new QuestionPage(page);
        const projectId = await openFirstProject(page);
        await questionPage.openProjectById(projectId, { waitForUrl: new RegExp(`/projects/${projectId}`) });
        await questionPage.gotoQuestionsTab();

        await questionPage.createNewQuestion({
            text: questionData.questionText,
            typeIndex: 3,
            options: questionData.radioButtonOptions,
            description: questionData.questionDescription,
            required: true,
            active: true
        });

        const rounds = await questionPage.getAvailableRounds();
        if (rounds.length) await questionPage.setQuestionRound();

        const roles = await questionPage.getAvailableRoles();
        if (roles.length) await questionPage.setQuestionRole();

        await questionPage.submitQuestion();
        // small wait for list to refresh then verify
        await page.waitForTimeout(2000);
        expect(await questionPage.isQuestionPresent(questionData.questionText)).toBeTruthy();
    });

    // =========================================================
    test('Create new dropdown question with options and verify it appears in questions list', async ({ page, request }) => {
        test.setTimeout(90000);

        const questionPage = new QuestionPage(page);
        const projectId = await openFirstProject(page);
        await questionPage.openProjectById(projectId, { waitForUrl: new RegExp(`/projects/${projectId}`) });
        await questionPage.gotoQuestionsTab();
        ;
        await questionPage.createNewQuestion({
            text: questionData.questionText,
            typeIndex: 4,
            options: questionData.dropdownOptions,
            description: questionData.questionDescription,
            required: false,
            active: true
        });

        const rounds = await questionPage.getAvailableRounds();
        if (rounds.length) await questionPage.setQuestionRound();

        const roles = await questionPage.getAvailableRoles();
        if (roles.length) await questionPage.setQuestionRole();

        await questionPage.submitQuestion();
        // small wait for list to refresh then verify
        await page.waitForTimeout(2000);
        expect(await questionPage.isQuestionPresent(questionData.questionDescription)).toBeTruthy();
    });

    // =========================================================
    test('Submitting empty new question form shows validation (required fields)', async ({ page, request }) => {

        const questionPage = new QuestionPage(page);
        await questionPage.gotoQuestionsTab();
        await questionPage.openCreateQuestion();

        // ensure question text is empty
        expect(await page.locator(questionLocators.questionTextInput).inputValue()).toBe('');

        // Click submit with empty required fields
        await page.locator(questionLocators.questionSaveButton).click();

        // modal should remain open and show validation
        await expect(page.locator(questionLocators.questionTextInput)).toBeVisible();

        const ariaInvalid = await page.locator(questionLocators.questionTextInput).getAttribute('aria-invalid');
        if (ariaInvalid !== null) {
            expect(ariaInvalid === 'true' || ariaInvalid === '1').toBeTruthy();
        } else {
            // fallback: look for a required message text
            const msg = await page.locator('div').filter({ hasText: 'Value is required' }).count();
            expect(msg).toBeGreaterThanOrEqual(1);
        }

        // Close the modal
        await questionPage.closeNewQuestionModal();
    });

    // =========================================================
    test('Create new text question with round and role selection', async ({ page, request }) => {
        test.setTimeout(90000);

        const questionPage = new QuestionPage(page);
        const projectId = await openFirstProject(page);
        await questionPage.openProjectById(projectId, { waitForUrl: new RegExp(`/projects/${projectId}`) });
        await questionPage.gotoQuestionsTab();

        // Open question modal
        await questionPage.openCreateQuestion();
        ;
        // Continue creating question manually
        await questionPage.fillQuestionText(questionData.questionText);
        await questionPage.selectQuestionTypeByText("Text");
        await questionPage.fillQuestionDescription(questionData.questionDescription);
        await questionPage.toggleRequiredCheckbox(true);
        await questionPage.toggleStatusToggle(true);

        const rounds = await questionPage.getAvailableRounds();
        if (rounds.length) await questionPage.setQuestionRound();

        const roles = await questionPage.getAvailableRoles();
        if (roles.length) await questionPage.setQuestionRole();

        // Submit the question
        await questionPage.submitQuestion();

        // small wait for list to refresh then verify
        await page.waitForTimeout(10000);

        expect(await questionPage.isQuestionPresent(questionData.questionText)).toBeTruthy();
    });
});
