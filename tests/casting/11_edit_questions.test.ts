// import { getAccessTokenSmartFromCasting } from "@/helpers/api/casting/authApi";
// import { createProject, deleteProject, publishProject } from "@/helpers/api/casting/projectApi";
// import { createAvailabilityQuestion, createCheckboxQuestion, createDropdownQuestion, createMediaQuestion, createRadioQuestion, createTextQuestion, deleteAllQuestions } from "@/helpers/api/casting/questionApi";
// import { createRole, deleteRole, getProjectRoles } from "@/helpers/api/casting/roleApi";
// import { createOnlineRound, deleteRound, getProjectRounds, updateRoundSubmissionStatus } from "@/helpers/api/casting/roundApi";
// import { validLogin } from "@/test-data/loginData";
// import { urls } from "@/utils/urls";
// import test, { expect } from "playwright/test";
// import LoginPage from "../../pages/casting/owner/login/loginPage";
// import QuestionPage from "../../pages/casting/owner/question/questionPage";

// import { questionLocators } from "@/pages/casting/owner/question/questionPageLocators";

// import { editQuestionData, questionData } from "@/test-data/questionData";
// import ProjectPage from "@/pages/casting/owner/project/projectPage";

// test.describe('Casting owner edit question scenarios', () => {
//     let token: string;
//     let projectId: number;
//     let roleId: number;
//     let newRoleId: number;
//     let roundId: number;
//     let newRoundId: number;
//     let roleName: string;
//     let newRoleName: string;
//     let roundName: string;
//     let newRoundName: string;
//     let projectName: string;
//     let uniqueName: string;

//     test.beforeAll(async ({ request }) => {
//         token = await getAccessTokenSmartFromCasting(request, validLogin.email);
//     });

//     test.beforeEach(async ({ page, request }) => {
//         await page.goto(urls.casting);
//         const login = new LoginPage(page);
//         const status = await login.validLoginwithUI(validLogin.email, validLogin.password, request);
//         console.log("2FA Status:", status);
//         await page.goto(urls.casting + "/projects"); await expect(page).toHaveURL(/projects/);
//     });

//     // =========================================================
//     test('should edit active question when project is inactive and round is not opened', async ({ page, request }) => {

//         const { response } = await createProject(request, token);
//         projectId = response.data.id;
//         projectName = response.data.title;
//         console.log(projectId);

//         await createRole(request, token, projectId);
//         const roles = await getProjectRoles(request, token, projectId);
//         const role = roles.data[0];
//         expect(role).toBeDefined();
//         roleId = role.id;
//         roleName = role.role_name;

//         await createOnlineRound(request, token, projectId, roleId);
//         const rounds = await getProjectRounds(request, token, projectId);
//         const round = rounds.data[0];
//         expect(round).toBeDefined();
//         roundId = round.id;
//         roundName = round.round_name;

//         // text Questions
//         const textquestion = await createTextQuestion(
//             request, token, projectId, roundId, roleId,
//             "Tell us about yourself"
//         );
//         await page.waitForTimeout(7000);

//         const questionPage = new QuestionPage(page);
//         const projectPage = new ProjectPage(page);

//         await projectPage.openSearchedProject(projectName);
//         await questionPage.gotoQuestionsTab();

//         await questionPage.openSearchedQuestion(textquestion.data.question);
//         await page.locator(questionLocators.questionTextInput).clear();
//         await expect(page.locator(questionLocators.valueRequiredError)).toContainText('Value is required');



//         //checkbox question
//         const checkboxQuestion = await createCheckboxQuestion(
//             request, token, projectId, roundId, roleId,
//             "Select your skills",
//             ["Acting", "Singing", "Dancing"]
//         );
//         await page.waitForTimeout(7000);

//         await questionPage.openSearchedQuestion(checkboxQuestion.data.question);
//         await page.locator(questionLocators.questionTextInput).clear();
//         await expect(page.locator(questionLocators.valueRequiredError)).toContainText('Value is required');
//         for (let i = 0; i < 3; i++) {
//             await questionPage.clickRemoveCheckboxOption();
//             await page.waitForTimeout(300);
//         }
//         await expect(page.locator(questionLocators.valueRequiredError)).toContainText('Value is required');


//         //radio question
//         const radioQuestion = await createRadioQuestion(
//             request, token, projectId, roundId, roleId,
//             "Do you have acting experience?",
//             ["Yes", "No"]
//         );
//         await page.waitForTimeout(7000);

