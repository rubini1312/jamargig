import { createProject, deleteProject, publishProject } from "@/helpers/api/casting/projectApi";
import { addRoleMaterial, createRole, createRoleWithroleImage, deleteRole, getMaterialUuid, getProjectRoles, updateMaterialDownloadable } from "@/helpers/api/casting/roleApi";
import { createInPersonRound, createOnlineRound, deleteRound, getProjectRounds, updateRoundSubmissionStatus } from "@/helpers/api/casting/roundApi";
import { applyRegistrationConfig, deleteTalent, getAllPages, getFieldsByPageId, getProjectTalentNames, getTalentUuidByName, updateTalentRegistration } from "@/helpers/api/casting/talentApi";
import { fullConfig } from "@/test-data/dataModelConfig";
import { validLogin } from "@/test-data/loginData";
import { urls } from "@/utils/urls";
import LoginPage from "../../pages/talent/login/loginPage";
import { test, expect } from './_setup/talentTest';
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
            await createRoleWithroleImage(request, token, projectId);

            const roles = await getProjectRoles(request, token, projectId);
            const role = roles.data[0];
            expect(role).toBeDefined();
            const roleId = role.id;
            const roleName = role.role_name;


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

                if (apiFields.some(f => f.name === "avatar" || f.name === "profile_photo")) {
                    await talentRegisterPage.uploadProfilePicture();
                    await talentRegisterPage.saveCroppedProfilePicture();
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

            await page.waitForLoadState("networkidle");
            await addRoleMaterial(request, token, projectId, roleId);
            const imageUUID = await getMaterialUuid(request, token, projectId, roleId);
            
            await updateMaterialDownloadable(request, token, projectId, roleId, imageUUID, 'test-role.jpg', true);

            // media download
            const talentHome = new TalentHomePage(page);

            await expect(page.locator(talentAuditionPageLocators.auditionCards).first())
                .toBeVisible();

            await talentHome.enterProjectName(projectName);
            await talentHome.clickApplyForSearchedProject(roleName);

            const talentApply = new TalentApplyPage(page);
            talentApply.verifyImageIsDownloadable(page, 'test-role.jpg')

            // await deleteRole(request, token, projectId, roleId);
            // await deleteProject(request, token, projectId);

            // const uuid = await getTalentUuidByName(request, token, uniqueName);
            // await deleteTalent(request, token, uuid);
        });
});