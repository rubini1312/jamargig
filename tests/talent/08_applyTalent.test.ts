import { getAccessTokenSmart } from "@/helpers/api/authApi";
import { createProject, deleteProject, publishProject } from "@/helpers/api/projectApi";
import { createRole, deleteRole, getProjectRoles } from "@/helpers/api/roleApi";
import { createInPersonRound, createOnlineRound, deleteRound, getProjectRounds, updateRoundSubmissionStatus } from "@/helpers/api/roundApi";
import { applyRegistrationConfig, deleteTalent, getAllPages, getFieldsByPageId, getProjectTalentNames, getTalentUuidByName } from "@/helpers/api/talentApi";
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
import { activateQuestion, createQuestion, deleteQuestion, getSubmittedForm } from "@/helpers/api/questionApi";
import { TalentApplyPage } from "@/pages/talent/apply/applyRoundPage";

test.describe.serial('Apply talent scenarioes', () => {

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

    test("Register new talent and apply for the online-open round: with questions (including failure cases)", async ({ page, request }) => {

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

        const question = await createQuestion(request, token, projectId, roundId, roleId);
        const questionId = question.data.question_id;
        console.log("Question ID:", questionId);
        await activateQuestion(request, token, projectId, questionId, roleId, roundId);

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
        talentApply.enterSubmission("Test submission")

        talentApply.clickSubmit();

        //to be true
        expect((await talentApply.getSubmitedTagText())?.trim()).toBe("Submitted");
        expect((await talentApply.getSubmitedRole())?.trim()).toBe(roleName);

        const names = await getProjectTalentNames(request, token, projectId);
        const uuid = await getTalentUuidByName(request, token, uniqueName)
        expect(names).toContain(uniqueName);
        const form = await getSubmittedForm(request, token, projectId, uuid);

        const questionText = form.data[0].question.question;
        const questionIds = form.data[0].question.question_id;
        const value = form.data[0].value[0].value;

        expect(questionText).toBe(question.data.question);
        expect(questionIds).toBe(questionId);
        expect(value.replace(/\s/g, "").toLowerCase()).toBe("<p>test submission</p>".replace(/\s/g, "").toLowerCase());

        //delete data
        // await deleteQuestion(request, token, projectId, questionId)
        await deleteRound(request, token, projectId, roundId);
        await deleteRole(request, token, projectId, roleId);
        await deleteProject(request, token, projectId);
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

    test("Register new talent and apply for the in-Person open round: with questions (including failure cases)", async ({ page, request }) => {

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

        const question = await createQuestion(request, token, projectId, roundId, roleId);
        const questionId = question.data.question_id;
        console.log("Question ID:", questionId);
        await activateQuestion(request, token, projectId, questionId, roleId, roundId);

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
        talentApply.enterSubmission("Test submission")
        talentApply.clickSubmit();

        //to be true
        expect((await talentApply.getSubmitedTagText())?.trim()).toBe("Submitted");
        expect((await talentApply.getSubmitedRole())?.trim()).toBe(roleName);
        const names = await getProjectTalentNames(request, token, projectId);
        expect(names).toContain(uniqueName);

        const uuid = await getTalentUuidByName(request, token, uniqueName)
        const form = await getSubmittedForm(request, token, projectId, uuid);

        const questionText = form.data[0].question.question;
        const questionIds = form.data[0].question.question_id;
        const value = form.data[0].value[0].value;

        expect(questionText).toBe(question.data.question);
        expect(questionIds).toBe(questionId);
        expect(value.replace(/\s/g, "").toLowerCase()).toBe("<p>test submission</p>".replace(/\s/g, "").toLowerCase());

        //delete data
        // await deleteQuestion(request, token, projectId, questionId)
        await deleteRound(request, token, projectId, roundId);
        await deleteRole(request, token, projectId, roleId);
        await deleteProject(request, token, projectId);
        await deleteTalent(request, token, uuid);

    });

});