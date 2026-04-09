import { expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import { urls } from "@/utils/urls";
import { loginLocators } from "@/pages/casting/owner/login/loginPageLocators";
import ForgotpasswordPage from "@/pages/casting/owner/forgotPassword/forgotPasswordPage";
import { generateEmail } from "@/test-data/random-data";
import { enterOtpForCastingResetPassword, getOtpFromMailtrap } from "@/utils/mailtrapOtp";
import { validLogin } from "@/test-data/loginData";
import { changePassword, getAccessTokenSmartFromCastingForDynamicUser } from "@/helpers/api/casting/authApi";
import { emptyResetPasswords, emptyNewPassword, emptyConfirmPassword, mistmatchPasswords, resetPassword } from "@/test-data/resetPasswordData";
import { updateCastingSettings } from "@/helpers/api/casting/settingsApi";

test.describe("Casting owner Reset Password Scenarioes", () => {

    let token: string;

    test.beforeEach(async ({ page, request }) => {
        token = await getAccessTokenSmartFromCastingForDynamicUser(request, validLogin.email, "@ut0maT312345");

        await updateCastingSettings(request, token, {
            two_factor_auth: false,
            max_limit: "5",
            blocking_time: "1"
        });

        await page.goto(urls.casting);
    });

    test.afterAll(async ({ request }) => {
        token = await getAccessTokenSmartFromCastingForDynamicUser(request, validLogin.email, resetPassword.password);
        await changePassword(request, token, validLogin.password);

    });

    // =========================================================
    test("Reset Password - should not reset password with empty email input", async ({ page}) => {

        const login = new LoginPage(page);
        await login.enterEmail(validLogin.email);
        const loginBtn = login.page.locator(loginLocators.logInButton);
        await loginBtn.waitFor({ state: "visible", timeout: 15000 });
        await expect(loginBtn).toBeEnabled();
        await loginBtn.click();
        await login.clickOnForgotPasswordLink();

        const forgotPassword = new ForgotpasswordPage(page);
        await forgotPassword.enterInvalidEmailAndValidate(' ', "Value is required")

    });

    test("Reset Password - should not reset password with invalid email (format) input", async ({ page}) => {

        const login = new LoginPage(page);
        await login.enterEmail(validLogin.email);
        const loginBtn = login.page.locator(loginLocators.logInButton);
        await loginBtn.waitFor({ state: "visible", timeout: 15000 });
        await expect(loginBtn).toBeEnabled();
        await loginBtn.click();
        await login.clickOnForgotPasswordLink();

        const forgotPassword = new ForgotpasswordPage(page);
        await forgotPassword.enterInvalidEmailAndValidate('abd', "Value is not a valid email address")

    });

    test("Reset Password - should not receive the code for unauthorized email", async ({ page, request }) => {

        const login = new LoginPage(page);
        await login.enterEmail(validLogin.email);
        const loginBtn = login.page.locator(loginLocators.logInButton);
        await loginBtn.waitFor({ state: "visible", timeout: 15000 });
        await expect(loginBtn).toBeEnabled();
        await loginBtn.click();
        await login.clickOnForgotPasswordLink();

        const forgotPassword = new ForgotpasswordPage(page);
        const userEmail = generateEmail();
        await forgotPassword.getOtpForResetPassword(userEmail);

        const otp = await getOtpFromMailtrap(request, userEmail, 30000, false);

        expect(otp).toBeFalsy();

    });

    test("Reset Password - should receive the code for authorized email & shuld reset password only for valid password inputs", async ({ page, request}) => {

        await new Promise(res => setTimeout(res, 65000));

        const login = new LoginPage(page);
        await login.enterEmail(validLogin.email);
        const loginBtn = login.page.locator(loginLocators.logInButton);
        await loginBtn.waitFor({ state: "visible", timeout: 15000 });
        await expect(loginBtn).toBeEnabled();
        await loginBtn.click();
        await login.clickOnForgotPasswordLink();

        const forgotPassword = new ForgotpasswordPage(page);
        const requestTime = Date.now();

        await forgotPassword.getOtpForResetPassword(validLogin.email);

        const otp = await getOtpFromMailtrap(request, validLogin.email, 30000, false);
        expect(otp).toBeTruthy();

        if (!otp) {
            throw new Error("OTP not received");
        }

        await enterOtpForCastingResetPassword(page, otp);
        await forgotPassword.resetPasswordWithInvalidPassowrdsAndValidation(emptyResetPasswords.password, emptyResetPasswords.confirmPassword, "Value is required", 2);
        await forgotPassword.resetPasswordWithInvalidPassowrdsAndValidation(emptyConfirmPassword.password, emptyConfirmPassword.confirmPassword, "Value is required", 1);
        await forgotPassword.resetPasswordWithInvalidPassowrdsAndValidation(emptyNewPassword.password, emptyNewPassword.confirmPassword, "Value is required", 1);

        //mistmatch password validation
        await forgotPassword.resetPasswordWithInvalidPassowrdsAndValidation(mistmatchPasswords.password, mistmatchPasswords.confirmPassword, "Passwords do not match", 1);

        //reset
        await forgotPassword.resetPassword(resetPassword.password);
        await expect(page).toHaveURL(/projects/);;



    });



});


