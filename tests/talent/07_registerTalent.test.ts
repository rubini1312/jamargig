import LoginPage from "../../pages/talent/login/loginPage";
import { urls } from "@/utils/urls";
import { getOtpFromMailtrap, enterOtpForTalent } from "@/helpers/mailtrapOtp";
import { test, expect } from './_setup/talentTest';
import { TalentRegisterPage } from "@/pages/talent/register/registerPage";
import { getAccessTokenSmart } from "@/helpers/api/authApi";
import { getPublishedProjects } from "@/helpers/api/projectApi";
import { talentAuditionPageLocators } from "@/pages/talent/audition/auditionPageLocators";
import { validLogin } from "@/test-data/loginData";
import { applyRegistrationConfig, getAllPages, getFieldsByPageId } from "@/helpers/api/talentOnboardingFieldsApi";
import { defaultConfig, fullConfig } from "@/test-data/dataModelConfig";
import { createCastingApiContext } from "@/helpers/api/castingApiContext";
import { APIRequestContext } from "@playwright/test";

test.describe.serial('Talent registration scenarioes', () => {
let api: APIRequestContext;
test.beforeAll(async ({ request }) => {
  api = await createCastingApiContext(request);
});
  test("validate talent registration fields per page agaist casting default data model config",
    async ({ page, request, talentEmail }) => {

      test.setTimeout(300000);

      // 🔐 create authenticated API context ONCE

      await applyRegistrationConfig(api, defaultConfig);
      await page.waitForTimeout(15000);

      await expect.poll(async () => {
        const f = await getFieldsByPageId(api, 1);
        return f.length;
      }).toBeGreaterThan(0);

      await page.waitForTimeout(15000);

      // open UI
      await page.goto(urls.talent, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(5000);

      const login = new LoginPage(page);
      await login.validTalentLogin(talentEmail);

      const otp = await getOtpFromMailtrap(request, talentEmail, 120000);
      await enterOtpForTalent(page, otp);
      await page.waitForTimeout(25000);

      // 🔴 IMPORTANT: use api context here
      const pages = await getAllPages(api);

      const talentRegisterPage = new TalentRegisterPage(page);

      for (let i = 0; i < pages.length; i++) {

        const p = pages[i];
        console.log("Checking page:", p.name);

        // 🔴 use api
        const apiFields = await getFieldsByPageId(api, p.id);

        const expectedLabels = apiFields.map(f => f.label.trim());
        console.log("API Labels:", expectedLabels);

        // read UI
        let uiLabelsRaw = await page.locator("form label:visible").allTextContents();

        if (uiLabelsRaw.length === 0) {
          uiLabelsRaw = await page.locator(".font-bold:visible").allTextContents();
        }

        let cleanedUiLabels = uiLabelsRaw
          .map(l => l.replace("*", "").trim())
          .filter(l => expectedLabels.includes(l));

        console.log("UI Labels:", cleanedUiLabels);

        for (const expected of expectedLabels) {
          expect(cleanedUiLabels).toContain(expected);
        }

        // required stars
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

        // fill required
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
          }
        }

        const isUploadPage = apiFields.some(f => f.name === "avatar");

        if (isUploadPage) {
          await talentRegisterPage.uploadProfilePicture();
          await talentRegisterPage.saveCroppedProfilePicture();
        }

        if (p.page_no === 1) {
          await talentRegisterPage.clickTermsAndConditionCheckBox();
        }

        await talentRegisterPage.clickContinueButton();

        if (i < pages.length - 1) {
          const nextPage = pages[i + 1];

          // 🔴 use api
          const nextFields = await getFieldsByPageId(api, nextPage.id);
          const nextLabel = nextFields[0]?.label;

          if (nextLabel) {
            await page.getByText(nextLabel, { exact: false }).waitFor();
          }
        }
      }
    }
  );

  test("talent registration with defined config", async ({ page, request, talentEmail }) => {
    test.setTimeout(350000);

    // 🔐 create authenticated API context ONCE
    await page.waitForTimeout(15000);
    await page.waitForTimeout(30000);

    //config preperation
    await applyRegistrationConfig(api, fullConfig);
    await page.waitForTimeout(30000);

    await expect.poll(async () => {
      const f = await getFieldsByPageId(api, 1);
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

    //get pages  🔴 FIX: use api
    const pages = await getAllPages(api);
    const talentRegisterPage = new TalentRegisterPage(page);

    for (let i = 0; i < pages.length; i++) {

      const p = pages[i];
      console.log("Checking page:", p.name);

      //get active fields  🔴 FIX: use api
      const apiFields = await getFieldsByPageId(api, p.id);
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

        // 🔴 FIX: use api
        const nextFields = await getFieldsByPageId(api, nextPage.id);
        const nextLabel = nextFields[0]?.label;

        if (nextLabel) {
          await page.getByText(nextLabel, { exact: false }).waitFor();
        }
      }
    }
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