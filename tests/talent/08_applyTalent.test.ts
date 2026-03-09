import { getAccessTokenSmart } from "@/helpers/api/authApi";
import { createProject, deleteProject, publishProject } from "@/helpers/api/projectApi";
import { createRole, deleteRole, getProjectRoles } from "@/helpers/api/roleApi";
import { createInPersonRound, createOnlineRound, deleteRound, getProjectRounds, updateRoundSubmissionStatus } from "@/helpers/api/roundApi";
import { applyRegistrationConfig, deleteTalent, getAllPages, getFieldsByPageId, getProjectTalentNames, getTalentUuidByName, updateTalentRegistration } from "@/helpers/api/talentApi";
import { fullConfig } from "@/test-data/dataModelConfig";
import { validLogin } from "@/test-data/loginData";
import { urls } from "@/utils/urls";
import LoginPage from "../../pages/talent/login/loginPage";
import { test, expect } from './_setup/talentTest';
import { APIRequestContext } from "playwright";
import { enterOtpForTalent, getOtpFromMailtrap } from "@/utils/mailtrapOtp";
import { TalentRegisterPage } from "@/pages/talent/register/registerPage";
import { TalentHomePage } from "@/pages/talent/home/homePage";
import { generateEmail } from "@/test-data/random-data";
import { createAvailabilityQuestion, createCheckboxQuestion, createDropdownQuestion, createMediaQuestion, createRadioQuestion, createTextQuestion, getSubmittedForm, makeAvailabilityQuestionAsMandotory, makeCheckboxQuestionAsInactive, makeCheckboxQuestionAsMandotory, makeDropdownQuestionAsMandotory, makeMediaQuestionAsMandotory, makeRadioQuestionAsMandotory, makeTextQuestionAsInactive, makeTextQuestionAsMandory, updateQuestionAsInactive } from "@/helpers/api/questionApi";
import { TalentApplyPage } from "@/pages/talent/apply/applyRoundPage";

