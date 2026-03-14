import LoginPage from "../../pages/talent/login/loginPage";
import { urls } from "@/utils/urls";
import { getOtpFromMailtrap, enterOtpForTalent } from "@/utils/mailtrapOtp";
import { test, expect } from './_setup/talentTest';
import { TalentRegisterPage } from "@/pages/talent/register/registerPage";
import { createProject, deleteProject, getPublishedProjects, publishProject } from "@/helpers/api/casting/projectApi";
import { talentAuditionPageLocators } from "@/pages/talent/audition/auditionPageLocators";
import { validLogin } from "@/test-data/loginData";
import { applyRegistrationConfig, deleteTalent, getAllPages, getFieldsByPageId, getTalentUuidByName } from "@/helpers/api/casting/talentApi";
import { defaultConfig, fullConfig } from "@/test-data/dataModelConfig";
import { APIRequestContext } from "@playwright/test";
import { ClientRequest, IncomingMessage, request, RequestOptions } from "http";
import { URL } from "url";
import { generateEmail } from "@/test-data/random-data";
import { getAccessTokenSmartFromCasting } from "@/helpers/api/casting/authApi";

test.describe('Talent registration scenarioes', () => {
  let token: string;
  let projectId: number;
  let uniqueName: string;
  let talentRegistrationEmail: string;
  let talentRegistrationName: string;

  test.beforeAll(async ({ request }) => {

    // get token inside async scope
    token = await getAccessTokenSmartFromCasting(request, validLogin.email);
    talentRegistrationEmail = generateEmail();

    const { response } = await createProject(request, token);
    projectId = response.data.id;

    await publishProject(request, token, projectId);
    talentRegistrationName = `Automation Talent-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  });

  test.afterAll(async ({ request }) => {

    if (projectId) {
      await deleteProject(request, token, projectId);
    }

    if (talentRegistrationName) {
      try {
        const uuid = await getTalentUuidByName(request, token, talentRegistrationName);
        await deleteTalent(request, token, uuid);
      } catch (e) {
        console.log("Talent not found during cleanup");
      }
    }

  });


  test("validate talent registration fields per page agaist casting default data model config",
    async ({ page, request }) => {

      test.setTimeout(300000);
      await applyRegistrationConfig(request, token, defaultConfig);
      const uniqueName = `Autom-Talent ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const talentEmail = generateEmail();
      await page.waitForTimeout(15000);

      await expect.poll(async () => {
        const f = await getFieldsByPageId(request, 1, token);
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

      const pages = await getAllPages(request, token);
      const talentRegisterPage = new TalentRegisterPage(page);

      for (let i = 0; i < pages.length; i++) {

        const p = pages[i];
        console.log("Checking page:", p.name);

        const apiFields = await getFieldsByPageId(request, p.id, token);
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

        if (p.page_no === 1) {
          await talentRegisterPage.clickTermsAndConditionCheckBox();
        }

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

      //make sure talent is not registered
      await expect(
        getTalentUuidByName(request, token, uniqueName)
      ).rejects.toThrow();
    });


  test("talent registration with defined config", async ({ page, request }) => {
    test.setTimeout(350000);

    await page.waitForTimeout(30000);

    //config preperation
    await applyRegistrationConfig(request, token, fullConfig);
    const uniqueName = `Autom-Talent ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await page.waitForTimeout(30000);

    await expect.poll(async () => {
      const f = await getFieldsByPageId(request, 1, token);
      return f.length;
    }).toBeGreaterThan(0);
    await page.waitForTimeout(30000);

    //open talent UI
    await page.goto(urls.talent, { waitUntil: "domcontentloaded" });

    const login = new LoginPage(page);
    await login.validTalentLogin(talentRegistrationEmail);
    await page.waitForTimeout(5000);

    const otp = await getOtpFromMailtrap(request, talentRegistrationEmail, 120000);
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

          case "phone1":
            await talentRegisterPage.enterMobile("6152369");
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

    //make sure talent is registred
    const uuid = await getTalentUuidByName(request, token, uniqueName);
    expect(uuid).toBeTruthy();

  });

  test('login as newly registred new talent', async ({ request, page }) => {
    test.setTimeout(100000);

    const login = new LoginPage(page);
    await login.validTalentLogin(talentRegistrationEmail);
    await page.waitForTimeout(30000);

    const otp = await getOtpFromMailtrap(request, talentRegistrationEmail, 240000);
    await enterOtpForTalent(page, otp);
    await page.waitForURL(urls.talent, { timeout: 60000 });
  });

  test("verify listed projects to a newly registered talent", async ({ page, request }) => {

    const token = await getAccessTokenSmartFromCasting(request, validLogin.email);
    const result = await getPublishedProjects(request, token);

    const login = new LoginPage(page);
    await login.validTalentLogin(talentRegistrationEmail);
    await page.waitForTimeout(30000);

    const otp = await getOtpFromMailtrap(request, talentRegistrationEmail, 240000);
    await enterOtpForTalent(page, otp);
    await page.waitForURL(urls.talent, { timeout: 60000 });

    await page.locator(talentAuditionPageLocators.auditionCards).first().waitFor();
    const uiTitles = await page.locator(talentAuditionPageLocators.auditionCardTitles).allTextContents();
    expect(uiTitles).toEqual(expect.arrayContaining(result.names));

  });

});


