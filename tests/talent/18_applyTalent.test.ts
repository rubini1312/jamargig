import { createProject, deleteProject, publishProject } from "@/helpers/api/casting/projectApi";
import { createRole, deleteRole, getProjectRoles } from "@/helpers/api/casting/roleApi";
import { createInPersonRound, createOnlineRound, deleteRound, getProjectRounds, updateRoundSubmissionStatus } from "@/helpers/api/casting/roundApi";
import { applyRegistrationConfig, deleteTalent, getAllPages, getFieldsByPageId, getProjectTalentNames, getTalentUuidByName, updateTalentRegistration } from "@/helpers/api/casting/talentApi";
import { fullConfig } from "@/test-data/dataModelConfig";
import { validLogin } from "@/test-data/loginData";
import { urls } from "@/utils/urls";
import LoginPage from "../../pages/talent/login/loginPage";
import { test, expect } from '../_setup/talentTest';
import { enterOtpForTalent, getOtpFromMailtrap } from "@/utils/mailtrapOtp";
import { TalentRegisterPage } from "@/pages/talent/register/registerPage";
import { TalentHomePage } from "@/pages/talent/home/homePage";
import { generateEmail } from "@/test-data/random-data";
import { createAvailabilityQuestion, createCheckboxQuestion, createDropdownQuestion, createMediaQuestion, createRadioQuestion, createTextQuestion, getSubmittedForm, makeAvailabilityQuestionAsMandotory, makeCheckboxQuestionAsInactive, makeCheckboxQuestionAsMandotory, makeDropdownQuestionAsMandotory, makeMediaQuestionAsMandotory, makeRadioQuestionAsMandotory, makeTextQuestionAsInactive, makeTextQuestionAsMandory, updateQuestionAsInactive } from "@/helpers/api/casting/questionApi";
import { TalentApplyPage } from "@/pages/talent/apply/applyRoundPage";
import { getAccessTokenSmartFromCasting } from "@/helpers/api/casting/authApi";
import { talentAuditionPageLocators } from "@/pages/talent/audition/auditionPageLocators";

