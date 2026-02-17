import { expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import QuestionPage from "../../pages/casting/owner/question/questionPage";
import { questionLocators } from "../../pages/casting/owner/question/questionPageLocators";
import * as data from "../../test-data/test-data.json";
import { openFirstProject } from '../../helpers/projects';
import { urls } from "@/utils/urls";
import { request } from "http";

test.describe.serial('Casting owner create question scenarios', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(urls.casting);
    });

    test('Create new checkbox question with options and verify it appears in questions list', async ({ page, request}) => {
        test.setTimeout(90000);
        const login = new LoginPage(page);
        await login.validLogin(data.email, data.password, request);
        await expect(page).toHaveURL(/projects/);

        const questionPage = new QuestionPage(page);
        const projectId = await openFirstProject(page);
        await questionPage.openProjectById(projectId, { waitForUrl: new RegExp(`/projects/${projectId}`) });
        await questionPage.gotoQuestionsTab();

        // Open question modal
        await questionPage.openCreateQuestion();

        const questionText = `Automation Checkbox Question ${Date.now()}`;
        // Continue creating question manually
        await questionPage.fillQuestionText(questionText);
        await questionPage.selectQuestionType(2);
        
        // Fill and add checkbox options in correct sequence
        await questionPage.fillCheckboxOption(0, 'Option 1');
        await questionPage.addCheckboxOption();
        await questionPage.fillCheckboxOption(1, 'Option 2');
        await questionPage.addCheckboxOption();
        await questionPage.fillCheckboxOption(2, 'Option 3');
        
        await questionPage.fillQuestionDescription('Automated checkbox question for testing purposes - Select multiple options that apply.');
        await questionPage.toggleRequiredCheckbox(false);
        await questionPage.toggleStatusToggle(true);
        await page.waitForTimeout(2000);

        const rounds = await questionPage.getAvailableRounds();
        if (rounds.length) await questionPage.setQuestionRound();

        const roles = await questionPage.getAvailableRoles();
        if (roles.length) await questionPage.setQuestionRole();
        // Submit without round/role - they are not truly required
        await questionPage.submitQuestion();

        // small wait for list to refresh then verify
        await page.waitForTimeout(2000);

        expect(await questionPage.isQuestionPresent(questionText)).toBeTruthy();
    });

    test('Create new radio button question with options and verify it appears in questions list', async ({ page, request }) => {
        test.setTimeout(90000);
        const login = new LoginPage(page);
        await login.validLogin(data.email, data.password, request);
        await expect(page).toHaveURL(/projects/);

        const questionPage = new QuestionPage(page);
        const projectId = await openFirstProject(page);
        await questionPage.openProjectById(projectId, { waitForUrl: new RegExp(`/projects/${projectId}`) });
        await questionPage.gotoQuestionsTab();

        const questionText = `Automation Radio Question ${Date.now()}`;
        await questionPage.createNewQuestion({
            text: questionText,
            typeIndex: 3,
            options: ['Yes', 'No', 'Maybe'],
            description: 'Automated radio button question for testing purposes - Select one option only.',
            required: true,
            active: true
        });

        const rounds = await questionPage.getAvailableRounds();
        if (rounds.length) await questionPage.setQuestionRound();

        const roles = await questionPage.getAvailableRoles();
        if (roles.length) await questionPage.setQuestionRole();
        // Submit without round/role - they are not truly required
        await questionPage.submitQuestion();

        // small wait for list to refresh then verify
        await page.waitForTimeout(2000);


        expect(await questionPage.isQuestionPresent(questionText)).toBeTruthy();
    });

    test('Create new dropdown question with options and verify it appears in questions list', async ({ page, request }) => {
        test.setTimeout(90000);
        const login = new LoginPage(page);
        await login.validLogin(data.email, data.password, request);
        await expect(page).toHaveURL(/projects/);

        const questionPage = new QuestionPage(page);
        const projectId = await openFirstProject(page);
        await questionPage.openProjectById(projectId, { waitForUrl: new RegExp(`/projects/${projectId}`) });
        await questionPage.gotoQuestionsTab();

        const questionText = `Automation Dropdown Question ${Date.now()}`;
        await questionPage.createNewQuestion({
            text: questionText,
            typeIndex: 4,
            options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
            description: 'Automated dropdown question for testing purposes - Select your experience level from the dropdown.',
            required: false,
            active: true
        });

        const rounds = await questionPage.getAvailableRounds();
        if (rounds.length) await questionPage.setQuestionRound();

        const roles = await questionPage.getAvailableRoles();
        if (roles.length) await questionPage.setQuestionRole();
        // Submit without round/role - they are not truly required
        await questionPage.submitQuestion();

        // small wait for list to refresh then verify
        await page.waitForTimeout(2000);


        expect(await questionPage.isQuestionPresent(questionText)).toBeTruthy();
    });

    test('Submitting empty New Question form shows validation (required fields)', async ({ page, request }) => {
        const login = new LoginPage(page);
        await login.validLogin(data.email, data.password, request);
        await expect(page).toHaveURL(/projects/);

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

    test('Create new question with round and role selection', async ({ page, request }) => {
        test.setTimeout(90000);
        const login = new LoginPage(page);
        await login.validLogin(data.email, data.password, request);
        await expect(page).toHaveURL(/projects/);

        const questionPage = new QuestionPage(page);
        const projectId = await openFirstProject(page);
        await questionPage.openProjectById(projectId, { waitForUrl: new RegExp(`/projects/${projectId}`) });
        await questionPage.gotoQuestionsTab();

        // Open question modal
        await questionPage.openCreateQuestion();

        const questionText = `Automation Question with Round and Role ${Date.now()}`;
        // Continue creating question manually
        await questionPage.fillQuestionText(questionText);
        await questionPage.selectQuestionTypeByText("Text");
        await questionPage.fillQuestionDescription('Automated question with round and role selection for testing purposes.');
        await questionPage.toggleRequiredCheckbox(true);
        await questionPage.toggleStatusToggle(true);

        const rounds = await questionPage.getAvailableRounds();
        if (rounds.length) await questionPage.setQuestionRound();

        const roles = await questionPage.getAvailableRoles();
        if (roles.length) await questionPage.setQuestionRole();

        // Submit the question
        await questionPage.submitQuestion();

        // small wait for list to refresh then verify
        await page.waitForTimeout(2000);

        expect(await questionPage.isQuestionPresent(questionText)).toBeTruthy();
    });
});
