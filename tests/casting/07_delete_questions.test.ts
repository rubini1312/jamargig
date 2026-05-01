import { getAccessTokenSmartFromCasting } from "@/helpers/api/casting/authApi";
import { createProject, deleteProject, publishProject } from "@/helpers/api/casting/projectApi";
import { createAvailabilityQuestion, createCheckboxQuestion, createDropdownQuestion, createMediaQuestion, createRadioQuestion, createTextQuestion, deleteAllQuestions } from "@/helpers/api/casting/questionApi";
import { createRole, deleteRole, getProjectRoles } from "@/helpers/api/casting/roleApi";
import { createOnlineRound, deleteRound, getProjectRounds, updateRoundSubmissionStatus } from "@/helpers/api/casting/roundApi";
import { validLogin } from "@/test-data/loginData";
import { urls } from "@/utils/urls";
import test, { expect } from "playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import QuestionPage from "@/pages/casting/owner/question/questionPage";
import ProjectPage from "@/pages/casting/owner/project/projectPage";
import { questionLocators } from "@/pages/casting/owner/question/questionPageLocators";
import { applyForRound, registerTalent } from "@/helpers/api/talent/talentApi";
import { generateEmail } from "@/test-data/random-data";
import { getTalentAccessToken } from "@/helpers/api/talent/authApi";