test.describe('Apply talent scenarioes', () => {

    let token: string;

    test.beforeAll(async ({ request }) => {
        token = await getAccessTokenSmart(request, validLogin.email);
    });

    test("Register new talent and apply for the online-open round: without questions (including failure cases)", async ({ page, request }) => {

        //create project, role, round 
        const talentEmail = generateEmail();

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
        const roundName = round.round_name;

        await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);
        test.setTimeout(350000);

        /* register talent */
        // create authenticated API context ONCE
        await page.waitForTimeout(30000);

        //config preperation
        await applyRegistrationConfig(request, token, fullConfig);
        await page.waitForTimeout(30000);

        await expect.poll(async () => {
            const f = await getFieldsByPageId(request, 1, token);
            return f.length;
        }).toBeGreaterThan(0);
        await page.waitForTimeout(30000);

        //open talent UI
        await page.goto(urls.talent, { waitUntil: "domcontentloaded" });

        const login = new LoginPage(page);
        await login.validTalentLogin(talentEmail);
        await page.waitForTimeout(5000);

        const otp = await getOtpFromMailtrap(request, talentEmail, 120000);
        await page.waitForTimeout(25000);

        await enterOtpForTalent(page, otp);
        await page.waitForTimeout(30000);

        //get pages  
        const pages = await getAllPages(request, token);
        const talentRegisterPage = new TalentRegisterPage(page);
        const uniqueName = `Autom-Talent ${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        for (let i = 0; i < pages.length; i++) {

            const p = pages[i];
            console.log("Checking page:", p.name);

            //get active fields 
            const apiFields = await getFieldsByPageId(request, p.id, token);
            const expectedLabels = apiFields.map(f => f.label.trim());

            console.log("API Labels:", expectedLabels);

            //read UI
            let uiLabelsRaw = await page.locator("form label:visible").allTextContents();

            if (uiLabelsRaw.length === 0) {
                uiLabelsRaw = await page.locator(".font-bold:visible").allTextContents();
            }

            let cleanedUiLabels = uiLabelsRaw
                .map(l => l.replace("*", "").trim())
                .filter(l => expectedLabels.includes(l));

            console.log("UI Labels:", cleanedUiLabels);

            // validate labels match API
            for (const expected of expectedLabels) {
                expect(cleanedUiLabels).toContain(expected);
            }

            // validate required fields
            for (const field of apiFields) {
                if (!field.required) continue;

                const label = page
                    .locator(".n-form-item-label__text")
                    .filter({ hasText: new RegExp(`^${field.label}\\b`) });

                if (await label.count() === 0) {
                    console.log(`Skipping star check for ${field.label}`);
                    continue;
                }

                await expect(label.first()).toContainText("*");
            }

            // fill required fields
            const requiredFields = apiFields.filter(f => f.required);

            for (const field of requiredFields) {
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

                    case "description":
                        await talentRegisterPage.enterDescription("Automation Description");
                        break;
                }
            }

            //upload
            const isUploadPage = apiFields.some(f => f.name === "avatar" || f.name === "profile_photo");

            if (isUploadPage) {
                await talentRegisterPage.uploadProfilePicture();
                await talentRegisterPage.saveCroppedProfilePicture();
            }

            // terms and conditions
            if (p.page_no === 1) {
                await talentRegisterPage.clickTermsAndConditionCheckBox();
            }

            //continue
            await talentRegisterPage.clickContinueButton();

            if (i < pages.length - 1) {
                const nextPage = pages[i + 1];

                const nextFields = await getFieldsByPageId(request, nextPage.id, token);
                const nextLabel = nextFields[0]?.label;

                if (nextLabel) {
                    await page.getByText(nextLabel, { exact: false }).waitFor();
                }
            }
        }

        await page.waitForTimeout(30000);
        await page.waitForURL(urls.talent, { timeout: 60000 });

        /* apply talent */
        const talentHome = new TalentHomePage(page)
        talentHome.enterProjectName(projectName);
        talentHome.clickApplyForSearchedProject();

        const talentApply = new TalentApplyPage(page)
        talentApply.clickApplyOnlineround();
        talentApply.clickSubmit();

        expect((await talentApply.getEmptyRoleError())?.trim()).toBe("Value is required");
        await page.waitForTimeout(3000);

        talentApply.clickRoleSelector();
        await page.waitForTimeout(3000);

        talentApply.clickSubmit();
        await page.waitForTimeout(10000);

        //to be true
        expect((await talentApply.getSubmitedTagText())?.trim()).toBe("Submitted");
        expect((await talentApply.getSubmitedRole())?.trim()).toBe(roleName);
        const names = await getProjectTalentNames(request, token, projectId);
        expect(names).toContain(uniqueName);

        //delete data
        await deleteRound(request, token, projectId, roundId);
        await deleteRole(request, token, projectId, roleId);
        await deleteProject(request, token, projectId);
        const uuid = await getTalentUuidByName(request, token, uniqueName)
        await deleteTalent(request, token, uuid);

    });

    test("Register new talent and apply for the in-Person open round: without questions (including failure cases)", async ({ page, request }) => {

        //create project, role, round 
        const token = await getAccessTokenSmart(request, validLogin.email);
        const talentEmail = generateEmail();
        const uniqueName = `Autom-Talent ${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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
        const roundName = round.round_name;

        await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);
        test.setTimeout(350000);

        /* register talent */
        // create authenticated API context ONCE
        await page.waitForTimeout(30000);

        //config preperation
        await applyRegistrationConfig(request, token, fullConfig);
        await page.waitForTimeout(30000);

        await expect.poll(async () => {
            const f = await getFieldsByPageId(request, 1, token);
            return f.length;
        }).toBeGreaterThan(0);
        await page.waitForTimeout(30000);

        //open talent UI
        await page.goto(urls.talent, { waitUntil: "domcontentloaded" });

        const login = new LoginPage(page);
        await login.validTalentLogin(talentEmail);
        await page.waitForTimeout(5000);

        const otp = await getOtpFromMailtrap(request, talentEmail, 120000);
        await page.waitForTimeout(25000);

        await enterOtpForTalent(page, otp);
        await page.waitForTimeout(30000);

        //get pages 
        const pages = await getAllPages(request, token);
        const talentRegisterPage = new TalentRegisterPage(page);

        for (let i = 0; i < pages.length; i++) {

            const p = pages[i];
            console.log("Checking page:", p.name);

            //get active fields 
            const apiFields = await getFieldsByPageId(request, p.id, token);
            const expectedLabels = apiFields.map(f => f.label.trim());

            console.log("API Labels:", expectedLabels);

            //read UI
            let uiLabelsRaw = await page.locator("form label:visible").allTextContents();

            if (uiLabelsRaw.length === 0) {
                uiLabelsRaw = await page.locator(".font-bold:visible").allTextContents();
            }

            let cleanedUiLabels = uiLabelsRaw
                .map(l => l.replace("*", "").trim())
                .filter(l => expectedLabels.includes(l));

            console.log("UI Labels:", cleanedUiLabels);

            // validate labels match API
            for (const expected of expectedLabels) {
                expect(cleanedUiLabels).toContain(expected);
            }

            // validate required fields
            for (const field of apiFields) {
                if (!field.required) continue;

                const label = page
                    .locator(".n-form-item-label__text")
                    .filter({ hasText: new RegExp(`^${field.label}\\b`) });

                if (await label.count() === 0) {
                    console.log(`Skipping star check for ${field.label}`);
                    continue;
                }

                await expect(label.first()).toContainText("*");
            }

            // fill required fields
            const requiredFields = apiFields.filter(f => f.required);

            for (const field of requiredFields) {
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

                    case "description":
                        await talentRegisterPage.enterDescription("Automation Description");
                        break;
                }
            }

            //upload
            const isUploadPage = apiFields.some(f => f.name === "avatar" || f.name === "profile_photo");

            if (isUploadPage) {
                await talentRegisterPage.uploadProfilePicture();
                await talentRegisterPage.saveCroppedProfilePicture();
            }

            // terms and conditions
            if (p.page_no === 1) {
                await talentRegisterPage.clickTermsAndConditionCheckBox();
            }

            //continue
            await talentRegisterPage.clickContinueButton();

            if (i < pages.length - 1) {
                const nextPage = pages[i + 1];
                const nextFields = await getFieldsByPageId(request, nextPage.id, token);
                const nextLabel = nextFields[0]?.label;

                if (nextLabel) {
                    await page.getByText(nextLabel, { exact: false }).waitFor();
                }
            }
        }


        await page.waitForTimeout(30000);
        await page.waitForURL(urls.talent, { timeout: 60000 });


        /* apply talent */
        const talentHome = new TalentHomePage(page)
        talentHome.enterProjectName(projectName);
        talentHome.clickApplyForSearchedProject();

        const talentApply = new TalentApplyPage(page)
        talentApply.clickApplyOnlineround();
        talentApply.clickSubmit();

        expect((await talentApply.getEmptyRoleError())?.trim()).toBe("Value is required");
        await page.waitForTimeout(3000);

        talentApply.clickRoleSelector();
        await page.waitForTimeout(3000);

        talentApply.clickSubmit();
        await page.waitForTimeout(10000);

        //to be true
        expect((await talentApply.getSubmitedTagText())?.trim()).toBe("Submitted");
        expect((await talentApply.getSubmitedRole())?.trim()).toBe(roleName);
        const names = await getProjectTalentNames(request, token, projectId);
        expect(names).toContain(uniqueName);

        //delete data
        await deleteRound(request, token, projectId, roundId);
        await deleteRole(request, token, projectId, roleId);
        await deleteProject(request, token, projectId);
        const uuid = await getTalentUuidByName(request, token, uniqueName)
        await deleteTalent(request, token, uuid);

    });

    test("Register new talent and apply for the online-open round: verify all questions appear", async ({ page, request }) => {

        const talentEmail = generateEmail();
        const token = await getAccessTokenSmart(request, validLogin.email);

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
        await createOnlineRound(request, token, projectId, roleId);

        const rounds = await getProjectRounds(request, token, projectId);
        const round = rounds.data[0];
        expect(round).toBeDefined();

        const roundId = round.id;

        // Create Questions
        const textQuestion = await createTextQuestion(
            request, token, projectId, roundId, roleId,
            "Tell us about yourself"
        );

        const checkboxQuestion = await createCheckboxQuestion(
            request, token, projectId, roundId, roleId,
            "Select your skills",
            ["Acting", "Singing", "Dancing"]
        );

        const radioQuestion = await createRadioQuestion(
            request, token, projectId, roundId, roleId,
            "Do you have acting experience?",
            ["Yes", "No"]
        );

        const dropdownQuestion = await createDropdownQuestion(
            request, token, projectId, roundId, roleId,
            "Select your country",
            ["USA", "UK", "Canada"]
        );

        const imageMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your profile photo",
            [1]
        );

        const vedioMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your audio clip",
            [2]
        );

        const audioMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your video performance",
            [3]
        );

        const pdfMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your proposal pdf version",
            [4]
        );

        const availabilityQuestion = await createAvailabilityQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Select your availability",
            ["Morning", "Afternoon", "Evening"]
        );

        await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);
        test.setTimeout(350000);

        // Talent Registration
        await applyRegistrationConfig(request, token, fullConfig);

        await expect.poll(async () => {
            const f = await getFieldsByPageId(request, 1, token);
            return f.length;
        }).toBeGreaterThan(0);

        await page.goto(urls.talent, { waitUntil: "domcontentloaded" });

        const login = new LoginPage(page);
        await login.validTalentLogin(talentEmail);

        const otp = await getOtpFromMailtrap(request, talentEmail, 120000);
        await enterOtpForTalent(page, otp);

        const pages = await getAllPages(request, token);
        const talentRegisterPage = new TalentRegisterPage(page);

        const uniqueName = `Autom-Talent ${Date.now()}`;

        for (let i = 0; i < pages.length; i++) {

            const apiFields = await getFieldsByPageId(request, pages[i].id, token);

            const requiredFields = apiFields.filter(f => f.required);

            for (const field of requiredFields) {

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

                    case "description":
                        await talentRegisterPage.enterDescription("Automation Description");
                        break;
                }
            }

            const isUploadPage = apiFields.some(f => f.name === "avatar");

            if (isUploadPage) {
                await talentRegisterPage.uploadProfilePicture();
                await talentRegisterPage.saveCroppedProfilePicture();
            }

            if (pages[i].page_no === 1) {
                await talentRegisterPage.clickTermsAndConditionCheckBox();
            }

            await talentRegisterPage.clickContinueButton();
        }

        await page.waitForURL(urls.talent);

        // Apply for Round
        const talentHome = new TalentHomePage(page);
        talentHome.enterProjectName(projectName);
        talentHome.clickApplyForSearchedProject();

        const talentApply = new TalentApplyPage(page);

        await talentApply.clickApplyOnlineround();
        talentApply.clickRoleSelector();
        await page.waitForTimeout(3000);

        await expect(
            page.getByText("New Application", { exact: true })
        ).toBeVisible({ timeout: 10000 });

        // Verify Questions
        const apiQuestions = [
            textQuestion.data.question,
            checkboxQuestion.data.question,
            radioQuestion.data.question,
            dropdownQuestion.data.question,
            imageMediaQuestion.data.question,
            vedioMediaQuestion.data.question,
            audioMediaQuestion.data.question,
            pdfMediaQuestion.data.question,
            availabilityQuestion.data.question
        ];
        console.log("API Questions: ", apiQuestions)

        const uiQuestions = await page
            .locator(".n-form-item-label__text, .font-bold.text-gray-default")
            .allTextContents();

        const cleanedUiQuestions = uiQuestions.map(q => q.replace("*", "").trim());

        console.log("UI Questions:", cleanedUiQuestions);

        for (const q of apiQuestions) {
            expect(cleanedUiQuestions).toContain(q.trim());
        }

        // Cleanup
        const uuid = await getTalentUuidByName(request, token, uniqueName);

        await deleteRound(request, token, projectId, roundId);
        await deleteRole(request, token, projectId, roleId);
        await deleteProject(request, token, projectId);
        await deleteTalent(request, token, uuid);

    });

    test("Register new talent and apply for the online-open round: verify all mandatory questions show validation", async ({ page, request }) => {

        const talentEmail = generateEmail();
        const token = await getAccessTokenSmart(request, validLogin.email);

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

        // Create round
        await createOnlineRound(request, token, projectId, roleId);

        const rounds = await getProjectRounds(request, token, projectId);
        const round = rounds.data[0];
        expect(round).toBeDefined();

        const roundId = round.id;

        // Create Questions
        const textQuestion = await createTextQuestion(
            request, token, projectId, roundId, roleId,
            "Tell us about yourself"
        );

        const checkboxQuestion = await createCheckboxQuestion(
            request, token, projectId, roundId, roleId,
            "Select your skills",
            ["Acting", "Singing", "Dancing"]
        );

        const radioQuestion = await createRadioQuestion(
            request, token, projectId, roundId, roleId,
            "Do you have acting experience?",
            ["Yes", "No"]
        );

        const dropdownQuestion = await createDropdownQuestion(
            request, token, projectId, roundId, roleId,
            "Select your country",
            ["USA", "UK", "Canada"]
        );

        const imageMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your profile photo",
            [1]
        );

        const vedioMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your video performance",
            [2]
        );

        const audioMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your audio clip",
            [3]
        );

        const pdfMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your proposal pdf version",
            [4]
        );

        const availabilityQuestion = await createAvailabilityQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Select your availability",
            ["Morning", "Afternoon", "Evening"]
        );


        // Make Questions Mandatory
        await makeTextQuestionAsMandory(request, token, projectId, roundId, roleId,
            "Tell us about yourself", textQuestion.data.question_id
        );
        await makeCheckboxQuestionAsMandotory(request, token, projectId, roundId, roleId,
            "Select your skills",
            ["Acting", "Singing", "Dancing"], checkboxQuestion.data.question_id);

        await makeRadioQuestionAsMandotory(request, token, projectId, roundId, roleId,
            "Do you have acting experience?",
            ["Yes", "No"], radioQuestion.data.question_id);

        await makeDropdownQuestionAsMandotory(request, token, projectId, roundId, roleId,
            "Select your country",
            ["USA", "UK", "Canada"], dropdownQuestion.data.question_id);

        await makeMediaQuestionAsMandotory(request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your profile photo",
            [1], imageMediaQuestion.data.question_id);

        await makeMediaQuestionAsMandotory(request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your video performance",
            [2], vedioMediaQuestion.data.question_id);

        await makeMediaQuestionAsMandotory(request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your audio clip",
            [3], audioMediaQuestion.data.question_id);

        await makeMediaQuestionAsMandotory(request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your proposal pdf version",
            [4], pdfMediaQuestion.data.question_id);


        await makeAvailabilityQuestionAsMandotory(request,
            token,
            projectId,
            roundId,
            roleId,
            "Select your availability",
            ["Morning", "Afternoon", "Evening"], availabilityQuestion.data.question_id);

        await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);

        test.setTimeout(350000);

        // Talent Registration
        await applyRegistrationConfig(request, token, fullConfig);

        await expect.poll(async () => {
            const f = await getFieldsByPageId(request, 1, token);
            return f.length;
        }).toBeGreaterThan(0);

        await page.goto(urls.talent);

        const login = new LoginPage(page);
        await login.validTalentLogin(talentEmail);

        const otp = await getOtpFromMailtrap(request, talentEmail, 120000);
        await enterOtpForTalent(page, otp);

        const pages = await getAllPages(request, token);
        const talentRegisterPage = new TalentRegisterPage(page);

        const uniqueName = `Autom-Talent ${Date.now()}`;

        for (let i = 0; i < pages.length; i++) {

            const apiFields = await getFieldsByPageId(request, pages[i].id, token);
            const requiredFields = apiFields.filter(f => f.required);

            for (const field of requiredFields) {

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

                    case "description":
                        await talentRegisterPage.enterDescription("Automation Description");
                        break;
                }
            }

            const isUploadPage = apiFields.some(f => f.name === "avatar");

            if (isUploadPage) {
                await talentRegisterPage.uploadProfilePicture();
                await talentRegisterPage.saveCroppedProfilePicture();
            }

            if (pages[i].page_no === 1) {
                await talentRegisterPage.clickTermsAndConditionCheckBox();
            }

            await talentRegisterPage.clickContinueButton();
        }

        await page.waitForURL(urls.talent);

        // Apply for Round
        const talentHome = new TalentHomePage(page);
        talentHome.enterProjectName(projectName);
        talentHome.clickApplyForSearchedProject();

        const talentApply = new TalentApplyPage(page);

        await talentApply.clickApplyOnlineround();

        talentApply.clickRoleSelector();
        await page.waitForTimeout(3000);

        // Submit without answering
        await talentApply.clickSubmit();

        // Verify Required Errors
        const errors = (await page
            .locator(".n-form-item-feedback__line")
            .allTextContents())
            .map(e => e.trim());

        console.log("Validation Errors:", errors);

        expect(errors).toEqual(
            expect.arrayContaining([
                "Value is required",
                "Media is required"
            ])
        );

        expect(errors.length).toBe(11);

        // Cleanup
        const uuid = await getTalentUuidByName(request, token, uniqueName);

        await deleteRound(request, token, projectId, roundId);
        await deleteRole(request, token, projectId, roleId);
        await deleteProject(request, token, projectId);
        await deleteTalent(request, token, uuid);

    });

    test("Register new talent and apply for the in-Person round: verify all questions appear", async ({ page, request }) => {

        const talentEmail = generateEmail();
        const token = await getAccessTokenSmart(request, validLogin.email);

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
        expect(round).toBeDefined();

        const roundId = round.id;

        // Create Questions
        const textQuestion = await createTextQuestion(
            request, token, projectId, roundId, roleId,
            "Tell us about yourself"
        );

        const checkboxQuestion = await createCheckboxQuestion(
            request, token, projectId, roundId, roleId,
            "Select your skills",
            ["Acting", "Singing", "Dancing"]
        );

        const radioQuestion = await createRadioQuestion(
            request, token, projectId, roundId, roleId,
            "Do you have acting experience?",
            ["Yes", "No"]
        );

        const dropdownQuestion = await createDropdownQuestion(
            request, token, projectId, roundId, roleId,
            "Select your country",
            ["USA", "UK", "Canada"]
        );

        const imageMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your profile photo",
            [1]
        );

        const vedioMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your audio clip",
            [2]
        );

        const audioMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your video performance",
            [3]
        );

        const pdfMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your proposal pdf version",
            [4]
        );

        const availabilityQuestion = await createAvailabilityQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Select your availability",
            ["Morning", "Afternoon", "Evening"]
        );

        await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);
        test.setTimeout(350000);

        // Talent Registration
        await applyRegistrationConfig(request, token, fullConfig);

        await expect.poll(async () => {
            const f = await getFieldsByPageId(request, 1, token);
            return f.length;
        }).toBeGreaterThan(0);

        await page.goto(urls.talent, { waitUntil: "domcontentloaded" });

        const login = new LoginPage(page);
        await login.validTalentLogin(talentEmail);

        const otp = await getOtpFromMailtrap(request, talentEmail, 120000);
        await enterOtpForTalent(page, otp);

        const pages = await getAllPages(request, token);
        const talentRegisterPage = new TalentRegisterPage(page);

        const uniqueName = `Autom-Talent ${Date.now()}`;

        for (let i = 0; i < pages.length; i++) {

            const apiFields = await getFieldsByPageId(request, pages[i].id, token);

            const requiredFields = apiFields.filter(f => f.required);

            for (const field of requiredFields) {

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

                    case "description":
                        await talentRegisterPage.enterDescription("Automation Description");
                        break;
                }
            }

            const isUploadPage = apiFields.some(f => f.name === "avatar");

            if (isUploadPage) {
                await talentRegisterPage.uploadProfilePicture();
                await talentRegisterPage.saveCroppedProfilePicture();
            }

            if (pages[i].page_no === 1) {
                await talentRegisterPage.clickTermsAndConditionCheckBox();
            }

            await talentRegisterPage.clickContinueButton();
        }

        await page.waitForURL(urls.talent);

        // Apply for Round
        const talentHome = new TalentHomePage(page);
        talentHome.enterProjectName(projectName);
        talentHome.clickApplyForSearchedProject();

        const talentApply = new TalentApplyPage(page);

        await talentApply.clickApplyOnlineround();
        talentApply.clickRoleSelector();
        await page.waitForTimeout(3000);

        await expect(
            page.getByText("New Application", { exact: true })
        ).toBeVisible({ timeout: 10000 });

        // Verify Questions
        const apiQuestions = [
            textQuestion.data.question,
            checkboxQuestion.data.question,
            radioQuestion.data.question,
            dropdownQuestion.data.question,
            imageMediaQuestion.data.question,
            vedioMediaQuestion.data.question,
            audioMediaQuestion.data.question,
            pdfMediaQuestion.data.question,
            availabilityQuestion.data.question
        ];
        console.log("API Questions: ", apiQuestions)

        const uiQuestions = await page
            .locator(".n-form-item-label__text, .font-bold.text-gray-default")
            .allTextContents();

        const cleanedUiQuestions = uiQuestions.map(q => q.replace("*", "").trim());

        console.log("UI Questions:", cleanedUiQuestions);

        for (const q of apiQuestions) {
            expect(cleanedUiQuestions).toContain(q.trim());
        }

        // Cleanup
        const uuid = await getTalentUuidByName(request, token, uniqueName);

        await deleteRound(request, token, projectId, roundId);
        await deleteRole(request, token, projectId, roleId);
        await deleteProject(request, token, projectId);
        await deleteTalent(request, token, uuid);

    });

    test("Register new talent and apply for the in-Person round: verify all mandatory questions show validation", async ({ page, request }) => {

        const talentEmail = generateEmail();
        const token = await getAccessTokenSmart(request, validLogin.email);

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

        // Create round
        await createInPersonRound(request, token, projectId, roleId);

        const rounds = await getProjectRounds(request, token, projectId);
        const round = rounds.data[0];
        expect(round).toBeDefined();

        const roundId = round.id;

        // Create Questions
        const textQuestion = await createTextQuestion(
            request, token, projectId, roundId, roleId,
            "Tell us about yourself"
        );

        const checkboxQuestion = await createCheckboxQuestion(
            request, token, projectId, roundId, roleId,
            "Select your skills",
            ["Acting", "Singing", "Dancing"]
        );

        const radioQuestion = await createRadioQuestion(
            request, token, projectId, roundId, roleId,
            "Do you have acting experience?",
            ["Yes", "No"]
        );

        const dropdownQuestion = await createDropdownQuestion(
            request, token, projectId, roundId, roleId,
            "Select your country",
            ["USA", "UK", "Canada"]
        );

        const imageMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your profile photo",
            [1]
        );

        const vedioMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your video performance",
            [2]
        );

        const audioMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your audio clip",
            [3]
        );

        const pdfMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your proposal pdf version",
            [4]
        );

        const availabilityQuestion = await createAvailabilityQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Select your availability",
            ["Morning", "Afternoon", "Evening"]
        );


        // Make Questions Mandatory
        await makeTextQuestionAsMandory(request, token, projectId, roundId, roleId,
            "Tell us about yourself", textQuestion.data.question_id
        );
        await makeCheckboxQuestionAsMandotory(request, token, projectId, roundId, roleId,
            "Select your skills",
            ["Acting", "Singing", "Dancing"], checkboxQuestion.data.question_id);

        await makeRadioQuestionAsMandotory(request, token, projectId, roundId, roleId,
            "Do you have acting experience?",
            ["Yes", "No"], radioQuestion.data.question_id);

        await makeDropdownQuestionAsMandotory(request, token, projectId, roundId, roleId,
            "Select your country",
            ["USA", "UK", "Canada"], dropdownQuestion.data.question_id);

        await makeMediaQuestionAsMandotory(request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your profile photo",
            [1], imageMediaQuestion.data.question_id);

        await makeMediaQuestionAsMandotory(request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your video performance",
            [2], vedioMediaQuestion.data.question_id);

        await makeMediaQuestionAsMandotory(request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your audio clip",
            [3], audioMediaQuestion.data.question_id);

        await makeMediaQuestionAsMandotory(request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your proposal pdf version",
            [4], pdfMediaQuestion.data.question_id);


        await makeAvailabilityQuestionAsMandotory(request,
            token,
            projectId,
            roundId,
            roleId,
            "Select your availability",
            ["Morning", "Afternoon", "Evening"], availabilityQuestion.data.question_id);

        await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);

        test.setTimeout(350000);

        // Talent Registration
        await applyRegistrationConfig(request, token, fullConfig);

        await expect.poll(async () => {
            const f = await getFieldsByPageId(request, 1, token);
            return f.length;
        }).toBeGreaterThan(0);

        await page.goto(urls.talent);

        const login = new LoginPage(page);
        await login.validTalentLogin(talentEmail);

        const otp = await getOtpFromMailtrap(request, talentEmail, 120000);
        await enterOtpForTalent(page, otp);

        const pages = await getAllPages(request, token);
        const talentRegisterPage = new TalentRegisterPage(page);

        const uniqueName = `Autom-Talent ${Date.now()}`;

        for (let i = 0; i < pages.length; i++) {

            const apiFields = await getFieldsByPageId(request, pages[i].id, token);
            const requiredFields = apiFields.filter(f => f.required);

            for (const field of requiredFields) {

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

                    case "description":
                        await talentRegisterPage.enterDescription("Automation Description");
                        break;
                }
            }

            const isUploadPage = apiFields.some(f => f.name === "avatar");

            if (isUploadPage) {
                await talentRegisterPage.uploadProfilePicture();
                await talentRegisterPage.saveCroppedProfilePicture();
            }

            if (pages[i].page_no === 1) {
                await talentRegisterPage.clickTermsAndConditionCheckBox();
            }

            await talentRegisterPage.clickContinueButton();
        }

        await page.waitForURL(urls.talent);

        // Apply for Round
        const talentHome = new TalentHomePage(page);
        talentHome.enterProjectName(projectName);
        talentHome.clickApplyForSearchedProject();

        const talentApply = new TalentApplyPage(page);

        await talentApply.clickApplyOnlineround();

        talentApply.clickRoleSelector();
        await page.waitForTimeout(3000);

        // Submit without answering
        await talentApply.clickSubmit();

        // Verify Required Errors
        const errors = (await page
            .locator(".n-form-item-feedback__line")
            .allTextContents())
            .map(e => e.trim());

        console.log("Validation Errors:", errors);

        expect(errors).toEqual(
            expect.arrayContaining([
                "Value is required",
                "Media is required"
            ])
        );

        expect(errors.length).toBe(11);

        // Cleanup
        const uuid = await getTalentUuidByName(request, token, uniqueName);

        await deleteRound(request, token, projectId, roundId);
        await deleteRole(request, token, projectId, roleId);
        await deleteProject(request, token, projectId);
        await deleteTalent(request, token, uuid);

    });

    test("Register new talent and apply for the online-open round: with all questions filled", async ({ page, request }) => {

        //create project, role, round 
        const talentEmail = generateEmail();
        const token = await getAccessTokenSmart(request, validLogin.email);

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
        const roundName = round.round_name;

        // Create Questions
        const textQuestion = await createTextQuestion(
            request, token, projectId, roundId, roleId,
            "Tell us about yourself"
        );

        const checkboxQuestion = await createCheckboxQuestion(
            request, token, projectId, roundId, roleId,
            "Select your skills",
            ["Acting", "Singing", "Dancing"]
        );

        const radioQuestion = await createRadioQuestion(
            request, token, projectId, roundId, roleId,
            "Do you have acting experience?",
            ["Yes", "No"]
        );

        const dropdownQuestion = await createDropdownQuestion(
            request, token, projectId, roundId, roleId,
            "Select your country",
            ["USA", "UK", "Canada"]
        );

        const imageMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your profile photo",
            [1]
        );

        const vedioMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your video performance",
            [2]
        );

        const audioMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your audio clip",
            [3]
        );

        const pdfMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your proposal pdf version",
            [4]
        );

        const availabilityQuestion = await createAvailabilityQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Select your availability",
            ["Morning"]
        );


        await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);
        test.setTimeout(350000);

        /* register talent */
        await page.waitForTimeout(30000);

        //config preperation
        await applyRegistrationConfig(request, token, fullConfig);
        await page.waitForTimeout(30000);

        await expect.poll(async () => {
            const f = await getFieldsByPageId(request, 1, token);
            return f.length;
        }).toBeGreaterThan(0);
        await page.waitForTimeout(30000);

        //open talent UI
        await page.goto(urls.talent, { waitUntil: "domcontentloaded" });

        const login = new LoginPage(page);
        await login.validTalentLogin(talentEmail);
        await page.waitForTimeout(5000);

        const otp = await getOtpFromMailtrap(request, talentEmail, 120000);
        await page.waitForTimeout(25000);

        await enterOtpForTalent(page, otp);
        await page.waitForTimeout(30000);

        //get pages  
        const pages = await getAllPages(request, token);
        const talentRegisterPage = new TalentRegisterPage(page);
        const uniqueName = `Autom-Talent ${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        for (let i = 0; i < pages.length; i++) {

            const p = pages[i];
            console.log("Checking page:", p.name);

            //get active fields 
            const apiFields = await getFieldsByPageId(request, p.id, token);
            const expectedLabels = apiFields.map(f => f.label.trim());

            console.log("API Labels:", expectedLabels);

            //read UI
            let uiLabelsRaw = await page.locator("form label:visible").allTextContents();

            if (uiLabelsRaw.length === 0) {
                uiLabelsRaw = await page.locator(".font-bold:visible").allTextContents();
            }

            let cleanedUiLabels = uiLabelsRaw
                .map(l => l.replace("*", "").trim())
                .filter(l => expectedLabels.includes(l));

            console.log("UI Labels:", cleanedUiLabels);

            // validate labels match API
            for (const expected of expectedLabels) {
                expect(cleanedUiLabels).toContain(expected);
            }

            // validate required fields
            for (const field of apiFields) {
                if (!field.required) continue;

                const label = page
                    .locator(".n-form-item-label__text")
                    .filter({ hasText: new RegExp(`^${field.label}\\b`) });

                if (await label.count() === 0) {
                    console.log(`Skipping star check for ${field.label}`);
                    continue;
                }

                await expect(label.first()).toContainText("*");
            }

            // fill required fields
            const requiredFields = apiFields.filter(f => f.required);

            for (const field of requiredFields) {
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

                    case "description":
                        await talentRegisterPage.enterDescription("Automation Description");
                        break;
                }
            }

            //upload
            const isUploadPage = apiFields.some(f => f.name === "avatar" || f.name === "profile_photo");

            if (isUploadPage) {
                await talentRegisterPage.uploadProfilePicture();
                await talentRegisterPage.saveCroppedProfilePicture();
            }

            // terms and conditions
            if (p.page_no === 1) {
                await talentRegisterPage.clickTermsAndConditionCheckBox();
            }

            //continue
            await talentRegisterPage.clickContinueButton();

            if (i < pages.length - 1) {
                const nextPage = pages[i + 1];

                const nextFields = await getFieldsByPageId(request, nextPage.id, token);
                const nextLabel = nextFields[0]?.label;

                if (nextLabel) {
                    await page.getByText(nextLabel, { exact: false }).waitFor();
                }
            }
        }

        await page.waitForTimeout(30000);
        await page.waitForURL(urls.talent, { timeout: 60000 });

        /* apply talent */
        const talentHome = new TalentHomePage(page)
        talentHome.enterProjectName(projectName);
        talentHome.clickApplyForSearchedProject();

        const talentApply = new TalentApplyPage(page)
        talentApply.clickApplyOnlineround();
        talentApply.clickSubmit();

        expect((await talentApply.getEmptyRoleError())?.trim()).toBe("Value is required");
        await page.waitForTimeout(3000);

        talentApply.clickRoleSelector();
        await page.waitForTimeout(3000);


        //Fill Questions 
        talentApply.enterSubmission("Test submission");
        await talentApply.selectSkills(["Acting", "Singing"]);
        await talentApply.selectRadioOption("Yes");
        await talentApply.selectCountry("USA");

        await talentApply.selectAvailability("Morning", "Yes");


        talentApply.clickSubmit();
        await page.waitForTimeout(10000);

        //to be true
        expect((await talentApply.getSubmitedTagText())?.trim()).toBe("Submitted");
        expect((await talentApply.getSubmitedRole())?.trim()).toBe(roleName);

        const names = await getProjectTalentNames(request, token, projectId);
        const uuid = await getTalentUuidByName(request, token, uniqueName)
        expect(names).toContain(uniqueName);
        const form = await getSubmittedForm(request, token, projectId, uuid);

        const questionText = form.data[0].question.question;
        const textQuestionIds = form.data[0].question.question_id;
        const textValue = form.data[0].value[0].value;

        expect(questionText).toBe(textQuestion.data.question);
        expect(textQuestionIds).toBe(textQuestion.data.question_id);
        expect(textValue.replace(/\s/g, "").toLowerCase()).toBe("<p>test submission</p>".replace(/\s/g, "").toLowerCase());


        const questionCheckBox = form.data[1].question.question;
        const checkBoxQuestionIds = form.data[1].question.question_id;

        const checkboxQuestionValue1 = form.data[1].value[0].value;
        const checkboxQuestionValue2 = form.data[1].value[1].value;

        expect(questionCheckBox).toBe(checkboxQuestion.data.question);
        expect(checkBoxQuestionIds).toBe(checkboxQuestion.data.question_id);

        expect(checkboxQuestionValue1.toLowerCase()).toBe("acting");
        expect(checkboxQuestionValue2.toLowerCase()).toBe("singing");



        const questionRadio = form.data[2].question.question;
        const radioQuestionIds = form.data[2].question.question_id;
        const radioQuestionValue = form.data[2].value[0].value;

        expect(questionRadio).toBe(radioQuestion.data.question);
        expect(radioQuestionIds).toBe(radioQuestion.data.question_id);

        expect(radioQuestionValue.toLowerCase()).toBe("yes");

        const questionDropdown = form.data[3].question.question;
        const dropdownQuestionIds = form.data[3].question.question_id;
        const dropdownQuestionValue = form.data[3].value[0].value;

        expect(questionDropdown).toBe(dropdownQuestion.data.question);
        expect(dropdownQuestionIds).toBe(dropdownQuestion.data.question_id);

        expect(dropdownQuestionValue.toLowerCase()).toBe("usa");

        const availability = form.data[4].value[0].value[0];

        const morningSelection = availability.selection.find(
            (s: any) => s.is_selected
        );

        expect(morningSelection.label).toBe("Yes");


        //delete data
        await deleteProject(request, token, projectId);
        await deleteTalent(request, token, uuid);

    });

    test("Register new talent and apply for the round: verify all relavent questions appear to the role", async ({ page, request }) => {

        const talentEmail = generateEmail();
        const token = await getAccessTokenSmart(request, validLogin.email);

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
        expect(round).toBeDefined();

        const roundId = round.id;

        // Create Questions
        const textQuestion = await createTextQuestion(
            request, token, projectId, roundId, roleId,
            "Tell us about yourself"
        );

        const checkboxQuestion = await createCheckboxQuestion(
            request, token, projectId, roundId, roleId,
            "Select your skills",
            ["Acting", "Singing", "Dancing"]
        );

        const radioQuestion = await createRadioQuestion(
            request, token, projectId, roundId, roleId,
            "Do you have acting experience?",
            ["Yes", "No"]
        );

        const dropdownQuestion = await createDropdownQuestion(
            request, token, projectId, roundId, roleId,
            "Select your country",
            ["USA", "UK", "Canada"]
        );

        const imageMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your profile photo",
            [1]
        );

        const vedioMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your audio clip",
            [2]
        );

        const audioMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your video performance",
            [3]
        );

        const pdfMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your proposal pdf version",
            [4]
        );

        const availabilityQuestion = await createAvailabilityQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Select your availability",
            ["Morning", "Afternoon", "Evening"]
        );

        await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);

        test.setTimeout(350000);

        // add another round and question
        await createOnlineRound(request, token, projectId, roleId);

        const allRounds = await getProjectRounds(request, token, projectId);
        const round1 = allRounds.data[1];
        expect(round1).toBeDefined();
        const roundId1 = round.id;

        const textQuestion1 = await createTextQuestion(
            request, token, projectId, roundId1, roleId,
            "Tell us about yourself"
        );

        const checkboxQuestion1 = await createCheckboxQuestion(
            request, token, projectId, roundId1, roleId,
            "Select your skills",
            ["Acting", "Singing", "Dancing"]
        );

        await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);
        test.setTimeout(350000);

        // Talent Registration
        await applyRegistrationConfig(request, token, fullConfig);

        await expect.poll(async () => {
            const f = await getFieldsByPageId(request, 1, token);
            return f.length;
        }).toBeGreaterThan(0);

        await page.goto(urls.talent, { waitUntil: "domcontentloaded" });

        const login = new LoginPage(page);
        await login.validTalentLogin(talentEmail);

        const otp = await getOtpFromMailtrap(request, talentEmail, 120000);
        await enterOtpForTalent(page, otp);

        const pages = await getAllPages(request, token);
        const talentRegisterPage = new TalentRegisterPage(page);

        const uniqueName = `Autom-Talent ${Date.now()}`;

        for (let i = 0; i < pages.length; i++) {

            const apiFields = await getFieldsByPageId(request, pages[i].id, token);

            const requiredFields = apiFields.filter(f => f.required);

            for (const field of requiredFields) {

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

                    case "description":
                        await talentRegisterPage.enterDescription("Automation Description");
                        break;
                }
            }

            const isUploadPage = apiFields.some(f => f.name === "avatar");

            if (isUploadPage) {
                await talentRegisterPage.uploadProfilePicture();
                await talentRegisterPage.saveCroppedProfilePicture();
            }

            if (pages[i].page_no === 1) {
                await talentRegisterPage.clickTermsAndConditionCheckBox();
            }

            await talentRegisterPage.clickContinueButton();
        }

        await page.waitForURL(urls.talent);

        // Apply for Round
        const talentHome = new TalentHomePage(page);
        talentHome.enterProjectName(projectName);
        talentHome.clickApplyForSearchedProject();

        const talentApply = new TalentApplyPage(page);

        await talentApply.clickApplyOnlineround();
        talentApply.clickRoleSelector();
        await page.waitForTimeout(3000);

        await expect(
            page.getByText("New Application", { exact: true })
        ).toBeVisible({ timeout: 10000 });

        // Verify Questions
        const apiQuestions = [
            textQuestion.data.question,
            checkboxQuestion.data.question,
            radioQuestion.data.question,
            dropdownQuestion.data.question,
            imageMediaQuestion.data.question,
            vedioMediaQuestion.data.question,
            audioMediaQuestion.data.question,
            pdfMediaQuestion.data.question,
            availabilityQuestion.data.question
        ];
        console.log("API Questions: ", apiQuestions)

        const uiQuestions = await page
            .locator(".n-form-item-label__text, .font-bold.text-gray-default")
            .allTextContents();

        const cleanedUiQuestions = uiQuestions.map(q => q.replace("*", "").trim());

        console.log("UI Questions:", cleanedUiQuestions);

        for (const q of apiQuestions) {
            expect(cleanedUiQuestions).toContain(q.trim());
        }

        // Cleanup
        const uuid = await getTalentUuidByName(request, token, uniqueName);
        await deleteProject(request, token, projectId);
        await deleteTalent(request, token, uuid);

    });

    test("Register new talent and apply for the round: verify inactive questions are not appear to the role", async ({ page, request }) => {

        const talentEmail = generateEmail();
        const token = await getAccessTokenSmart(request, validLogin.email);

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
        expect(round).toBeDefined();

        const roundId = round.id;

        // Create Questions
        const textQuestion = await createTextQuestion(
            request, token, projectId, roundId, roleId,
            "Tell us about yourself"
        );

        const checkboxQuestion = await createCheckboxQuestion(
            request, token, projectId, roundId, roleId,
            "Select your skills",
            ["Acting", "Singing", "Dancing"]
        );

        const radioQuestion = await createRadioQuestion(
            request, token, projectId, roundId, roleId,
            "Do you have acting experience?",
            ["Yes", "No"]
        );

        const dropdownQuestion = await createDropdownQuestion(
            request, token, projectId, roundId, roleId,
            "Select your country",
            ["USA", "UK", "Canada"]
        );

        const imageMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your profile photo",
            [1]
        );

        const vedioMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your audio clip",
            [2]
        );

        const audioMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your video performance",
            [3]
        );

        const pdfMediaQuestion = await createMediaQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Upload your proposal pdf version",
            [4]
        );

        const availabilityQuestion = await createAvailabilityQuestion(
            request,
            token,
            projectId,
            roundId,
            roleId,
            "Select your availability",
            ["Morning", "Afternoon", "Evening"]
        );

        await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);

        // Talent Registration
        await applyRegistrationConfig(request, token, fullConfig);

        await expect.poll(async () => {
            const f = await getFieldsByPageId(request, 1, token);
            return f.length;
        }).toBeGreaterThan(0);

        await page.goto(urls.talent, { waitUntil: "domcontentloaded" });

        const login = new LoginPage(page);
        await login.validTalentLogin(talentEmail);

        const otp = await getOtpFromMailtrap(request, talentEmail, 120000);
        await enterOtpForTalent(page, otp);

        const pages = await getAllPages(request, token);
        const talentRegisterPage = new TalentRegisterPage(page);

        const uniqueName = `Autom-Talent ${Date.now()}`;

        for (let i = 0; i < pages.length; i++) {

            const apiFields = await getFieldsByPageId(request, pages[i].id, token);

            const requiredFields = apiFields.filter(f => f.required);

            for (const field of requiredFields) {

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

                    case "description":
                        await talentRegisterPage.enterDescription("Automation Description");
                        break;
                }
            }

            const isUploadPage = apiFields.some(f => f.name === "avatar");

            if (isUploadPage) {
                await talentRegisterPage.uploadProfilePicture();
                await talentRegisterPage.saveCroppedProfilePicture();
            }

            if (pages[i].page_no === 1) {
                await talentRegisterPage.clickTermsAndConditionCheckBox();
            }

            await talentRegisterPage.clickContinueButton();
        }

        await page.waitForURL(urls.talent);

        // Apply for Round
        const talentHome = new TalentHomePage(page);
        talentHome.enterProjectName(projectName);
        talentHome.clickApplyForSearchedProject();

        const talentApply = new TalentApplyPage(page);

        await talentApply.clickApplyOnlineround();
        talentApply.clickRoleSelector();
        await page.waitForTimeout(3000);

        await expect(
            page.getByText("New Application", { exact: true })
        ).toBeVisible({ timeout: 10000 });

        // Verify Questions
        const apiQuestions = [
            textQuestion.data.question,
            checkboxQuestion.data.question,
            radioQuestion.data.question,
            dropdownQuestion.data.question,
            imageMediaQuestion.data.question,
            vedioMediaQuestion.data.question,
            audioMediaQuestion.data.question,
            pdfMediaQuestion.data.question,
            availabilityQuestion.data.question
        ];
        console.log("API Questions: ", apiQuestions)

        const uiQuestions = await page
            .locator(".n-form-item-label__text, .font-bold.text-gray-default")
            .allTextContents();

        const cleanedUiQuestions = uiQuestions.map(q => q.replace("*", "").trim());

        console.log("UI Questions:", cleanedUiQuestions);

        for (const q of apiQuestions) {
            expect(cleanedUiQuestions).toContain(q.trim());
        }

        //make questions inactive 
        await makeTextQuestionAsInactive(
            request, token, projectId, roundId, roleId,
            "Tell us about yourself", textQuestion.data.question_id
        );

        await makeCheckboxQuestionAsInactive(
            request, token, projectId, roundId, roleId,
            "Select your skills",
            ["Acting", "Singing", "Dancing"], checkboxQuestion.data.question_id
        );
        await page.waitForTimeout(3000);
        await page.reload({ waitUntil: "networkidle" });
        talentApply.clickRoleSelector();
        await page.waitForTimeout(3000);

        // Verify Questions
        const apiQuestionsAfterQuestionInactivity = [
            radioQuestion.data.question,
            dropdownQuestion.data.question,
            imageMediaQuestion.data.question,
            vedioMediaQuestion.data.question,
            audioMediaQuestion.data.question,
            pdfMediaQuestion.data.question,
            availabilityQuestion.data.question
        ];
        console.log("API Questions: ", apiQuestionsAfterQuestionInactivity)

        const uiQuestionsAfterInactivity = await page
            .locator(".n-form-item-label__text, .font-bold.text-gray-default")
            .allTextContents();

        const cleanedUiQuestionsAfterInactivity = uiQuestionsAfterInactivity.map(q => q.replace("*", "").trim());

        console.log("UI Questions:", cleanedUiQuestionsAfterInactivity);

        for (const q of apiQuestionsAfterQuestionInactivity) {
            expect(cleanedUiQuestionsAfterInactivity).toContain(q.trim());
        }

        // Cleanup
        const uuid = await getTalentUuidByName(request, token, uniqueName);
        // await deleteProject(request, token, projectId);
        // await deleteTalent(request, token, uuid);

    });




});