//         await questionPage.openSearchedQuestion(radioQuestion.data.question);
//         await page.locator(questionLocators.questionTextInput).clear();
//         await expect(page.locator(questionLocators.valueRequiredError)).toContainText('Value is required');
//         for (let i = 0; i < 2; i++) {
//             await questionPage.clickRemoveCheckboxOption();
//             await page.waitForTimeout(300);
//         }
//         await expect(page.locator(questionLocators.valueRequiredError)).toContainText('Value is required');


//         //dropdown question
//         const dropdownQuestion = await createDropdownQuestion(
//             request, token, projectId, roundId, roleId,
//             "Select your country",
//             ["USA", "UK", "Canada"]
//         );
//         await page.waitForTimeout(7000);


//         await questionPage.openSearchedQuestion(dropdownQuestion.data.question);
//         await page.locator(questionLocators.questionTextInput).clear();
//         await expect(page.locator(questionLocators.valueRequiredError)).toContainText('Value is required');
//         for (let i = 0; i < 3; i++) {
//             await questionPage.clickRemoveCheckboxOption();
//             await page.waitForTimeout(300);
//         }
//         await expect(page.locator(questionLocators.valueRequiredError)).toContainText('Value is required');


//         //media question - image 
//         const imageMediaQuestion = await createMediaQuestion(
//             request,
//             token,
//             projectId,
//             roundId,
//             roleId,
//             "Upload your profile photo",
//             [1]
//         );
//         await page.waitForTimeout(7000);

//         await questionPage.openSearchedQuestion(imageMediaQuestion.data.question);
//         await page.locator(questionLocators.questionTextInput).clear();
//         await expect(page.locator(questionLocators.valueRequiredError)).toContainText('Value is required');

//         await questionPage.clickMediaCheckboxes(1);
//         await questionPage.clickUpdateQuestionButton();
//         await expect(page.locator(questionLocators.valueRequiredAlert)).toContainText('The media type field is required when field type is Media');


//         //media question - audio
//         const audioMediaQuestion = await createMediaQuestion(
//             request,
//             token,
//             projectId,
//             roundId,
//             roleId,
//             "Upload your audio clip",
//             [2]
//         );
//         await page.waitForTimeout(7000);

//         await questionPage.openSearchedQuestion(audioMediaQuestion.data.question);
//         await page.locator(questionLocators.questionTextInput).clear();
//         await expect(page.locator(questionLocators.valueRequiredError)).toContainText('Value is required');

//         await questionPage.clickMediaCheckboxes(2);
//         await questionPage.clickUpdateQuestionButton();
//         await expect(page.locator(questionLocators.valueRequiredAlert)).toContainText('The media type field is required when field type is Media');



//         //media question - pdf
//         const pdfMediaquestion = await createMediaQuestion(
//             request,
//             token,
//             projectId,
//             roundId,
//             roleId,
//             "Upload your proposal pdf version",
//             [4]
//         );
//         await page.waitForTimeout(7000);

//         await questionPage.openSearchedQuestion(pdfMediaquestion.data.question);
//         await page.locator(questionLocators.questionTextInput).clear();
//         await expect(page.locator(questionLocators.valueRequiredError)).toContainText('Value is required');

//         await questionPage.clickMediaCheckboxes(2);
//         await questionPage.clickUpdateQuestionButton();
//         await expect(page.locator(questionLocators.valueRequiredAlert)).toContainText('The media type field is required when field type is Media');


//         //availability question
//         await createAvailabilityQuestion(
//             request,
//             token,
//             projectId,
//             roundId,
//             roleId,
//             "Select your availability",
//             ["Morning", "Afternoon", "Evening"]
//         );
//         await page.waitForTimeout(7000);

//         await questionPage.openSearchedQuestion(checkboxQuestion.data.question);
//         await page.locator(questionLocators.questionTextInput).clear();
//         await expect(page.locator(questionLocators.valueRequiredError)).toContainText('Value is required');
//         for (let i = 0; i < 3; i++) {
//             await questionPage.clickRemoveCheckboxOption();
//             await page.waitForTimeout(300);
//         }
//         await expect(page.locator(questionLocators.valueRequiredError)).toContainText('Value is required');


//         if (projectId) {
//             await deleteRound(request, token, projectId, roundId);
//             await deleteRole(request, token, projectId, roleId);
//             await deleteAllQuestions(request, token, projectId);
//             await deleteProject(request, token, projectId);
//         }
//     });

// });