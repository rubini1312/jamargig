import { APIRequestContext, expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import QuestionPage from "../../pages/casting/owner/question/questionPage";
import { questionLocators } from "../../pages/casting/owner/question/questionPageLocators";
import { validLogin } from "@/test-data/loginData";
import { getQuestionData, questionData } from "@/test-data/questionData";
import { urls } from "@/utils/urls";
import { createRole, deleteAllRoles, deleteRole, getProjectRoles } from "@/helpers/api/casting/roleApi";
import { createProject, deleteProject } from "@/helpers/api/casting/projectApi";
import { createOnlineRound, deleteRound, getProjectRounds } from "@/helpers/api/casting/roundApi";
import { deleteAllQuestions } from "@/helpers/api/casting/questionApi";
import ProjectPage from "@/pages/casting/owner/project/projectPage";
import { getAccessTokenSmartFromCasting } from "@/helpers/api/casting/authApi";

test.describe('Casting owner create question scenarios', () => {
    let token: string;
    let projectId: number;
    let roleId: number;
    let roundId: number;
    let roleName: string;
    let roundName: string;
    let projectName: string;
    let uniqueName: string;

    test.beforeAll(async ({ request }) => {
        token = await getAccessTokenSmartFromCasting(request, validLogin.email);

        const { response } = await createProject(request, token);
        projectId = response.data.id;
        projectName = response.data.title;
        console.log(projectId);

        await createRole(request, token, projectId);
        const roles = await getProjectRoles(request, token, projectId);
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
            await deleteRound(request, token, projectId, roundId);
            await deleteRole(request, token, projectId, roleId);
            await deleteAllQuestions(request, token, projectId);
            await deleteProject(request, token, projectId);
        }
    });

    // =========================================================
    test('Submitting empty new question form shows validation (required fields)', async ({ page, request }) => {

        const questionPage = new QuestionPage(page);
        const projectPage = new ProjectPage(page);
        await projectPage.openSearchedProject(projectName);

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
    test('Create new text question with round and role selection', async ({ page }) => {
        test.setTimeout(90000);

        const questionPage = new QuestionPage(page);
        const projectPage = new ProjectPage(page);

        await projectPage.openSearchedProject(projectName);
        await questionPage.gotoQuestionsTab();

        await questionPage.createNewQuestion({
            text: questionData.questionText,
            typeIndex: 1,
            description: questionData.questionDescription,
            required: true,
            active: true,
            roundNames: [roundName],
            roleNames: [roleName]
        });

        await expect(page.locator(`text=${questionData.questionText}`)).toBeVisible({ timeout: 10000 });
        expect(await questionPage.isQuestionPresent(questionData.questionText)).toBeTruthy();
    });

    // =========================================================
    test('Create new checkbox question with options and verify it appears in questions list', async ({ page }) => {
        test.setTimeout(90000);

        const questionPage = new QuestionPage(page);
        const projectPage = new ProjectPage(page);

        await projectPage.openSearchedProject(projectName);

        await questionPage.openProjectById(projectId, {
            waitForUrl: new RegExp(`/projects/${projectId}`)
        });

        await questionPage.gotoQuestionsTab();

        const questionData = getQuestionData();

        await questionPage.createNewQuestion({
            text: questionData.questionText,
            typeIndex: 2,
            options: ['Option 1', 'Option 2', 'Option 3'],
            description: questionData.questionDescription,
            required: false,
            active: true,
            roundNames: [roundName],
            roleNames: [roleName]
        });

        await expect(page.locator(`text=${questionData.questionText}`)).toBeVisible({ timeout: 10000 });
        expect(await questionPage.isQuestionPresent(questionData.questionText)).toBeTruthy();
    });

    // =========================================================
    test('Create new radio button question with options and verify it appears in questions list', async ({ page }) => {
        test.setTimeout(90000);

        const questionPage = new QuestionPage(page);
        const projectPage = new ProjectPage(page);
        await projectPage.openSearchedProject(projectName);

        await questionPage.openProjectById(projectId, {
            waitForUrl: new RegExp(`/projects/${projectId}`)
        });

        await questionPage.gotoQuestionsTab();
        const questionData = getQuestionData();

        await questionPage.createNewQuestion({
            text: questionData.questionText,
            typeIndex: 3,
            options: questionData.radioButtonOptions,
            description: questionData.questionDescription,
            required: true,
            active: true,
            roundNames: [roundName],
            roleNames: [roleName]
        });

        await expect(page.locator(`text=${questionData.questionText}`)).toBeVisible({ timeout: 10000 });
        expect(await questionPage.isQuestionPresent(questionData.questionText)).toBeTruthy();
    });

    // =========================================================
    test('Create new dropdown question with options and verify it appears in questions list', async ({ page }) => {

        test.setTimeout(90000);

        const questionPage = new QuestionPage(page);
        const projectPage = new ProjectPage(page);

        await projectPage.openSearchedProject(projectName);

        await questionPage.openProjectById(projectId, {
            waitForUrl: new RegExp(`/projects/${projectId}`)
        });

        await questionPage.gotoQuestionsTab();
        const questionData = getQuestionData();

        await questionPage.createNewQuestion({
            text: questionData.questionText,
            typeIndex: 4,
            options: questionData.dropdownOptions,
            description: questionData.questionDescription,
            required: false,
            active: true,
            roundNames: [roundName],
            roleNames: [roleName]
        });

        // wait for list refresh
        await expect(page.locator(`text=${questionData.questionText}`)).toBeVisible({ timeout: 10000 });
        expect(await questionPage.isQuestionPresent(questionData.questionText)).toBeTruthy();
    });


    // =========================================================
    test('Create new media type - image question with options and verify it appears in questions list', async ({ page }) => {
        test.setTimeout(90000);

        const questionPage = new QuestionPage(page);
        const projectPage = new ProjectPage(page);

        await projectPage.openSearchedProject(projectName);

        await questionPage.openProjectById(projectId, {
            waitForUrl: new RegExp(`/projects/${projectId}`)
        });

        await questionPage.gotoQuestionsTab();
        const questionData = getQuestionData();

        await questionPage.createNewQuestion({
            text: questionData.questionText,
            typeIndex: 5,
            mediaOptions: [0],
            description: questionData.questionDescription,
            required: false,
            active: true,
            roundNames: [roundName],
            roleNames: [roleName]
        });

        await expect(page.locator(`text=${questionData.questionText}`)).toBeVisible({ timeout: 10000 });
        expect(await questionPage.isQuestionPresent(questionData.questionText)).toBeTruthy();
    });

    // =========================================================
    test('Create new media type - video question with options and verify it appears in questions list', async ({ page }) => {
        test.setTimeout(90000);

        const questionPage = new QuestionPage(page);
        const projectPage = new ProjectPage(page);

        await projectPage.openSearchedProject(projectName);

        await questionPage.openProjectById(projectId, {
            waitForUrl: new RegExp(`/projects/${projectId}`)
        });

        await questionPage.gotoQuestionsTab();
        const questionData = getQuestionData();

        await questionPage.createNewQuestion({
            text: questionData.questionText,
            typeIndex: 5,
            mediaOptions: [1],
            description: questionData.questionDescription,
            required: false,
            active: true,
            roundNames: [roundName],
            roleNames: [roleName]
        });

        await expect(page.locator(`text=${questionData.questionText}`)).toBeVisible({ timeout: 10000 });
        expect(await questionPage.isQuestionPresent(questionData.questionText)).toBeTruthy();
    });

    // =========================================================
    test('Create new media type - audio question with options and verify it appears in questions list', async ({ page }) => {
        test.setTimeout(90000);

        const questionPage = new QuestionPage(page);
        const projectPage = new ProjectPage(page);

        await projectPage.openSearchedProject(projectName);

        await questionPage.openProjectById(projectId, {
            waitForUrl: new RegExp(`/projects/${projectId}`)
        });

        await questionPage.gotoQuestionsTab();
        const questionData = getQuestionData();

        await questionPage.createNewQuestion({
            text: questionData.questionText,
            typeIndex: 5,
            mediaOptions: [2],
            description: questionData.questionDescription,
            required: false,
            active: true,
            roundNames: [roundName],
            roleNames: [roleName]
        });

        await expect(page.locator(`text=${questionData.questionText}`)).toBeVisible({ timeout: 10000 });
        expect(await questionPage.isQuestionPresent(questionData.questionText)).toBeTruthy();
    });

    // =========================================================
    test('Create new media type - pdf question with options and verify it appears in questions list', async ({ page }) => {
        test.setTimeout(90000);

        const questionPage = new QuestionPage(page);
        const projectPage = new ProjectPage(page);

        await projectPage.openSearchedProject(projectName);

        await questionPage.openProjectById(projectId, {
            waitForUrl: new RegExp(`/projects/${projectId}`)
        });

        await questionPage.gotoQuestionsTab();
        const questionData = getQuestionData();

        await questionPage.createNewQuestion({
            text: questionData.questionText,
            typeIndex: 5, // Media type
            mediaOptions: [3],
            description: questionData.questionDescription,
            required: false,
            active: true,
            roundNames: [roundName],
            roleNames: [roleName]
        });

        await expect(page.locator(`text=${questionData.questionText}`)).toBeVisible({ timeout: 10000 });
        expect(await questionPage.isQuestionPresent(questionData.questionText)).toBeTruthy();
    });

    // =========================================================
    test('Create new media type - all types question with options and verify it appears in questions list', async ({ page }) => {
        test.setTimeout(90000);

        const questionPage = new QuestionPage(page);
        const projectPage = new ProjectPage(page);

        await projectPage.openSearchedProject(projectName);

        await questionPage.openProjectById(projectId, {
            waitForUrl: new RegExp(`/projects/${projectId}`)
        });

        await questionPage.gotoQuestionsTab();
        const questionData = getQuestionData();

        await questionPage.createNewQuestion({
            text: questionData.questionText,
            typeIndex: 5,
            mediaOptions: [0, 1, 2, 3],
            description: questionData.questionDescription,
            required: false,
            active: true,
            roundNames: [roundName],
            roleNames: [roleName]
        });

        await expect(page.locator(`text=${questionData.questionText}`)).toBeVisible({ timeout: 10000 });
        expect(await questionPage.isQuestionPresent(questionData.questionText)).toBeTruthy();
    });


});
