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
import { generateEmail } from "@/test-data/random-data";
import { getAccessTokenSmartFromCasting } from "@/helpers/api/casting/authApi";
import { getTalentAccessToken } from "@/helpers/api/talent/authApi";
import { talentRegisterLocators } from "@/pages/talent/register/registerPageLocators";

test.describe('Talent registration scenarios', () => {
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


  test("validate talent registration fields per page against casting default data model config",
    async ({ page, request }) => {

      test.setTimeout(240000);

      await applyRegistrationConfig(request, token, defaultConfig);

      const uniqueName = `Autom-Talent ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const talentEmail = generateEmail();

      await expect.poll(async () => {
        const f = await getFieldsByPageId(request, 1, token);
        return f.length;
      }, {
        timeout: 60000,
        intervals: [2000]
      }).toBeGreaterThan(0);

      await page.goto(urls.talent, { waitUntil: "domcontentloaded" });

      const login = new LoginPage(page);
      await login.validTalentLogin(talentEmail);
      await expect(page.locator('[data-testid="auth-form"]')).toBeVisible();

      const otp = await getOtpFromMailtrap(request, talentEmail, 120000);
      await enterOtpForTalent(page, otp);

      await expect(page.locator(talentRegisterLocators.fullNameInput)).toBeVisible();
      await page.waitForLoadState("networkidle");

      const pages = await getAllPages(request, token);
      const talentRegisterPage = new TalentRegisterPage(page);

      for (let i = 0; i < pages.length; i++) {

        const p = pages[i];
        console.log("Checking page:", p.name);

        const apiFields = await getFieldsByPageId(request, p.id, token);
        const expectedLabels = apiFields.map(f => f.label.trim());

        let uiLabelsRaw = await page.locator("form label").allTextContents();

        if (uiLabelsRaw.length === 0) {
          uiLabelsRaw = await page.locator(".font-bold").allTextContents();
        }

        const cleanedUiLabels = uiLabelsRaw
          .map(l => l.replace("*", "").trim())
          .filter(Boolean);

        console.log("UI Labels:", cleanedUiLabels);

        // Validate labels
        for (const expected of expectedLabels) {
          expect(cleanedUiLabels).toContain(expected);
        }

        for (const field of apiFields) {
          if (!field.required) continue;

          const label = page
            .locator(".n-form-item-label__text")
            .filter({ hasText: new RegExp(`^${field.label}\\b`) });

          if (await label.count() === 0) continue;

          await expect(label.first()).toHaveText(/\*/);
        }

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

      await expect(getTalentUuidByName(request, token, uniqueName)).rejects.toThrow();

    });



  test("Full talent journey (register → login → verify projects)", async ({ page, request }) => {

    test.setTimeout(400000);

    await applyRegistrationConfig(request, token, fullConfig);

    const uniqueName = `Autom-Talent ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const talentEmail = generateEmail();

    await page.goto(urls.talent);

    const login = new LoginPage(page);
    await login.validTalentLogin(talentEmail);
    await expect(page.locator('[data-testid="auth-form"]')).toBeVisible();

    const otp = await getOtpFromMailtrap(request, talentEmail, 120000);
    await enterOtpForTalent(page, otp);

    await expect(page.locator(talentRegisterLocators.fullNameInput)).toBeVisible();
    await page.waitForLoadState("networkidle");

    const pages = await getAllPages(request, token);
    const talentRegisterPage = new TalentRegisterPage(page);

    // registration loop 
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      const apiFields = await getFieldsByPageId(request, p.id, token);

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

      if (apiFields.some(f => f.name === "avatar" || f.name === "profile_photo")) {
        await talentRegisterPage.uploadProfilePicture();
        await talentRegisterPage.saveCroppedProfilePicture();
      }

      if (p.page_no === 1) {
        await talentRegisterPage.clickTermsAndConditionCheckBox();
      }

      await talentRegisterPage.clickContinueButton();
    }

    const uuid = await getTalentUuidByName(request, token, uniqueName);
    expect(uuid).toBeTruthy();

    const talentToken = await getTalentAccessToken(request, talentEmail)
    const result = await getPublishedProjects(request, talentToken);
    console.log("API Projects:", result.names);

    await page.locator(talentAuditionPageLocators.auditionCards).first().waitFor();

    const uiTitles = (await page
      .locator(talentAuditionPageLocators.auditionCardTitles)
      .allTextContents())
      .map(t => t.trim());

    console.log("UI Titles:", uiTitles);

    expect(uiTitles.length).toBeGreaterThan(0);

    for (const uiTitle of uiTitles) {
      expect(result.names).toContain(uiTitle);
    }

  });

});