test.describe('Apply talent scenarios', () => {

    let token: string;

    test.beforeAll(async ({ request }) => {
        token = await getAccessTokenSmartFromCasting(request, validLogin.email);
    });

    test("Register new talent and apply for the online-open round: without questions (including failure cases)",
        async ({ page, request }) => {

            test.setTimeout(300000);

            const talentEmail = generateEmail();

            // Create project setup
            const { response } = await createProject(request, token);
            const projectId = response.data.id;
            const projectName = response.data.title;

            await publishProject(request, token, projectId);
            await createRole(request, token, projectId);

            const roles = await getProjectRoles(request, token, projectId);
            const role = roles.data[0];
            expect(role).toBeDefined();
            const roleId = role.id;
            const roleName = role.role_name;

            await createOnlineRound(request, token, projectId, roleId);

            const rounds = await getProjectRounds(request, token, projectId);
            const round = rounds.data[0];
            expect(round).toBeDefined();
            const roundId = round.id;

            await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);

            // Apply registration config
            await applyRegistrationConfig(request, token, fullConfig);

            await expect.poll(async () => {
                const f = await getFieldsByPageId(request, 1, token);
                return f.length;
            }, { timeout: 60000 }).toBeGreaterThan(0);

            // Open UI
            await page.goto(urls.talent, { waitUntil: "domcontentloaded" });

            const login = new LoginPage(page);
            await login.validTalentLogin(talentEmail);

            // OTP handling
            await expect(page.locator('[data-testid="auth-form"]')).toBeVisible();

            const otp = await getOtpFromMailtrap(request, talentEmail, 120000, false);
            if (!otp) {
                throw new Error("OTP not received from Mailtrap");
            } await enterOtpForTalent(page, otp);


            await page.waitForLoadState("networkidle");
            await expect(page.locator("form")).toBeVisible();

            // Registration
            const pages = await getAllPages(request, token);
            const talentRegisterPage = new TalentRegisterPage(page);
            const uniqueName = `Autom-Talent ${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            for (let i = 0; i < pages.length; i++) {

                const p = pages[i];
                const apiFields = await getFieldsByPageId(request, p.id, token);

                for (const field of apiFields.filter(f => f.required)) {

                    switch (field.name) {
                        case "name":
                            await talentRegisterPage.enterFullName(uniqueName);
                            break;
                        case "stage_name":
                            await talentRegisterPage.enterStageName("Automation Stage");
                            break;
                        case "location":
                            await talentRegisterPage.setLocation("Colombo, LKA");
                            break;
                        case "gender":
                            await talentRegisterPage.selectGender(1);
                            break;
                        case "birth":
                            await talentRegisterPage.openDOBAndSelectDate("20 Apr 1990");
                            break;
                        case "phone1":
                            await talentRegisterPage.enterMobile("6152369");
                            break;
                        case "description":
                            await talentRegisterPage.enterDescription("Automation Description");
                            break;
                    }
                }

                if (
                    apiFields.some(
                        f =>
                            ['Avatar', 'avatar', 'profile_photo'].includes(f.name) &&
                            f.required
                    )
                ) {

                    await talentRegisterPage.uploadProfilePicture();
                    await talentRegisterPage.saveCroppedProfilePicture();

                    console.log('Profile picture uploaded successfully.');
                }

                if (
                    apiFields.some(
                        f =>
                            ['Supported Media', 'supported_media', 'm_CmsQ'].includes(f.name) &&
                            f.required
                    )
                ) {

                    await talentRegisterPage.uploadRandomSupportedMedia();

                    console.log('Supported Media uploaded successfully.');
                }

                if (p.page_no === 1) {
                    await talentRegisterPage.clickTermsAndConditionCheckBox();
                }

                await talentRegisterPage.clickContinueButton();

                // wait for next page properly
                if (i < pages.length - 1) {
                    const nextPage = pages[i + 1];
                    const nextFields = await getFieldsByPageId(request, nextPage.id, token);
                    const nextLabel = nextFields[0]?.label;

                    if (nextLabel) {
                        const nextField = page.locator("form").getByText(nextLabel, { exact: false });
                        await expect(nextField).toBeVisible({ timeout: 15000 });
                    }
                }
            }

            // Wait for redirect after registration
            await page.waitForLoadState("networkidle");

            // Apply flow
            const talentHome = new TalentHomePage(page);

            await expect(page.locator(talentAuditionPageLocators.auditionCards).first())
                .toBeVisible();

            await talentHome.enterProjectName(projectName);
            await expect(page.getByText(projectName)).toBeVisible();
            
            await talentHome.clickApplyForSearchedProject(roleName);
            const talentApply = new TalentApplyPage(page);

            await talentApply.clickApplyOnlineround();

            await talentApply.clickSubmit();
            const error = page.locator(".n-form-item-feedback__line:visible");

            await expect(error).toBeVisible();
            await expect(error).toContainText("Value is required");

            await talentApply.clickRoleSelector();

            await talentApply.clickSubmit();

            await expect(page.getByText("Submitted")).toBeVisible();
            await expect(page.getByText(roleName)).toBeVisible();

            const names = await getProjectTalentNames(request, token, projectId);
            expect(names).toContain(uniqueName);

            await deleteRound(request, token, projectId, roundId);
            await deleteRole(request, token, projectId, roleId);
            await deleteProject(request, token, projectId);

            const uuid = await getTalentUuidByName(request, token, uniqueName);
            await deleteTalent(request, token, uuid);
        });

    test("Register new talent and apply for the in-Person open round: without questions (including failure cases)",
        async ({ page, request }) => {

            test.setTimeout(300000);

            const token = await getAccessTokenSmartFromCasting(request, validLogin.email);
            const talentEmail = generateEmail();
            const uniqueName = `Autom-Talent ${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            // Create project setup
            const { response } = await createProject(request, token);
            const projectId = response.data.id;
            const projectName = response.data.title;

            await publishProject(request, token, projectId);
            await createRole(request, token, projectId);

            const roles = await getProjectRoles(request, token, projectId);
            const role = roles.data[0];
            expect(role).toBeDefined();
            const roleId = role.id;
            const roleName = role.role_name;

            await createInPersonRound(request, token, projectId, roleId);

            const rounds = await getProjectRounds(request, token, projectId);
            const round = rounds.data[0];
            expect(round).toBeDefined();
            const roundId = round.id;

            await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);

            // Apply config
            await applyRegistrationConfig(request, token, fullConfig);

            await expect.poll(async () => {
                const f = await getFieldsByPageId(request, 1, token);
                return f.length;
            }, { timeout: 60000 }).toBeGreaterThan(0);

            await page.goto(urls.talent, { waitUntil: "domcontentloaded" });

            const login = new LoginPage(page);
            await login.validTalentLogin(talentEmail);

            await expect(page.locator('[data-testid="auth-form"]')).toBeVisible();


            const otp = await getOtpFromMailtrap(request, talentEmail, 120000, false);
            if (!otp) {
                throw new Error("OTP not received from Mailtrap");
            }
            await enterOtpForTalent(page, otp);

            await page.waitForLoadState("networkidle");
            await expect(page.locator("form")).toBeVisible();

            const pages = await getAllPages(request, token);
            const talentRegisterPage = new TalentRegisterPage(page);

            for (let i = 0; i < pages.length; i++) {

                const p = pages[i];
                const apiFields = await getFieldsByPageId(request, p.id, token);

                for (const field of apiFields.filter(f => f.required)) {

                    switch (field.name) {
                        case "name":
                            await talentRegisterPage.enterFullName(uniqueName);
                            break;
                        case "stage_name":
                            await talentRegisterPage.enterStageName("Automation Stage");
                            break;
                        case "location":
                            await talentRegisterPage.setLocation("Colombo, LKA");
                            break;
                        case "gender":
                            await talentRegisterPage.selectGender(1);
                            break;
                        case "birth":
                            await talentRegisterPage.openDOBAndSelectDate("20 Apr 1990");
                            break;
                        case "phone1":
                            await talentRegisterPage.enterMobile("6152369");
                            break;
                        case "description":
                            await talentRegisterPage.enterDescription("Automation Description");
                            break;
                    }
                }

                if (
                    apiFields.some(
                        f =>
                            ['Avatar', 'avatar', 'profile_photo'].includes(f.name) &&
                            f.required
                    )
                ) {

                    await talentRegisterPage.uploadProfilePicture();
                    await talentRegisterPage.saveCroppedProfilePicture();

                    console.log('Profile picture uploaded successfully.');
                }

                if (
                    apiFields.some(
                        f =>
                            ['Supported Media', 'supported_media', 'm_CmsQ'].includes(f.name) &&
                            f.required
                    )
                ) {

                    await talentRegisterPage.uploadRandomSupportedMedia();

                    console.log('Supported Media uploaded successfully.');
                }

                if (p.page_no === 1) {
                    await talentRegisterPage.clickTermsAndConditionCheckBox();
                }

                await talentRegisterPage.clickContinueButton();

                if (i < pages.length - 1) {
                    const nextPage = pages[i + 1];
                    const nextFields = await getFieldsByPageId(request, nextPage.id, token);
                    const nextLabel = nextFields[0]?.label;

                    if (nextLabel) {
                        await expect(page.locator("form")).toContainText(nextLabel);
                    }
                }
            }

            await page.waitForLoadState("networkidle");

            const talentHome = new TalentHomePage(page);

            await expect(page.locator(talentAuditionPageLocators.auditionCards).first()).toBeVisible();

            await talentHome.enterProjectName(projectName);
            await talentHome.clickApplyForSearchedProject(roleName);

            const talentApply = new TalentApplyPage(page);

            await talentApply.clickApplyOnlineround();
            await talentApply.clickSubmit();

            const error = page.locator(".n-form-item-feedback__line:visible");

            await expect(error).toBeVisible();
            await expect(error).toContainText("Value is required");

            await talentApply.clickRoleSelector();
            await talentApply.clickSubmit();

            await expect(page.getByText("Submitted")).toBeVisible();
            await expect(page.getByText(roleName)).toBeVisible();

            const names = await getProjectTalentNames(request, token, projectId);
            expect(names).toContain(uniqueName);

            await deleteRound(request, token, projectId, roundId);
            await deleteRole(request, token, projectId, roleId);
            await deleteProject(request, token, projectId);

            const uuid = await getTalentUuidByName(request, token, uniqueName);
            await deleteTalent(request, token, uuid);
        });

    test("Register new talent and apply for the online-open round: verify all questions appear",
        async ({ page, request }) => {

            test.setTimeout(300000);

            const talentEmail = generateEmail();
            const token = await getAccessTokenSmartFromCasting(request, validLogin.email);

            // Create project
            const { response } = await createProject(request, token);
            const projectId = response.data.id;
            const projectName = response.data.title;

            await publishProject(request, token, projectId);
            await createRole(request, token, projectId);

            const roles = await getProjectRoles(request, token, projectId);
            const role = roles.data[0];
            expect(role).toBeDefined();
            const roleName = role.role_name;
            const roleId = role.id;

            await createOnlineRound(request, token, projectId, roleId);

            const rounds = await getProjectRounds(request, token, projectId);
            const round = rounds.data[0];
            expect(round).toBeDefined();

            const roundId = round.id;

            const textQuestion = await createTextQuestion(request, token, projectId, roundId, roleId, "Tell us about yourself");

            const checkboxQuestion = await createCheckboxQuestion(
                request, token, projectId, roundId, roleId,
                "Select your skills", ["Acting", "Singing", "Dancing"]
            );

            const radioQuestion = await createRadioQuestion(
                request, token, projectId, roundId, roleId,
                "Do you have acting experience?", ["Yes", "No"]
            );

            const dropdownQuestion = await createDropdownQuestion(
                request, token, projectId, roundId, roleId,
                "Select your country", ["USA", "UK", "Canada"]
            );

            const imageMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your profile photo", [1]);
            const videoMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your audio clip", [2]);
            const audioMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your video performance", [3]);
            const pdfMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your proposal pdf version", [4]);

            const availabilityQuestion = await createAvailabilityQuestion(
                request, token, projectId, roundId, roleId,
                "Select your availability", ["Morning", "Afternoon", "Evening"]
            );

            await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);
            await applyRegistrationConfig(request, token, fullConfig);

            await expect.poll(async () => {
                const f = await getFieldsByPageId(request, 1, token);
                return f.length;
            }, { timeout: 60000 }).toBeGreaterThan(0);

            await page.goto(urls.talent, { waitUntil: "domcontentloaded" });

            const login = new LoginPage(page);
            await login.validTalentLogin(talentEmail);

            await expect(page.locator('[data-testid="auth-form"]')).toBeVisible();

            const otp = await getOtpFromMailtrap(request, talentEmail, 120000, false);
            if (!otp) {
                throw new Error("OTP not received from Mailtrap");
            } await enterOtpForTalent(page, otp);

            await page.waitForLoadState("networkidle");
            await expect(page.locator("form")).toBeVisible();

            const pages = await getAllPages(request, token);
            const talentRegisterPage = new TalentRegisterPage(page);
            const uniqueName = `Autom-Talent ${Date.now()}`;

            for (let i = 0; i < pages.length; i++) {

                const apiFields = await getFieldsByPageId(request, pages[i].id, token);

                for (const field of apiFields.filter(f => f.required)) {

                    switch (field.name) {
                        case "name":
                            await talentRegisterPage.enterFullName(uniqueName);
                            break;
                        case "stage_name":
                            await talentRegisterPage.enterStageName("Automation Stage");
                            break;
                        case "location":
                            await talentRegisterPage.setLocation("Colombo, LKA");
                            break;
                        case "gender":
                            await talentRegisterPage.selectGender(1);
                            break;
                        case "birth":
                            await talentRegisterPage.openDOBAndSelectDate("20 Apr 1990");
                            break;
                        case "phone1":
                            await talentRegisterPage.enterMobile("6152369");
                            break;
                        case "description":
                            await talentRegisterPage.enterDescription("Automation Description");
                            break;
                    }
                }

                if (
                    apiFields.some(
                        f =>
                            ['Avatar', 'avatar', 'profile_photo'].includes(f.name) &&
                            f.required
                    )
                ) {

                    await talentRegisterPage.uploadProfilePicture();
                    await talentRegisterPage.saveCroppedProfilePicture();

                    console.log('Profile picture uploaded successfully.');
                }

                if (
                    apiFields.some(
                        f =>
                            ['Supported Media', 'supported_media', 'm_CmsQ'].includes(f.name) &&
                            f.required
                    )
                ) {

                    await talentRegisterPage.uploadRandomSupportedMedia();

                    console.log('Supported Media uploaded successfully.');
                }

                if (pages[i].page_no === 1) {
                    await talentRegisterPage.clickTermsAndConditionCheckBox();
                }

                await talentRegisterPage.clickContinueButton();

                if (i < pages.length - 1) {
                    const nextPage = pages[i + 1];
                    const nextFields = await getFieldsByPageId(request, nextPage.id, token);
                    const nextLabel = nextFields[0]?.label;

                    if (nextLabel) {
                        await expect(page.locator("form")).toContainText(nextLabel);
                    }
                }
            }

            await page.waitForLoadState("networkidle");
            const talentHome = new TalentHomePage(page);

            await expect(page.locator(talentAuditionPageLocators.auditionCards).first()).toBeVisible();

            await talentHome.enterProjectName(projectName);
            await talentHome.clickApplyForSearchedProject(roleName);

            const talentApply = new TalentApplyPage(page);
            await talentApply.clickApplyOnlineround();
            await talentApply.clickRoleSelector();

            await expect(page.getByText("New Application")).toBeVisible();

            const apiQuestions = [
                textQuestion.data.question,
                checkboxQuestion.data.question,
                radioQuestion.data.question,
                dropdownQuestion.data.question,
                imageMediaQuestion.data.question,
                videoMediaQuestion.data.question,
                audioMediaQuestion.data.question,
                pdfMediaQuestion.data.question,
                availabilityQuestion.data.question
            ];

            const uiQuestions = await page
                .locator(".n-form-item-label__text, .font-bold.text-gray-default")
                .allTextContents();

            const cleanedUiQuestions = uiQuestions.map(q => q.replace("*", "").trim());

            for (const q of apiQuestions) {
                expect(cleanedUiQuestions).toContain(q.trim());
            }

            const uuid = await getTalentUuidByName(request, token, uniqueName);

            await deleteRound(request, token, projectId, roundId);
            await deleteRole(request, token, projectId, roleId);
            await deleteProject(request, token, projectId);
            await deleteTalent(request, token, uuid);
        });

    test("Register new talent and apply for the online-open round: verify all mandatory questions show validation",
        async ({ page, request }) => {

            test.setTimeout(300000);

            const talentEmail = generateEmail();
            const token = await getAccessTokenSmartFromCasting(request, validLogin.email);

            const { response } = await createProject(request, token);
            const projectId = response.data.id;
            const projectName = response.data.title;

            await publishProject(request, token, projectId);
            await createRole(request, token, projectId);

            const roles = await getProjectRoles(request, token, projectId);
            const role = roles.data[0];
            expect(role).toBeDefined();
            const roleId = role.id;

            await createOnlineRound(request, token, projectId, roleId);

            const rounds = await getProjectRounds(request, token, projectId);
            const round = rounds.data[0];
            expect(round).toBeDefined();
            const roundId = round.id;
            const roleName = role.role_name;

            const textQuestion = await createTextQuestion(request, token, projectId, roundId, roleId, "Tell us about yourself");
            const checkboxQuestion = await createCheckboxQuestion(request, token, projectId, roundId, roleId, "Select your skills", ["Acting", "Singing", "Dancing"]);
            const radioQuestion = await createRadioQuestion(request, token, projectId, roundId, roleId, "Do you have acting experience?", ["Yes", "No"]);
            const dropdownQuestion = await createDropdownQuestion(request, token, projectId, roundId, roleId, "Select your country", ["USA", "UK", "Canada"]);
            const imageMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your profile photo", [1]);
            const videoMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your video performance", [2]);
            const audioMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your audio clip", [3]);
            const pdfMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your proposal pdf version", [4]);
            const availabilityQuestion = await createAvailabilityQuestion(request, token, projectId, roundId, roleId, "Select your availability", ["Morning", "Afternoon", "Evening"]);

            await makeTextQuestionAsMandory(request, token, projectId, roundId, roleId, "Tell us about yourself", textQuestion.data.question_id);
            await makeCheckboxQuestionAsMandotory(request, token, projectId, roundId, roleId, "Select your skills", ["Acting", "Singing", "Dancing"], checkboxQuestion.data.question_id);
            await makeRadioQuestionAsMandotory(request, token, projectId, roundId, roleId, "Do you have acting experience?", ["Yes", "No"], radioQuestion.data.question_id);
            await makeDropdownQuestionAsMandotory(request, token, projectId, roundId, roleId, "Select your country", ["USA", "UK", "Canada"], dropdownQuestion.data.question_id);

            await makeMediaQuestionAsMandotory(request, token, projectId, roundId, roleId, "Upload your profile photo", [1], imageMediaQuestion.data.question_id);
            await makeMediaQuestionAsMandotory(request, token, projectId, roundId, roleId, "Upload your video performance", [2], videoMediaQuestion.data.question_id);
            await makeMediaQuestionAsMandotory(request, token, projectId, roundId, roleId, "Upload your audio clip", [3], audioMediaQuestion.data.question_id);
            await makeMediaQuestionAsMandotory(request, token, projectId, roundId, roleId, "Upload your proposal pdf version", [4], pdfMediaQuestion.data.question_id);

            await makeAvailabilityQuestionAsMandotory(request, token, projectId, roundId, roleId, "Select your availability", ["Morning", "Afternoon", "Evening"], availabilityQuestion.data.question_id);

            await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);
            await applyRegistrationConfig(request, token, fullConfig);

            await expect.poll(async () => {
                const f = await getFieldsByPageId(request, 1, token);
                return f.length;
            }, { timeout: 60000 }).toBeGreaterThan(0);

            await page.goto(urls.talent, { waitUntil: "domcontentloaded" });

            const login = new LoginPage(page);
            await login.validTalentLogin(talentEmail);

            await expect(page.locator('[data-testid="auth-form"]')).toBeVisible();

            const otp = await getOtpFromMailtrap(request, talentEmail, 120000, false);
            if (!otp) {
                throw new Error("OTP not received from Mailtrap");
            } await enterOtpForTalent(page, otp);

            await page.waitForLoadState("networkidle");
            await expect(page.locator("form")).toBeVisible();

            const pages = await getAllPages(request, token);
            const talentRegisterPage = new TalentRegisterPage(page);
            const uniqueName = `Autom-Talent ${Date.now()}`;

            for (let i = 0; i < pages.length; i++) {

                const apiFields = await getFieldsByPageId(request, pages[i].id, token);

                for (const field of apiFields.filter(f => f.required)) {

                    switch (field.name) {
                        case "name": await talentRegisterPage.enterFullName(uniqueName); break;
                        case "stage_name": await talentRegisterPage.enterStageName("Automation Stage"); break;
                        case "location": await talentRegisterPage.setLocation("Colombo, LKA"); break;
                        case "gender": await talentRegisterPage.selectGender(1); break;
                        case "birth": await talentRegisterPage.openDOBAndSelectDate("20 Apr 1990"); break;
                        case "phone1": await talentRegisterPage.enterMobile("6152369"); break;
                        case "description": await talentRegisterPage.enterDescription("Automation Description"); break;
                    }
                }

                if (
                    apiFields.some(
                        f =>
                            ['Avatar', 'avatar', 'profile_photo'].includes(f.name) &&
                            f.required
                    )
                ) {

                    await talentRegisterPage.uploadProfilePicture();
                    await talentRegisterPage.saveCroppedProfilePicture();

                    console.log('Profile picture uploaded successfully.');
                }

                if (
                    apiFields.some(
                        f =>
                            ['Supported Media', 'supported_media', 'm_CmsQ'].includes(f.name) &&
                            f.required
                    )
                ) {

                    await talentRegisterPage.uploadRandomSupportedMedia();

                    console.log('Supported Media uploaded successfully.');
                }

                if (pages[i].page_no === 1) {
                    await talentRegisterPage.clickTermsAndConditionCheckBox();
                }

                await talentRegisterPage.clickContinueButton();

                if (i < pages.length - 1) {
                    const nextPage = pages[i + 1];
                    const nextFields = await getFieldsByPageId(request, nextPage.id, token);
                    const nextLabel = nextFields[0]?.label;

                    if (nextLabel) {
                        await expect(page.locator("form")).toContainText(nextLabel);
                    }
                }
            }

            await page.waitForLoadState("networkidle");
            const talentHome = new TalentHomePage(page);

            await expect(page.locator(talentAuditionPageLocators.auditionCards).first()).toBeVisible();

            await talentHome.enterProjectName(projectName);
            await talentHome.clickApplyForSearchedProject(roleName);

            const talentApply = new TalentApplyPage(page);
            await talentApply.clickApplyOnlineround();
            await talentApply.clickRoleSelector();
            await talentApply.clickSubmit();

            const errorLocator = page.locator(".n-form-item-feedback__line:visible");
            await expect(errorLocator.first()).toBeVisible();

            const errors = (await errorLocator.allTextContents())
                .map(e => e.trim())
                .filter(Boolean);

            console.log("Validation Errors:", errors);

            expect(errors).toEqual(expect.arrayContaining([
                "Value is required",
                "Media is required"
            ]));

            expect(errors.length).toBeGreaterThan(5);
            const uuid = await getTalentUuidByName(request, token, uniqueName);

            await deleteRound(request, token, projectId, roundId);
            await deleteRole(request, token, projectId, roleId);
            await deleteProject(request, token, projectId);
            await deleteTalent(request, token, uuid);
        });

    test("Register new talent and apply for the in-Person round: verify all questions appear",
        async ({ page, request }) => {

            test.setTimeout(300000);

            const talentEmail = generateEmail();
            const token = await getAccessTokenSmartFromCasting(request, validLogin.email);

            const { response } = await createProject(request, token);
            const projectId = response.data.id;
            const projectName = response.data.title;

            await publishProject(request, token, projectId);
            await createRole(request, token, projectId);

            const roles = await getProjectRoles(request, token, projectId);
            const role = roles.data[0];
            expect(role).toBeDefined();
            const roleName = role.role_name;

            const roleId = role.id;
            await createInPersonRound(request, token, projectId, roleId);

            const rounds = await getProjectRounds(request, token, projectId);
            const round = rounds.data[0];
            expect(round).toBeDefined();
            const roundId = round.id;

            const textQuestion = await createTextQuestion(request, token, projectId, roundId, roleId, "Tell us about yourself");

            const checkboxQuestion = await createCheckboxQuestion(
                request, token, projectId, roundId, roleId,
                "Select your skills", ["Acting", "Singing", "Dancing"]
            );

            const radioQuestion = await createRadioQuestion(
                request, token, projectId, roundId, roleId,
                "Do you have acting experience?", ["Yes", "No"]
            );

            const dropdownQuestion = await createDropdownQuestion(
                request, token, projectId, roundId, roleId,
                "Select your country", ["USA", "UK", "Canada"]
            );

            const imageMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your profile photo", [1]);
            const videoMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your audio clip", [2]);
            const audioMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your video performance", [3]);
            const pdfMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your proposal pdf version", [4]);

            const availabilityQuestion = await createAvailabilityQuestion(
                request, token, projectId, roundId, roleId,
                "Select your availability", ["Morning", "Afternoon", "Evening"]
            );

            await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);
            await applyRegistrationConfig(request, token, fullConfig);

            await expect.poll(async () => {
                const f = await getFieldsByPageId(request, 1, token);
                return f.length;
            }, { timeout: 60000 }).toBeGreaterThan(0);

            await page.goto(urls.talent, { waitUntil: "domcontentloaded" });

            const login = new LoginPage(page);
            await login.validTalentLogin(talentEmail);

            await expect(page.locator('[data-testid="auth-form"]')).toBeVisible();

            const otp = await getOtpFromMailtrap(request, talentEmail, 120000, false);
            if (!otp) {
                throw new Error("OTP not received from Mailtrap");
            } await enterOtpForTalent(page, otp);

            await page.waitForLoadState("networkidle");
            await expect(page.locator("form")).toBeVisible();

            const pages = await getAllPages(request, token);
            const talentRegisterPage = new TalentRegisterPage(page);
            const uniqueName = `Autom-Talent ${Date.now()}`;

            for (let i = 0; i < pages.length; i++) {

                const apiFields = await getFieldsByPageId(request, pages[i].id, token);

                for (const field of apiFields.filter(f => f.required)) {

                    switch (field.name) {
                        case "name": await talentRegisterPage.enterFullName(uniqueName); break;
                        case "stage_name": await talentRegisterPage.enterStageName("Automation Stage"); break;
                        case "location": await talentRegisterPage.setLocation("Colombo, LKA"); break;
                        case "gender": await talentRegisterPage.selectGender(1); break;
                        case "birth": await talentRegisterPage.openDOBAndSelectDate("20 Apr 1990"); break;
                        case "phone1": await talentRegisterPage.enterMobile("6152369"); break;
                        case "description": await talentRegisterPage.enterDescription("Automation Description"); break;
                    }
                }

                if (
                    apiFields.some(
                        f =>
                            ['Avatar', 'avatar', 'profile_photo'].includes(f.name) &&
                            f.required
                    )
                ) {

                    await talentRegisterPage.uploadProfilePicture();
                    await talentRegisterPage.saveCroppedProfilePicture();

                    console.log('Profile picture uploaded successfully.');
                }

                if (
                    apiFields.some(
                        f =>
                            ['Supported Media', 'supported_media', 'm_CmsQ'].includes(f.name) &&
                            f.required
                    )
                ) {

                    await talentRegisterPage.uploadRandomSupportedMedia();

                    console.log('Supported Media uploaded successfully.');
                }

                if (pages[i].page_no === 1) {
                    await talentRegisterPage.clickTermsAndConditionCheckBox();
                }

                await talentRegisterPage.clickContinueButton();

                if (i < pages.length - 1) {
                    const nextPage = pages[i + 1];
                    const nextFields = await getFieldsByPageId(request, nextPage.id, token);
                    const nextLabel = nextFields[0]?.label;

                    if (nextLabel) {
                        await expect(page.locator("form")).toContainText(nextLabel);
                    }
                }
            }

            await page.waitForLoadState("networkidle");
            const talentHome = new TalentHomePage(page);

            await expect(page.locator(talentAuditionPageLocators.auditionCards).first())
                .toBeVisible();

            await talentHome.enterProjectName(projectName);
            await talentHome.clickApplyForSearchedProject(roleName);

            const talentApply = new TalentApplyPage(page);
            await talentApply.clickApplyOnlineround();
            await talentApply.clickRoleSelector();

            await expect(page.getByText("New Application")).toBeVisible();

            const apiQuestions = [
                textQuestion.data.question,
                checkboxQuestion.data.question,
                radioQuestion.data.question,
                dropdownQuestion.data.question,
                imageMediaQuestion.data.question,
                videoMediaQuestion.data.question,
                audioMediaQuestion.data.question,
                pdfMediaQuestion.data.question,
                availabilityQuestion.data.question
            ];

            const uiQuestions = await page
                .locator(".n-form-item-label__text, .font-bold.text-gray-default")
                .allTextContents();

            const cleanedUiQuestions = uiQuestions.map(q => q.replace("*", "").trim());

            for (const q of apiQuestions) {
                expect(cleanedUiQuestions).toContain(q.trim());
            }

            const uuid = await getTalentUuidByName(request, token, uniqueName);

            await deleteRound(request, token, projectId, roundId);
            await deleteRole(request, token, projectId, roleId);
            await deleteProject(request, token, projectId);
            await deleteTalent(request, token, uuid);
        });

    test("Register new talent and apply for the in-Person round: verify all mandatory questions show validation",
        async ({ page, request }) => {

            test.setTimeout(300000);

            const talentEmail = generateEmail();
            const token = await getAccessTokenSmartFromCasting(request, validLogin.email);

            const { response } = await createProject(request, token);
            const projectId = response.data.id;
            const projectName = response.data.title;

            await publishProject(request, token, projectId);
            await createRole(request, token, projectId);

            const roles = await getProjectRoles(request, token, projectId);
            const role = roles.data[0];
            expect(role).toBeDefined();
            const roleId = role.id;
            const roleName = role.role_name;

            await createInPersonRound(request, token, projectId, roleId);

            const rounds = await getProjectRounds(request, token, projectId);
            const round = rounds.data[0];
            expect(round).toBeDefined();
            const roundId = round.id;

            const textQuestion = await createTextQuestion(request, token, projectId, roundId, roleId, "Tell us about yourself");
            const checkboxQuestion = await createCheckboxQuestion(request, token, projectId, roundId, roleId, "Select your skills", ["Acting", "Singing", "Dancing"]);
            const radioQuestion = await createRadioQuestion(request, token, projectId, roundId, roleId, "Do you have acting experience?", ["Yes", "No"]);
            const dropdownQuestion = await createDropdownQuestion(request, token, projectId, roundId, roleId, "Select your country", ["USA", "UK", "Canada"]);
            const imageMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your profile photo", [1]);
            const videoMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your video performance", [2]);
            const audioMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your audio clip", [3]);
            const pdfMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your proposal pdf version", [4]);
            const availabilityQuestion = await createAvailabilityQuestion(request, token, projectId, roundId, roleId, "Select your availability", ["Morning", "Afternoon", "Evening"]);

            await makeTextQuestionAsMandory(request, token, projectId, roundId, roleId, "Tell us about yourself", textQuestion.data.question_id);
            await makeCheckboxQuestionAsMandotory(request, token, projectId, roundId, roleId, "Select your skills", ["Acting", "Singing", "Dancing"], checkboxQuestion.data.question_id);
            await makeRadioQuestionAsMandotory(request, token, projectId, roundId, roleId, "Do you have acting experience?", ["Yes", "No"], radioQuestion.data.question_id);
            await makeDropdownQuestionAsMandotory(request, token, projectId, roundId, roleId, "Select your country", ["USA", "UK", "Canada"], dropdownQuestion.data.question_id);

            await makeMediaQuestionAsMandotory(request, token, projectId, roundId, roleId, "Upload your profile photo", [1], imageMediaQuestion.data.question_id);
            await makeMediaQuestionAsMandotory(request, token, projectId, roundId, roleId, "Upload your video performance", [2], videoMediaQuestion.data.question_id);
            await makeMediaQuestionAsMandotory(request, token, projectId, roundId, roleId, "Upload your audio clip", [3], audioMediaQuestion.data.question_id);
            await makeMediaQuestionAsMandotory(request, token, projectId, roundId, roleId, "Upload your proposal pdf version", [4], pdfMediaQuestion.data.question_id);

            await makeAvailabilityQuestionAsMandotory(request, token, projectId, roundId, roleId, "Select your availability", ["Morning", "Afternoon", "Evening"], availabilityQuestion.data.question_id);

            await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);
            await applyRegistrationConfig(request, token, fullConfig);

            await expect.poll(async () => {
                const f = await getFieldsByPageId(request, 1, token);
                return f.length;
            }, { timeout: 60000 }).toBeGreaterThan(0);

            await page.goto(urls.talent, { waitUntil: "domcontentloaded" });

            const login = new LoginPage(page);
            await login.validTalentLogin(talentEmail);

            await expect(page.locator('[data-testid="auth-form"]')).toBeVisible();

            const otp = await getOtpFromMailtrap(request, talentEmail, 120000, false);
            if (!otp) {
                throw new Error("OTP not received from Mailtrap");
            }
            await enterOtpForTalent(page, otp);

            await page.waitForLoadState("networkidle");
            await expect(page.locator("form")).toBeVisible();

            const pages = await getAllPages(request, token);
            const talentRegisterPage = new TalentRegisterPage(page);
            const uniqueName = `Autom-Talent ${Date.now()}`;

            for (let i = 0; i < pages.length; i++) {

                const apiFields = await getFieldsByPageId(request, pages[i].id, token);

                for (const field of apiFields.filter(f => f.required)) {
                    switch (field.name) {
                        case "name": await talentRegisterPage.enterFullName(uniqueName); break;
                        case "stage_name": await talentRegisterPage.enterStageName("Automation Stage"); break;
                        case "location": await talentRegisterPage.setLocation("Colombo, LKA"); break;
                        case "gender": await talentRegisterPage.selectGender(1); break;
                        case "birth": await talentRegisterPage.openDOBAndSelectDate("20 Apr 1990"); break;
                        case "phone1": await talentRegisterPage.enterMobile("6152369"); break;
                        case "description": await talentRegisterPage.enterDescription("Automation Description"); break;
                    }
                }

                if (
                    apiFields.some(
                        f =>
                            ['Avatar', 'avatar', 'profile_photo'].includes(f.name) &&
                            f.required
                    )
                ) {

                    await talentRegisterPage.uploadProfilePicture();
                    await talentRegisterPage.saveCroppedProfilePicture();

                    console.log('Profile picture uploaded successfully.');
                }

                if (
                    apiFields.some(
                        f =>
                            ['Supported Media', 'supported_media', 'm_CmsQ'].includes(f.name) &&
                            f.required
                    )
                ) {

                    await talentRegisterPage.uploadRandomSupportedMedia();

                    console.log('Supported Media uploaded successfully.');
                }

                if (pages[i].page_no === 1) {
                    await talentRegisterPage.clickTermsAndConditionCheckBox();
                }

                await talentRegisterPage.clickContinueButton();

                if (i < pages.length - 1) {
                    const nextPage = pages[i + 1];
                    const nextFields = await getFieldsByPageId(request, nextPage.id, token);
                    const nextLabel = nextFields[0]?.label;

                    if (nextLabel) {
                        await expect(page.locator("form")).toContainText(nextLabel);
                    }
                }
            }

            await page.waitForLoadState("networkidle");
            const talentHome = new TalentHomePage(page);

            await expect(page.locator(talentAuditionPageLocators.auditionCards).first())
                .toBeVisible();

            await talentHome.enterProjectName(projectName);
            await talentHome.clickApplyForSearchedProject(roleName);
            const talentApply = new TalentApplyPage(page);
            await talentApply.clickApplyOnlineround();
            await talentApply.clickRoleSelector();
            await talentApply.clickSubmit();

            const errorLocator = page.locator(".n-form-item-feedback__line:visible");

            await expect(errorLocator.first()).toBeVisible();

            const errors = (await errorLocator.allTextContents())
                .map(e => e.trim())
                .filter(Boolean);

            console.log("Validation Errors:", errors);

            expect(errors).toEqual(expect.arrayContaining([
                "Value is required",
                "Media is required"
            ]));

            expect(errors.length).toBeGreaterThan(5);
            const uuid = await getTalentUuidByName(request, token, uniqueName);

            await deleteRound(request, token, projectId, roundId);
            await deleteRole(request, token, projectId, roleId);
            await deleteProject(request, token, projectId);
            await deleteTalent(request, token, uuid);
        });

    test("Register new talent and apply for the online-open round: with all questions filled",
        async ({ page, request }) => {

            test.setTimeout(300000);

            const talentEmail = generateEmail();
            const token = await getAccessTokenSmartFromCasting(request, validLogin.email);

            const { response } = await createProject(request, token);
            const projectId = response.data.id;
            const projectName = response.data.title;

            await publishProject(request, token, projectId);
            await createRole(request, token, projectId);

            const roles = await getProjectRoles(request, token, projectId);
            const role = roles.data[0];
            expect(role).toBeDefined();
            const roleId = role.id;
            const roleName = role.role_name;

            await createOnlineRound(request, token, projectId, roleId);

            const rounds = await getProjectRounds(request, token, projectId);
            const round = rounds.data[0];
            expect(round).toBeDefined();
            const roundId = round.id;

            const textQuestion = await createTextQuestion(request, token, projectId, roundId, roleId, "Tell us about yourself");

            const checkboxQuestion = await createCheckboxQuestion(
                request, token, projectId, roundId, roleId,
                "Select your skills", ["Acting", "Singing", "Dancing"]
            );

            const radioQuestion = await createRadioQuestion(
                request, token, projectId, roundId, roleId,
                "Do you have acting experience?", ["Yes", "No"]
            );

            const dropdownQuestion = await createDropdownQuestion(
                request, token, projectId, roundId, roleId,
                "Select your country", ["USA", "UK", "Canada"]
            );

            const imageMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your profile photo", [1]);
            const videoMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your video performance", [2]);
            const audioMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your audio clip", [3]);
            const pdfMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your proposal pdf version", [4]);

            const availabilityQuestion = await createAvailabilityQuestion(
                request, token, projectId, roundId, roleId,
                "Select your availability", ["Morning"]
            );

            await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);
            await applyRegistrationConfig(request, token, fullConfig);

            await expect.poll(async () => {
                const f = await getFieldsByPageId(request, 1, token);
                return f.length;
            }, { timeout: 60000 }).toBeGreaterThan(0);

            await page.goto(urls.talent, { waitUntil: "domcontentloaded" });

            const login = new LoginPage(page);
            await login.validTalentLogin(talentEmail);

            await expect(page.locator('[data-testid="auth-form"]')).toBeVisible();

            const otp = await getOtpFromMailtrap(request, talentEmail, 120000, false);
            if (!otp) {
                throw new Error("OTP not received from Mailtrap");
            } await enterOtpForTalent(page, otp);

            await page.waitForLoadState("networkidle");
            await expect(page.locator("form")).toBeVisible();

            const pages = await getAllPages(request, token);
            const talentRegisterPage = new TalentRegisterPage(page);
            const uniqueName = `Autom-Talent ${Date.now()}`;

            for (let i = 0; i < pages.length; i++) {

                const apiFields = await getFieldsByPageId(request, pages[i].id, token);

                for (const field of apiFields.filter(f => f.required)) {
                    switch (field.name) {
                        case "name": await talentRegisterPage.enterFullName(uniqueName); break;
                        case "stage_name": await talentRegisterPage.enterStageName("Automation Stage"); break;
                        case "location": await talentRegisterPage.setLocation("Colombo, LKA"); break;
                        case "gender": await talentRegisterPage.selectGender(1); break;
                        case "birth": await talentRegisterPage.openDOBAndSelectDate("20 Apr 1990"); break;
                        case "phone1": await talentRegisterPage.enterMobile("6152369"); break;
                        case "description": await talentRegisterPage.enterDescription("Automation Description"); break;
                    }
                }

                if (
                    apiFields.some(
                        f =>
                            ['Avatar', 'avatar', 'profile_photo'].includes(f.name) &&
                            f.required
                    )
                ) {

                    await talentRegisterPage.uploadProfilePicture();
                    await talentRegisterPage.saveCroppedProfilePicture();

                    console.log('Profile picture uploaded successfully.');
                }

                if (
                    apiFields.some(
                        f =>
                            ['Supported Media', 'supported_media', 'm_CmsQ'].includes(f.name) &&
                            f.required
                    )
                ) {

                    await talentRegisterPage.uploadRandomSupportedMedia();

                    console.log('Supported Media uploaded successfully.');
                }

                if (pages[i].page_no === 1) {
                    await talentRegisterPage.clickTermsAndConditionCheckBox();
                }

                await talentRegisterPage.clickContinueButton();

                if (i < pages.length - 1) {
                    const nextPage = pages[i + 1];
                    const nextFields = await getFieldsByPageId(request, nextPage.id, token);
                    const nextLabel = nextFields[0]?.label;

                    if (nextLabel) {
                        await expect(page.locator("form")).toContainText(nextLabel);
                    }
                }
            }

            await page.waitForLoadState("networkidle");

            const talentHome = new TalentHomePage(page);

            await expect(page.locator(talentAuditionPageLocators.auditionCards).first())
                .toBeVisible();

            await talentHome.enterProjectName(projectName);
            await talentHome.clickApplyForSearchedProject(roleName);

            const talentApply = new TalentApplyPage(page);
            await talentApply.clickApplyOnlineround();
            await talentApply.clickSubmit();

            await expect(page.getByText("Value is required")).toBeVisible();
            await talentApply.clickRoleSelector();
            await talentApply.enterSubmission("Test submission");
            await talentApply.selectSkills(["Acting", "Singing"]);
            await talentApply.selectRadioOption("Yes");
            await talentApply.selectCountry("USA");
            await talentApply.selectAvailability("Morning", "Yes");
            await talentApply.clickSubmit();

            await expect(page.getByText("Submitted")).toBeVisible();
            await expect(page.getByText(roleName)).toBeVisible();

            const names = await getProjectTalentNames(request, token, projectId);
            const uuid = await getTalentUuidByName(request, token, uniqueName);

            expect(names).toContain(uniqueName);

            const form = await getSubmittedForm(request, token, projectId, uuid);

            expect(form.data[0].question.question).toBe(textQuestion.data.question);
            expect(form.data[0].value[0].value.replace(/\s/g, "").toLowerCase())
                .toBe("<p>test submission</p>".replace(/\s/g, "").toLowerCase());

            expect(form.data[1].value.map(v => v.value.toLowerCase()))
                .toEqual(expect.arrayContaining(["acting", "singing"]));

            expect(form.data[2].value[0].value.toLowerCase()).toBe("yes");
            expect(form.data[3].value[0].value.toLowerCase()).toBe("usa");

            const availability = form.data[4].value[0].value[0];
            const selected = availability.selection.find((s: any) => s.is_selected);

            expect(selected.label).toBe("Yes");

            await deleteProject(request, token, projectId);
            await deleteTalent(request, token, uuid);
        });

    test("Register new talent and apply for the round: verify all relevant questions appear to the role",
        async ({ page, request }) => {

            test.setTimeout(300000);

            const talentEmail = generateEmail();
            const token = await getAccessTokenSmartFromCasting(request, validLogin.email);

            const { response } = await createProject(request, token);
            const projectId = response.data.id;
            const projectName = response.data.title;

            await publishProject(request, token, projectId);
            await createRole(request, token, projectId);

            const roles = await getProjectRoles(request, token, projectId);
            const role = roles.data[0];
            expect(role).toBeDefined();
            const roleId = role.id;
            const roleName = role.role_name;

            await createInPersonRound(request, token, projectId, roleId);

            const rounds = await getProjectRounds(request, token, projectId);
            const round = rounds.data[0];
            expect(round).toBeDefined();
            const roundId = round.id;

            const textQuestion = await createTextQuestion(request, token, projectId, roundId, roleId, "Tell us about yourself");
            const checkboxQuestion = await createCheckboxQuestion(request, token, projectId, roundId, roleId, "Select your skills", ["Acting", "Singing", "Dancing"]);
            const radioQuestion = await createRadioQuestion(request, token, projectId, roundId, roleId, "Do you have acting experience?", ["Yes", "No"]);
            const dropdownQuestion = await createDropdownQuestion(request, token, projectId, roundId, roleId, "Select your country", ["USA", "UK", "Canada"]);
            const imageMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your profile photo", [1]);
            const videoMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your audio clip", [2]);
            const audioMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your video performance", [3]);
            const pdfMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your proposal pdf version", [4]);
            const availabilityQuestion = await createAvailabilityQuestion(request, token, projectId, roundId, roleId, "Select your availability", ["Morning", "Afternoon", "Evening"]);

            await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);

            // Create ROUND 2 (should NOT appear)
            await createOnlineRound(request, token, projectId, roleId);

            const allRounds = await getProjectRounds(request, token, projectId);
            const round2 = allRounds.data[1];
            expect(round2).toBeDefined();
            const roundId2 = round2.id;

            await createTextQuestion(request, token, projectId, roundId2, roleId, "SHOULD NOT BE VISIBLE");
            await updateRoundSubmissionStatus(request, token, projectId, roundId2, 1);

            await applyRegistrationConfig(request, token, fullConfig);

            await expect.poll(async () => {
                const f = await getFieldsByPageId(request, 1, token);
                return f.length;
            }, { timeout: 60000 }).toBeGreaterThan(0);

            await page.goto(urls.talent, { waitUntil: "domcontentloaded" });

            const login = new LoginPage(page);
            await login.validTalentLogin(talentEmail);

            await expect(page.locator('[data-testid="auth-form"]')).toBeVisible();

            const otp = await getOtpFromMailtrap(request, talentEmail, 120000, false);
            if (!otp) {
                throw new Error("OTP not received from Mailtrap");
            } await enterOtpForTalent(page, otp);

            await page.waitForLoadState("networkidle");
            await expect(page.locator("form")).toBeVisible();

            const pages = await getAllPages(request, token);
            const talentRegisterPage = new TalentRegisterPage(page);
            const uniqueName = `Autom-Talent ${Date.now()}`;

            for (let i = 0; i < pages.length; i++) {

                const apiFields = await getFieldsByPageId(request, pages[i].id, token);

                for (const field of apiFields.filter(f => f.required)) {
                    switch (field.name) {
                        case "name": await talentRegisterPage.enterFullName(uniqueName); break;
                        case "stage_name": await talentRegisterPage.enterStageName("Automation Stage"); break;
                        case "location": await talentRegisterPage.setLocation("Colombo, LKA"); break;
                        case "gender": await talentRegisterPage.selectGender(1); break;
                        case "birth": await talentRegisterPage.openDOBAndSelectDate("20 Apr 1990"); break;
                        case "phone1": await talentRegisterPage.enterMobile("6152369"); break;
                        case "description": await talentRegisterPage.enterDescription("Automation Description"); break;
                    }
                }

                if (
                    apiFields.some(
                        f =>
                            ['Avatar', 'avatar', 'profile_photo'].includes(f.name) &&
                            f.required
                    )
                ) {

                    await talentRegisterPage.uploadProfilePicture();
                    await talentRegisterPage.saveCroppedProfilePicture();

                    console.log('Profile picture uploaded successfully.');
                }

                if (
                    apiFields.some(
                        f =>
                            ['Supported Media', 'supported_media', 'm_CmsQ'].includes(f.name) &&
                            f.required
                    )
                ) {

                    await talentRegisterPage.uploadRandomSupportedMedia();

                    console.log('Supported Media uploaded successfully.');
                }

                if (pages[i].page_no === 1) {
                    await talentRegisterPage.clickTermsAndConditionCheckBox();
                }

                await talentRegisterPage.clickContinueButton();

                if (i < pages.length - 1) {
                    const nextPage = pages[i + 1];
                    const nextFields = await getFieldsByPageId(request, nextPage.id, token);
                    const nextLabel = nextFields[0]?.label;

                    if (nextLabel) {
                        await expect(page.locator("form")).toContainText(nextLabel);
                    }
                }
            }

            await page.waitForLoadState("networkidle");

            // 🔹 Apply flow
            const talentHome = new TalentHomePage(page);

            await expect(page.locator(talentAuditionPageLocators.auditionCards).first())
                .toBeVisible();

            await talentHome.enterProjectName(projectName);
            await talentHome.clickApplyForSearchedProject(roleName);

            const talentApply = new TalentApplyPage(page);
            await talentApply.clickApplyOnlineround();
            await talentApply.clickRoleSelector();

            await expect(page.getByText("New Application")).toBeVisible();

            const expectedQuestions = [
                textQuestion.data.question,
                checkboxQuestion.data.question,
                radioQuestion.data.question,
                dropdownQuestion.data.question,
                imageMediaQuestion.data.question,
                videoMediaQuestion.data.question,
                audioMediaQuestion.data.question,
                pdfMediaQuestion.data.question,
                availabilityQuestion.data.question
            ];

            const uiQuestions = await page
                .locator(".n-form-item-label__text, .font-bold.text-gray-default")
                .allTextContents();

            const cleanedUiQuestions = uiQuestions.map(q => q.replace("*", "").trim());

            for (const q of expectedQuestions) {
                expect(cleanedUiQuestions).toContain(q.trim());
            }

            const uuid = await getTalentUuidByName(request, token, uniqueName);

            await deleteProject(request, token, projectId);
            await deleteTalent(request, token, uuid);
        });

    test("Register new talent and apply for the round: verify inactive questions are not appear to the role",
        async ({ page, request }) => {

            test.setTimeout(300000);

            const talentEmail = generateEmail();
            const token = await getAccessTokenSmartFromCasting(request, validLogin.email);

            // Create project
            const { response } = await createProject(request, token);
            const projectId = response.data.id;
            const projectName = response.data.title;

            await publishProject(request, token, projectId);
            await createRole(request, token, projectId);

            const roles = await getProjectRoles(request, token, projectId);
            const role = roles.data[0];
            expect(role).toBeDefined();
            const roleId = role.id;
            const roleName = role.role_name;
            // Create round
            await createInPersonRound(request, token, projectId, roleId);

            const rounds = await getProjectRounds(request, token, projectId);
            const round = rounds.data[0];
            const roundId = round.id;

            // Create questions
            const textQuestion = await createTextQuestion(request, token, projectId, roundId, roleId, "Tell us about yourself");
            const checkboxQuestion = await createCheckboxQuestion(request, token, projectId, roundId, roleId, "Select your skills", ["Acting", "Singing", "Dancing"]);
            const radioQuestion = await createRadioQuestion(request, token, projectId, roundId, roleId, "Do you have acting experience?", ["Yes", "No"]);
            const dropdownQuestion = await createDropdownQuestion(request, token, projectId, roundId, roleId, "Select your country", ["USA", "UK", "Canada"]);
            const imageMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your profile photo", [1]);
            const videoMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your audio clip", [2]);
            const audioMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your video performance", [3]);
            const pdfMediaQuestion = await createMediaQuestion(request, token, projectId, roundId, roleId, "Upload your proposal pdf version", [4]);
            const availabilityQuestion = await createAvailabilityQuestion(request, token, projectId, roundId, roleId, "Select your availability", ["Morning", "Afternoon", "Evening"]);

            await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);

            // Registration config
            await applyRegistrationConfig(request, token, fullConfig);

            await expect.poll(async () => {
                const f = await getFieldsByPageId(request, 1, token);
                return f.length;
            }, { timeout: 60000 }).toBeGreaterThan(0);

            await page.goto(urls.talent, { waitUntil: "domcontentloaded" });

            const login = new LoginPage(page);
            await login.validTalentLogin(talentEmail);

            await expect(page.locator('[data-testid="auth-form"]')).toBeVisible();
            const otp = await getOtpFromMailtrap(request, talentEmail, 120000, false);
            if (!otp) {
                throw new Error("OTP not received from Mailtrap");
            } await enterOtpForTalent(page, otp);

            await page.waitForLoadState("networkidle");
            await expect(page.locator("form")).toBeVisible();

            const pages = await getAllPages(request, token);
            const talentRegisterPage = new TalentRegisterPage(page);
            const uniqueName = `Autom-Talent ${Date.now()}`;

            for (let i = 0; i < pages.length; i++) {

                const apiFields = await getFieldsByPageId(request, pages[i].id, token);

                for (const field of apiFields.filter(f => f.required)) {
                    switch (field.name) {
                        case "name": await talentRegisterPage.enterFullName(uniqueName); break;
                        case "stage_name": await talentRegisterPage.enterStageName("Automation Stage"); break;
                        case "location": await talentRegisterPage.setLocation("Colombo, LKA"); break;
                        case "gender": await talentRegisterPage.selectGender(1); break;
                        case "birth": await talentRegisterPage.openDOBAndSelectDate("20 Apr 1990"); break;
                        case "phone1": await talentRegisterPage.enterMobile("6152369"); break;
                        case "description": await talentRegisterPage.enterDescription("Automation Description"); break;
                    }
                }

                if (
                    apiFields.some(
                        f =>
                            ['Avatar', 'avatar', 'profile_photo'].includes(f.name) &&
                            f.required
                    )
                ) {

                    await talentRegisterPage.uploadProfilePicture();
                    await talentRegisterPage.saveCroppedProfilePicture();

                    console.log('Profile picture uploaded successfully.');
                }

                if (
                    apiFields.some(
                        f =>
                            ['Supported Media', 'supported_media', 'm_CmsQ'].includes(f.name) &&
                            f.required
                    )
                ) {

                    await talentRegisterPage.uploadRandomSupportedMedia();

                    console.log('Supported Media uploaded successfully.');
                }

                if (pages[i].page_no === 1) {
                    await talentRegisterPage.clickTermsAndConditionCheckBox();
                }

                await talentRegisterPage.clickContinueButton();
            }

            await page.waitForLoadState("networkidle");

            // 🔹 Apply flow
            const talentHome = new TalentHomePage(page);

            await expect(page.locator(talentAuditionPageLocators.auditionCards).first())
                .toBeVisible();

            await talentHome.enterProjectName(projectName);
            await talentHome.clickApplyForSearchedProject(roleName);

            const talentApply = new TalentApplyPage(page);
            await talentApply.clickApplyOnlineround();
            await talentApply.clickRoleSelector();

            await expect(page.getByText("New Application")).toBeVisible();

            const allQuestions = [
                textQuestion.data.question,
                checkboxQuestion.data.question,
                radioQuestion.data.question
            ];

            const uiBefore = await page.locator(".n-form-item-label__text").allTextContents();
            const cleanedBefore = uiBefore.map(q => q.replace("*", "").trim());

            for (const q of allQuestions) {
                expect(cleanedBefore).toContain(q);
            }

            // Make some inactive
            await makeTextQuestionAsInactive(request, token, projectId, roundId, roleId, "Tell us about yourself", textQuestion.data.question_id);
            await makeCheckboxQuestionAsInactive(request, token, projectId, roundId, roleId, "Select your skills", ["Acting", "Singing", "Dancing"], checkboxQuestion.data.question_id);
            await page.reload({ waitUntil: "networkidle" });

            await talentApply.clickRoleSelector();
            await expect(page.getByText("New Application")).toBeVisible();

            // Read UI again
            const uiAfter = await page.locator(".n-form-item-label__text").allTextContents();
            const cleanedAfter = uiAfter.map(q => q.replace("*", "").trim());

            // positive checks 
            expect(cleanedAfter).toContain(radioQuestion.data.question);

            expect(cleanedAfter).not.toContain(textQuestion.data.question);
            expect(cleanedAfter).not.toContain(checkboxQuestion.data.question);

            const uuid = await getTalentUuidByName(request, token, uniqueName);

            await deleteProject(request, token, projectId);
            await deleteTalent(request, token, uuid);
        });


});