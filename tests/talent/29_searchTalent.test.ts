import { createProject, deleteProject, publishProject } from "@/helpers/api/casting/projectApi";
import { createRole, deleteRole, getProjectRoles } from "@/helpers/api/casting/roleApi";
import { createOnlineRound, deleteRound, getProjectRounds, updateRoundSubmissionStatus } from "@/helpers/api/casting/roundApi";
import { applyRegistrationConfig, deleteTalent, getAllPages, getFieldsByPageId, getProjectTalentNames, getTalentSearchTotalCount, getTalentUuidByName, updateTalentRegistration } from "@/helpers/api/casting/talentApi";
import { fullConfig } from "@/test-data/dataModelConfig";
import { validLogin } from "@/test-data/loginData";
import { urls } from "@/utils/urls";
import { test, expect } from './_setup/talentTest';
import { enterOtpForTalent, getOtpFromMailtrap } from "@/utils/mailtrapOtp";
import { TalentRegisterPage } from "@/pages/talent/register/registerPage";
import { generateEmail } from "@/test-data/random-data";
import { createAvailabilityQuestion, createCheckboxQuestion, createDropdownQuestion, createMediaQuestion, createRadioQuestion, createTextQuestion, getSubmittedForm, makeAvailabilityQuestionAsMandotory, makeCheckboxQuestionAsInactive, makeCheckboxQuestionAsMandotory, makeDropdownQuestionAsMandotory, makeMediaQuestionAsMandotory, makeRadioQuestionAsMandotory, makeTextQuestionAsInactive, makeTextQuestionAsMandory, updateQuestionAsInactive } from "@/helpers/api/casting/questionApi";
import { getAccessTokenSmartFromCasting } from "@/helpers/api/casting/authApi";
import TalentLoginPage from "@/pages/talent/login/loginPage";
import CastingLoginPage from "@/pages/casting/owner/login/loginPage";
import Talentpage from "@/pages/casting/owner/talentProfile/talentPage";

test.describe('Search talent scenarios', () => {

    let token: string;

    test.beforeAll(async ({ request }) => {
        token = await getAccessTokenSmartFromCasting(request, validLogin.email);
    });

    test("Register new talent and verify talent appears after search talent",
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

            const talentLogin = new TalentLoginPage(page);
            await talentLogin.validTalentLogin(talentEmail);

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

                if (apiFields.some(f => f.name === "avatar")) {
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

            // Open new tab (casting side)
            const castingPage = await page.context().newPage();
            await castingPage.goto(urls.casting);
            const castingLogin = new CastingLoginPage(castingPage);

            await castingLogin.validLoginwithUI(
                validLogin.email,
                validLogin.password,
                request
            );

            //talent page- search & verify
            await castingPage.goto(urls.casting + "/talents");
            await expect(castingPage).toHaveURL(/talents/);

            await castingPage.waitForLoadState('networkidle');

            const searchIcon = await castingPage.locator('.n-input-wrapper');
            await expect(searchIcon).toBeVisible();
            await searchIcon.hover();

            const searchInput = castingPage.locator('input[placeholder*="Search"]:visible');
            await expect(searchInput).toBeVisible();

            await searchInput.fill(uniqueName);

            await expect(
                castingPage.getByText(/1 results/i)
            ).toBeVisible();

            await expect(
                castingPage.locator('div.n-card.n-card--bordered', {
                    hasText: uniqueName,
                })
            ).toBeVisible();

            const uuid = await getTalentUuidByName(request, token, uniqueName);

            await deleteRound(request, token, projectId, roundId);
            await deleteRole(request, token, projectId, roleId);
            await deleteProject(request, token, projectId);
            await deleteTalent(request, token, uuid);
        });

    test("Verify talent count from API matches UI placeholder", async ({ page, request }) => {

        await page.goto(urls.casting);
        const castingLogin = new CastingLoginPage(page);

        await castingLogin.validLoginwithUI(
            validLogin.email,
            validLogin.password,
            request
        );

        //talent page- search & verify
        await page.goto(urls.casting + "/talents");
        await expect(page).toHaveURL(/talents/);

        await page.waitForLoadState('networkidle');
        const talentPage = new Talentpage(page);

        // API total count
        const apiCount = await getTalentSearchTotalCount(request, token);

        // UI placeholder count
        const uiCount = await talentPage.getTalentCountFromPlaceholder();

        console.log("API Count:", apiCount);
        console.log("UI Count:", uiCount);

        // Assertion
        expect(uiCount).toBe(apiCount);

    });
});