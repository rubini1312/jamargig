import { expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import { validLogin, invalidPasswordLogin, emptyLogin, invalidEmailLogin } from "@/test-data/loginData";
import { urls } from "@/utils/urls";
import { loginLocators } from "@/pages/casting/owner/login/loginPageLocators";
import { updateCastingSettings } from "@/helpers/api/casting/settingsApi";
import { getAccessTokenSmartFromCasting } from "@/helpers/api/casting/authApi";
import { enterOtpForCasting } from "@/utils/mailtrapOtp";


test.describe("Casting owner settings", () => {


    test("Login lock after max invalid attempts (2FA disabled)", async ({ page, request }) => {

        test.setTimeout(350000);
        await page.waitForTimeout(65 * 1000);

        const login = new LoginPage(page);
        const token = await getAccessTokenSmartFromCasting(request, validLogin.email);

        await updateCastingSettings(request, token, {
            two_factor_auth: false,
            max_limit: "5",
            blocking_time: "1"
        });
        await page.goto(urls.casting);

        await login.enterEmail(validLogin.email);

        const loginBtn = page.locator(loginLocators.logInButton);
        await loginBtn.waitFor({ state: "visible", timeout: 15000 });
        await expect(loginBtn).toBeEnabled();
        await loginBtn.click();

        const passwordField = page.locator(loginLocators.password);
        await passwordField.waitFor({ state: "visible", timeout: 20000 });

        for (let i = 1; i <= 6; i++) {
            console.log(`Attempt ${i}`);

            await passwordField.fill("WrongPassword123");
            await loginBtn.click();
            await page.waitForTimeout(5000);

            const errorText = await login.getUnauthorizedLoginError();
            if (i <= 5) {
                expect(errorText).toMatch(/unauthorized/i);
            } else {
                expect(errorText).toMatch(/The account is blocked due to many attempts, please try after 1 minutes/);
                console.log("Blocked reached → stopping further attempts");
                break;
            }

            await page.waitForTimeout(1000);
        }

        const blockedMessage = await login.getUnauthorizedLoginError();

        expect(blockedMessage).toMatch(/The account is blocked due to many attempts, please try after 1 minutes/);

        console.log("User is blocked as expected");

        console.log("Waiting for lock time...");
        await page.waitForTimeout(60 * 1000);

        await passwordField.fill(validLogin.password);
        await loginBtn.click();

        await expect(page).not.toHaveURL(urls.casting);
    });


    test("Login lock after max invalid attempts (2FA enabled)", async ({ page, request }) => {

        test.setTimeout(350000);
        await page.waitForTimeout(65 * 1000);

        const login = new LoginPage(page);
        const token = await getAccessTokenSmartFromCasting(request, validLogin.email);

        await updateCastingSettings(request, token, {
            two_factor_auth: true,
            max_limit: "2",
            blocking_time: "1"
        });
        await page.goto(urls.casting);

        await login.enterEmail(validLogin.email);

        const loginBtn = page.locator(loginLocators.logInButton);
        await loginBtn.waitFor({ state: "visible", timeout: 15000 });
        await expect(loginBtn).toBeEnabled();
        await loginBtn.click();

        const passwordField = page.locator(loginLocators.password);
        await passwordField.waitFor({ state: "visible", timeout: 20000 });

        for (let i = 1; i <= 3; i++) {
            console.log(`Attempt ${i}`);

            await passwordField.fill(validLogin.password);
            await loginBtn.click();
            await page.waitForTimeout(5000);

            const otp = "555555";
            await enterOtpForCasting(page, otp);
            const errorText = await login.getUnauthorizedLoginError();
            if (i <= 2) {
                expect(errorText).toMatch(/unauthorized/i);
            } else {
                expect(errorText).toMatch(/The account is blocked due to many attempts, please try after 1 minutes/);
                console.log("Blocked reached → stopping further attempts");
                break;
            }

            await page.waitForTimeout(1000);
        }

        const blockedMessage = await login.getUnauthorizedLoginError();

        expect(blockedMessage).toMatch(/The account is blocked due to many attempts, please try after 1 minutes/);

        console.log("User is blocked as expected");

        console.log("Waiting for lock time...");
        await page.waitForTimeout(60 * 1000);

        await passwordField.fill(validLogin.password);
        await loginBtn.click();

        await expect(page).not.toHaveURL(urls.casting);
    });


});

