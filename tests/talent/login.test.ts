import loginPage from "@/pages/talent/login/loginPage";
import { generateEmail } from "@/test-data/random-data";
import { getOtpFromMailtrap, enterOtp } from "@/helpers/mailtrapOtp";
import { test, expect } from './_setup/talentTest';

test.describe("Talent login", () => {

  test("New talent login and verify OTP", async ({ page, request }) => {
    test.setTimeout(120000)
    const login = new loginPage(page);
    const talentEmail = generateEmail();
    await login.validTalentLogin(talentEmail);
    
    const otp = await getOtpFromMailtrap(request, talentEmail, 60000);
    await enterOtp(page, otp);

    });
});