test.describe('Casting owner delete question scenarios', () => {
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


    });

    test.beforeEach(async ({ page, request }) => {
        await page.goto(urls.casting);
        const login = new LoginPage(page);
        const status = await login.validLoginwithUI(validLogin.email, validLogin.password, request);
        console.log("2FA Status:", status);
        await page.goto(urls.casting + "/projects"); await expect(page).toHaveURL(/projects/);
    });

    // =========================================================
    test('should delete active question when project is inactive and round is closed', async ({ page, request }) => {

        test.setTimeout(120000);

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

        // text Questions
        await createTextQuestion(
            request, token, projectId, roundId, roleId,
            "Tell us about yourself"
        );

        const questionPage = new QuestionPage(page);
        const projectPage = new ProjectPage(page);
        await projectPage.openSearchedProject(projectName);
        await questionPage.gotoQuestionsTab();

        await questionPage.clickDeleteButton();
        await questionPage.clickDeleteConfirmationButton();
        await expect(page.locator(questionLocators.emptyQuestionTable)).toContainText('No Data');


        //checkbox question
        await createCheckboxQuestion(
            request, token, projectId, roundId, roleId,
            "Select your skills",
            ["Acting", "Singing", "Dancing"]
        );

        await expect(async () => {
            const deleteBtn = page.locator(questionLocators.deleteBtn);

            if (!(await deleteBtn.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
            }

            await expect(deleteBtn).toBeVisible();

        }).toPass({ timeout: 15000 });

        await questionPage.clickDeleteButton();
        await questionPage.clickDeleteConfirmationButton();
        await expect(page.locator(questionLocators.emptyQuestionTable)).toContainText('No Data');



        //radio question
        await createRadioQuestion(
            request, token, projectId, roundId, roleId,
            "Do you have acting experience?",
            ["Yes", "No"]
        );

        await expect(async () => {
            const deleteBtn = page.locator(questionLocators.deleteBtn);

            if (!(await deleteBtn.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
            }

            await expect(deleteBtn).toBeVisible();

        }).toPass({ timeout: 15000 });

        await questionPage.clickDeleteButton();
        await questionPage.clickDeleteConfirmationButton();
        await expect(page.locator(questionLocators.emptyQuestionTable)).toContainText('No Data');


        //dropdown question
        await createDropdownQuestion(
            request, token, projectId, roundId, roleId,
            "Select your country",
            ["USA", "UK", "Canada"]
        );

        await expect(async () => {
            const deleteBtn = page.locator(questionLocators.deleteBtn);

            if (!(await deleteBtn.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
            }

            await expect(deleteBtn).toBeVisible();

        }).toPass({ timeout: 15000 });

        await questionPage.clickDeleteButton();
        await questionPage.clickDeleteConfirmationButton();
        await expect(page.locator(questionLocators.emptyQuestionTable)).toContainText('No Data');

        //media question - image 
        await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your profile photo",
            [1]
        );

        await expect(async () => {
            const deleteBtn = page.locator(questionLocators.deleteBtn);

            if (!(await deleteBtn.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
            }

            await expect(deleteBtn).toBeVisible();

        }).toPass({ timeout: 15000 });

        await questionPage.clickDeleteButton();
        await questionPage.clickDeleteConfirmationButton();
        await expect(page.locator(questionLocators.emptyQuestionTable)).toContainText('No Data');


        //media question - audio
        await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your audio clip",
            [2]
        );

        await expect(async () => {
            const deleteBtn = page.locator(questionLocators.deleteBtn);

            if (!(await deleteBtn.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
            }

            await expect(deleteBtn).toBeVisible();

        }).toPass({ timeout: 15000 });

        await questionPage.clickDeleteButton();
        await questionPage.clickDeleteConfirmationButton();
        await expect(page.locator(questionLocators.emptyQuestionTable)).toContainText('No Data');


        //media question - pdf
        await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your proposal pdf version",
            [4]
        );

        await expect(async () => {
            const deleteBtn = page.locator(questionLocators.deleteBtn);

            if (!(await deleteBtn.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
            }

            await expect(deleteBtn).toBeVisible();

        }).toPass({ timeout: 15000 });

        await questionPage.clickDeleteButton();
        await questionPage.clickDeleteConfirmationButton();
        await expect(page.locator(questionLocators.emptyQuestionTable)).toContainText('No Data');


        //availability question
        await createAvailabilityQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Select your availability",
            ["Morning", "Afternoon", "Evening"]
        );

        await expect(async () => {
            const deleteBtn = page.locator(questionLocators.deleteBtn);

            if (!(await deleteBtn.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
            }

            await expect(deleteBtn).toBeVisible();

        }).toPass({ timeout: 15000 });

        await page.waitForSelector(questionLocators.deleteBtn);
        await questionPage.clickDeleteButton();
        await questionPage.clickDeleteConfirmationButton();
        await expect(page.locator(questionLocators.emptyQuestionTable)).toContainText('No Data');

        if (projectId) {
            await deleteProject(request, token, projectId);
        }
    });

    // =========================================================
    test('should delete active question when project is inactive and round is active', async ({ page, request }) => {

        test.setTimeout(120000);

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

        await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);

        // text Questions
        await createTextQuestion(
            request, token, projectId, roundId, roleId,
            "Tell us about yourself"
        );

        const questionPage = new QuestionPage(page);
        const projectPage = new ProjectPage(page);
        await projectPage.openSearchedProject(projectName);
        await questionPage.gotoQuestionsTab();

        await questionPage.clickDeleteButton();
        await questionPage.clickDeleteConfirmationButton();
        await expect(page.locator(questionLocators.emptyQuestionTable)).toContainText('No Data');


        //checkbox question
        await createCheckboxQuestion(
            request, token, projectId, roundId, roleId,
            "Select your skills",
            ["Acting", "Singing", "Dancing"]
        );

        await expect(async () => {
            const deleteBtn = page.locator(questionLocators.deleteBtn);

            if (!(await deleteBtn.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
            }

            await expect(deleteBtn).toBeVisible();

        }).toPass({ timeout: 15000 });

        await questionPage.clickDeleteButton();
        await questionPage.clickDeleteConfirmationButton();
        await expect(page.locator(questionLocators.emptyQuestionTable)).toContainText('No Data');



        //radio question
        await createRadioQuestion(
            request, token, projectId, roundId, roleId,
            "Do you have acting experience?",
            ["Yes", "No"]
        );

        await expect(async () => {
            const deleteBtn = page.locator(questionLocators.deleteBtn);

            if (!(await deleteBtn.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
            }

            await expect(deleteBtn).toBeVisible();

        }).toPass({ timeout: 15000 });

        await questionPage.clickDeleteButton();
        await questionPage.clickDeleteConfirmationButton();
        await expect(page.locator(questionLocators.emptyQuestionTable)).toContainText('No Data');


        //dropdown question
        await createDropdownQuestion(
            request, token, projectId, roundId, roleId,
            "Select your country",
            ["USA", "UK", "Canada"]
        );

        await expect(async () => {
            const deleteBtn = page.locator(questionLocators.deleteBtn);

            if (!(await deleteBtn.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
            }

            await expect(deleteBtn).toBeVisible();

        }).toPass({ timeout: 15000 });

        await questionPage.clickDeleteButton();
        await questionPage.clickDeleteConfirmationButton();
        await expect(page.locator(questionLocators.emptyQuestionTable)).toContainText('No Data');

        //media question - image 
        await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your profile photo",
            [1]
        );

        await expect(async () => {
            const deleteBtn = page.locator(questionLocators.deleteBtn);

            if (!(await deleteBtn.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
            }

            await expect(deleteBtn).toBeVisible();

        }).toPass({ timeout: 15000 });

        await questionPage.clickDeleteButton();
        await questionPage.clickDeleteConfirmationButton();
        await expect(page.locator(questionLocators.emptyQuestionTable)).toContainText('No Data');


        //media question - audio
        await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your audio clip",
            [2]
        );

        await expect(async () => {
            const deleteBtn = page.locator(questionLocators.deleteBtn);

            if (!(await deleteBtn.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
            }

            await expect(deleteBtn).toBeVisible();

        }).toPass({ timeout: 15000 });

        await questionPage.clickDeleteButton();
        await questionPage.clickDeleteConfirmationButton();
        await expect(page.locator(questionLocators.emptyQuestionTable)).toContainText('No Data');


        //media question - pdf
        await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your proposal pdf version",
            [4]
        );

        await expect(async () => {
            const deleteBtn = page.locator(questionLocators.deleteBtn);

            if (!(await deleteBtn.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
            }

            await expect(deleteBtn).toBeVisible();

        }).toPass({ timeout: 15000 });

        await questionPage.clickDeleteButton();
        await questionPage.clickDeleteConfirmationButton();
        await expect(page.locator(questionLocators.emptyQuestionTable)).toContainText('No Data');


        //availability question
        await createAvailabilityQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Select your availability",
            ["Morning", "Afternoon", "Evening"]
        );

        await expect(async () => {
            const deleteBtn = page.locator(questionLocators.deleteBtn);

            if (!(await deleteBtn.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
            }

            await expect(deleteBtn).toBeVisible();

        }).toPass({ timeout: 15000 });

        await page.waitForSelector(questionLocators.deleteBtn);
        await questionPage.clickDeleteButton();
        await questionPage.clickDeleteConfirmationButton();
        await expect(page.locator(questionLocators.deleteConfirmationBtn)).toBeHidden();
        await expect(page.locator(questionLocators.emptyQuestionTable)).toContainText('No Data');

        if (projectId) {
            await deleteProject(request, token, projectId);
        }
    });


    // =========================================================
    test('should not delete active question when project is active and round is active and talent has applied for the round', async ({ page, request }) => {

        test.setTimeout(120000);

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
      

        const questionPage = new QuestionPage(page);
        const projectPage = new ProjectPage(page);
        await projectPage.openSearchedProject(projectName);
        await questionPage.gotoQuestionsTab();

        await page.waitForSelector(questionLocators.deleteBtn);
        await questionPage.clickDeleteButton();
        await questionPage.clickDeleteConfirmationButton();

        await expect.poll(async () => {
            return await questionPage.isQuestionPresent(question.data.question);
        }).toBeTruthy();

        await questionPage.closeDeleteConfirmationModel();
        expect(await questionPage.isQuestionPresent(question.data.question)).toBeTruthy();

        if (projectId) {
            await deleteProject(request, token, projectId);
        }

    });


});