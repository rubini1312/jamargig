import LoginPage from "../../pages/talent/login/loginPage";
import { urls } from "@/utils/urls";
import { getOtpFromMailtrap, enterOtp } from "@/helpers/mailtrapOtp";
import { test, expect } from './_setup/talentTest';
import { TalentRegisterPage } from "@/pages/talent/register/registerPage";


test.describe.serial('Talent registration scenarioes', () => {
  test.beforeEach(async ({ page }) => {
  await page.goto(urls.talent, { waitUntil: 'commit' });
  await page.waitForLoadState('domcontentloaded');
});


  test('register new talent with all talent details', async ({ request, page, talentEmail }) => {
    test.setTimeout(100000);

    const login = new LoginPage(page);
    await login.validTalentLogin(talentEmail);

    const otp = await getOtpFromMailtrap(request, talentEmail, 60000);
    await enterOtp(page, otp);

    const talentRegisterPage = new TalentRegisterPage(page);

    await talentRegisterPage.enterFullName('Automation Talent');
    await talentRegisterPage.enterStageName('Automation Talent Stage');
    await talentRegisterPage.setLocation('Colombo, LKA');
    await talentRegisterPage.selectGender(1);
    await talentRegisterPage.openDOBAndSelectDate('20 Apr 1990');
    await talentRegisterPage.clickTermsAndConditionCheckBox();
    await talentRegisterPage.clickContinueButton();

    await talentRegisterPage.uploadProfilePicture();
    await talentRegisterPage.saveCroppedProfilePicture();
    await talentRegisterPage.clickContinueButton();

    await talentRegisterPage.selectSelfRatedSkill(1, 'Acting');
    await talentRegisterPage.selectUnions(1)
    await talentRegisterPage.enterDescription('Automating Talent Profile Description')
    await talentRegisterPage.clickContinueButton();

    await talentRegisterPage.selectProductType(1);
    await talentRegisterPage.clickContinueButton();

    await page.waitForURL(urls.talent, { timeout: 180000 });
  });


  test('login as registred new talent', async ({ request, page, talentEmail }) => {
    test.setTimeout(100000);
    
    const login = new LoginPage(page);
    await login.validTalentLogin(talentEmail);
    await page.waitForTimeout(5000);

    const otp = await getOtpFromMailtrap(request, talentEmail, 240000);
    await enterOtp(page, otp);
    await page.waitForURL(urls.talent, { timeout: 60000 });
  });

});