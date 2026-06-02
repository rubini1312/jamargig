import { createProject, deleteProject, publishProject } from "@/helpers/api/casting/projectApi";
import { createRole, deleteRole, getProjectRoles } from "@/helpers/api/casting/roleApi";
import { createInPersonRound, createOnlineRound, deleteRound, getProjectRounds, updateRoundSubmissionStatus } from "@/helpers/api/casting/roundApi";
import { applyRegistrationConfig, deleteTalent, getAllPages, getFieldsByPageId, getProjectTalentNames, getTalentUuidByName, updateTalentRegistration } from "@/helpers/api/casting/talentApi";
import { fullConfig } from "@/test-data/dataModelConfig";
import { validLogin } from "@/test-data/loginData";
import { urls } from "@/utils/urls";
import LoginPage from "../../pages/talent/login/loginPage";
import CastingLoginPage from "@pages/casting/owner/login/loginPage";
import { test, expect } from '../_setup/talentTest';
import { enterOtpForTalent, getOtpFromMailtrap } from "@/utils/mailtrapOtp";
import { TalentRegisterPage } from "@/pages/talent/register/registerPage";
import { TalentHomePage } from "@/pages/talent/home/homePage";
import { generateEmail } from "@/test-data/random-data";
import { createAvailabilityQuestion, createCheckboxQuestion, createDropdownQuestion, createMediaQuestion, createRadioQuestion, createTextQuestion, getSubmittedForm, makeAvailabilityQuestionAsMandotory, makeCheckboxQuestionAsInactive, makeCheckboxQuestionAsMandotory, makeDropdownQuestionAsMandotory, makeMediaQuestionAsMandotory, makeRadioQuestionAsMandotory, makeTextQuestionAsInactive, makeTextQuestionAsMandory, updateQuestionAsInactive } from "@/helpers/api/casting/questionApi";
import { getAccessTokenSmartFromCasting } from "@/helpers/api/casting/authApi";
import { talentAuditionPageLocators } from "@/pages/talent/audition/auditionPageLocators";
import path from "path";
import ProjectDetailsPage from "@/pages/casting/owner/projectDetails/projectDetailsPage";
import Talentpage from "@/pages/casting/owner/talentProfile/talentPage";
import { TalentApplyPage } from "@/pages/talent/apply/applyRoundPage";

test.describe('Verify talent submission scenarios', () => {

    let token: string;

    test.beforeAll(async ({ request }) => {
        token = await getAccessTokenSmartFromCasting(request, validLogin.email);
    });

    test("Verify the talent submission from casting UI: with all questions filled",
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
            const checkboxQuestion = await createCheckboxQuestion(request, token, projectId, roundId, roleId, "Select your skills", ["Acting", "Singing", "Dancing"]);
            const radioQuestion = await createRadioQuestion(request, token, projectId, roundId, roleId, "Do you have acting experience?", ["Yes", "No"]);
            const dropdownQuestion = await createDropdownQuestion(request, token, projectId, roundId, roleId, "Select your country", ["USA", "UK", "Canada"]);
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

                if (apiFields.some(f => f.name === "avatar" || f.name === "profile_photo")) {
                    await talentRegisterPage.uploadProfilePicture();
                    await talentRegisterPage.saveCroppedProfilePicture();
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
            await talentHome.verifyProjectName(projectName);

            const description = await talentHome.getProjectDescriptionByCard();
            const expectedDescription = response.data.description.replace(/<[^>]*>/g, '').trim();
            expect(description?.trim()).toContain(expectedDescription);

            const location = await talentHome.getProjectLocationByCard();
            expect(location).toContain(response.data.location);

            await talentHome.clickApplyForSearchedProject(roleName);

            const talentApply = new TalentApplyPage(page);
            const detailProjectName = await talentApply.getAuditionDetailProjectName();
            expect(detailProjectName).toContain(projectName);

            await talentApply.clickApplyOnlineround();
            await talentApply.clickSubmit();

            await expect(page.getByText("Value is required")).toBeVisible();
            await talentApply.clickRoleSelector();
            await talentApply.enterSubmission("Test submission");
            await talentApply.selectSkills(["Acting", "Singing"]);
            await talentApply.selectRadioOption("Yes");
            await talentApply.selectCountry("USA");
            await talentApply.selectAvailability("Morning", "Yes");

            await talentApply.clickProfilePhotoUpload();
            await talentApply.uploadMedia(path.join(process.cwd(), 'test-files/images/test-pngFile.png'));
            await talentApply.clickAddToLibrary();
            await talentApply.clickAddToApplication();

            await talentApply.clickVideoPerformanceUpload();
            await talentApply.uploadMedia(path.join(process.cwd(), 'test-files/videos/file_example_MP4_1920_18MG.mp4'));
            await talentApply.clickAddToLibrary();
            await talentApply.clickAddToApplication();

            await talentApply.clickAudioUpload();
            await talentApply.uploadMedia(path.join(process.cwd(), 'test-files/audioes/file_example_MP3_700KB.mp3'));
            await talentApply.clickAddToLibrary();
            await talentApply.clickAddToApplication();

            await talentApply.clickDocumentUpload();
            await talentApply.uploadMedia(path.join(process.cwd(), 'test-files/pdfs/file-sample_150kB.pdf'));
            await talentApply.clickAddToLibrary();
            await talentApply.clickAddToApplication();

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

            const projectDataTalentPage = new ProjectDetailsPage(page);
            await projectDataTalentPage.verifyUploadedMediaFromApi(request, token, projectId, uuid, 'test-pngFile.png');
            await projectDataTalentPage.verifyUploadedMediaFromApi(request, token, projectId, uuid, 'file_example_MP4_1920_18MG.mp4');
            await projectDataTalentPage.verifyUploadedMediaFromApi(request, token, projectId, uuid, 'file_example_MP3_700KB.mp3');
            await projectDataTalentPage.verifyUploadedMediaFromApi(request, token, projectId, uuid, 'file-sample_150kB.pdf');

            const castingPage = await page.context().newPage();

            await castingPage.goto(urls.casting);

            const castingLogin = new CastingLoginPage(castingPage);

            await castingLogin.validLoginwithUI(
                validLogin.email,
                validLogin.password,
                request
            );

            await castingPage.goto(
                `${urls.casting}/projects/${projectId}/talents`
            );

            const castingTalentPage = new Talentpage(castingPage);

            await castingTalentPage.clickTalentCardByName(uniqueName);
            await castingTalentPage.clickOnSubmissionFormTab('Tell us about yourself');

            await castingTalentPage.verifyQuestionAndAnswer(
                "Tell us about yourself",
                "Test submission"
            );

            await castingTalentPage.verifyQuestionAndAnswer(
                "Select your country",
                "USA"
            );

            await castingTalentPage.verifyQuestionAndAnswer(
                "Do you have acting experience?",
                "Yes"
            );

            await castingTalentPage.verifyQuestionAndMultipleAnswers(
                "Select your skills",
                ["Acting", "Singing"]
            );

            await castingTalentPage.clickOnSubmissionMediaTab('file_example_MP4_1920_18MG.mp4');
            await castingTalentPage.verifyUploadedFileNames([
                'file_example_MP4_1920_18MG.mp4',
                'test-pngFile.png',
                'file_example_MP3_700KB.mp3',
                'file-sample_150kB.pdf'
            ]);

            await deleteProject(request, token, projectId);
            await deleteTalent(request, token, uuid);
        });
});
