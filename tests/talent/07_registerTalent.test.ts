import LoginPage from "../../pages/talent/login/loginPage";
import { urls } from "@/utils/urls";
import { getOtpFromMailtrap, enterOtpForTalent } from "@/helpers/mailtrapOtp";
import { test, expect } from './_setup/talentTest';
import { TalentRegisterPage } from "@/pages/talent/register/registerPage";
import { getAccessTokenSmart } from "@/helpers/api/authApi";
import { getPublishedProjects } from "@/helpers/api/projectApi";
import { talentAuditionPageLocators } from "@/pages/talent/audition/auditionPageLocators";
import { validLogin } from "@/test-data/loginData";
import { getAllPages, getFieldsByPageId } from "@/helpers/api/talentOnboardingFieldsApi";

test.describe.serial('Talent registration scenarioes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(urls.talent, { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded');
  });

  test("validate talent registration fields per page agaist casting default data model config", async ({ page, request, talentEmail }) => {

    //login
    const login = new LoginPage(page);
    await login.validTalentLogin(talentEmail);

    const otp = await getOtpFromMailtrap(request, talentEmail, 60000);
    await enterOtpForTalent(page, otp);
    await page.waitForLoadState("networkidle");

    //get pages
    const pages = await getAllPages(request);
    const talentRegisterPage = new TalentRegisterPage(page);

    for (let i = 0; i < pages.length; i++) {

      const p = pages[i];
      console.log("Checking page:", p.name);

      const apiFields = await getFieldsByPageId(request, p.id);


      //validate UI fields
      const labelElements = await page.locator("label").allTextContents();

      if (labelElements.length > 0) {
        const cleanedUiLabels = labelElements.map(l =>
          l.replace("*", "").trim()
        );

        const expectedLabels = apiFields.map(f => f.label.trim());

        expect(cleanedUiLabels).toEqual(expectedLabels);

        // required star check
        for (let j = 0; j < apiFields.length; j++) {
          if (apiFields[j].required) {
            expect(labelElements[j]).toContain("*");
          }
        }

      } else {
        for (const field of apiFields) {
          const label = field.label.trim();
          const element = page.getByText(label, { exact: false }).first();
          await expect(element).toBeVisible();

          if (field.required) {
            await expect(element).toContainText("*");
          }
        }
      }

      // fill required fields
      const requiredFields = apiFields.filter(f => f.required);
      for (const field of requiredFields) {

        switch (field.name) {
          case "name":
            await talentRegisterPage.enterFullName("Automation Talent");
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

          default:
            console.log("No handler for field:", field.name);
        }
      }


      // detect upload page using label
      const isUploadPage = apiFields.some(f =>
        f.label.toLowerCase().includes("upload profile")
      );

      if (isUploadPage) {
        console.log("Uploading profile picture...");

        await talentRegisterPage.uploadProfilePicture();
        await talentRegisterPage.saveCroppedProfilePicture();

        // wait until crop closes & button enabled
        await page.waitForTimeout(1000);
      }

      // terms check box
      if (p.page_no === 1) {
        await talentRegisterPage.clickTermsAndConditionCheckBox();
      }

      // continue
      if (i < pages.length - 1) {
        await talentRegisterPage.clickContinueButton();
        await page.waitForLoadState("networkidle");
      }
    }
  });

  test('register new talent dynamically with required fields (default)', async ({ request, page, talentEmail }) => {

    test.setTimeout(120000);

    const login = new LoginPage(page);
    await login.validTalentLogin(talentEmail);

    const otp = await getOtpFromMailtrap(request, talentEmail, 60000);
    await enterOtpForTalent(page, otp);

    const talentRegisterPage = new TalentRegisterPage(page);

    // 🔹 Get registration pages from API
    const pages = await getAllPages(request);

    for (let i = 0; i < pages.length; i++) {

      const p = pages[i];
      console.log("Register page:", p.name);

      const apiFields = await getFieldsByPageId(request, p.id);
      const requiredFields = apiFields.filter(f => f.required);

      //required fields
      for (const field of requiredFields) {

        switch (field.name) {

          case "name":
            await talentRegisterPage.enterFullName("Automation Talent");
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

          case "skills":
            await talentRegisterPage.selectSelfRatedSkill(1, 'Acting');
            break;

          case "union":
            await talentRegisterPage.selectUnions(1);
            break;

          case "product_type":
            await talentRegisterPage.selectProductType(1);
            break;

          default:
            console.log("No handler for:", field.name);
        }
      }

      //upload
      const isUploadPage = apiFields.some(f =>
        f.label.toLowerCase().includes("upload profile")
      );

      if (isUploadPage) {
        await talentRegisterPage.uploadProfilePicture();
        await talentRegisterPage.saveCroppedProfilePicture();
        await page.waitForTimeout(1000);
      }

      //terms
      if (p.page_no === 1) {
        await talentRegisterPage.clickTermsAndConditionCheckBox();
      }

      //continue
      await talentRegisterPage.clickContinueButton();

      // if not last page → wait for next page
      if (i < pages.length - 1) {
        await page.waitForLoadState("networkidle");
      }
    }

    await page.waitForURL(urls.talent, { timeout: 180000 });
  });

  test('login as newly registred new talent', async ({ request, page, talentEmail }) => {
    test.setTimeout(100000);

    const login = new LoginPage(page);
    await login.validTalentLogin(talentEmail);
    await page.waitForTimeout(30000);

    const otp = await getOtpFromMailtrap(request, talentEmail, 240000);
    await enterOtpForTalent(page, otp);
    await page.waitForURL(urls.talent, { timeout: 60000 });
  });




  test("verify listed projects to a newly registered talent", async ({ page, request, talentEmail }) => {

    const token = await getAccessTokenSmart(request, validLogin.email);
    const result = await getPublishedProjects(request, token);

    const login = new LoginPage(page);
    await login.validTalentLogin(talentEmail);
    await page.waitForTimeout(30000);

    const otp = await getOtpFromMailtrap(request, talentEmail, 240000);
    await enterOtpForTalent(page, otp);
    await page.waitForURL(urls.talent, { timeout: 60000 });

    await page.locator(talentAuditionPageLocators.auditionCards).first().waitFor();
    const uiTitles = await page.locator(talentAuditionPageLocators.auditionCardTitles).allTextContents();
    expect(uiTitles).toEqual(expect.arrayContaining(result.names));

  });

});