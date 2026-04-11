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
        test.setTimeout(180000);

        const login = new LoginPage(page);
        const token = await getAccessTokenSmartFromCasting(request, validLogin.email);

        await updateCastingSettings(request, token, {
            two_factor_auth: false,
            max_limit: "5",
            blocking_time: "1"
        });
        await page.waitForTimeout(60000);

        await page.goto(urls.casting);

        await login.enterEmail(validLogin.email);

        const loginBtn = page.locator(loginLocators.logInButton);
        await expect(loginBtn).toBeEnabled();

        await loginBtn.click();

        const passwordField = page.locator(loginLocators.password);
        await expect(passwordField).toBeVisible();

        // Attempts
        for (let i = 1; i <= 6; i++) {
            console.log(`Attempt ${i}`);

            await passwordField.fill("WrongPassword123");
            await loginBtn.click();

            // Wait for error instead of timeout
            const errorLocator = page.locator(loginLocators.unAuthorizedLoginAlert);

            await expect(errorLocator).toBeVisible();

            const errorText = await errorLocator.textContent();

            if (i <= 5) {
                expect(errorText).toMatch(/unauthorized/i);
            } else {
                expect(errorText).toMatch(/account is blocked/i);
                break;
            }
        }

        // Verify blocked
        await expect(page.locator(loginLocators.unAuthorizedLoginAlert))
            .toContainText(/account is blocked/i);

        console.log("User is blocked as expected");

        // Verify still blocked before 1 minute
        await passwordField.fill(validLogin.password);
        await loginBtn.click();

        const blockedMsg = page.locator(loginLocators.unAuthorizedLoginAlert);
        await expect(blockedMsg).toContainText(/account is blocked/i);

        console.log("Still blocked before 1 minute ");


        // Wait for blocking time 
        await page.waitForTimeout(60000);


        // Try login after 1 minute
        await passwordField.fill(validLogin.password);
        await loginBtn.click();

        await page.waitForLoadState('networkidle');

        await expect(page).toHaveURL(/projects/);
        console.log("Login successful after blocking time ");

    });


    test("Login lock after max invalid attempts (2FA enabled)", async ({ page, request }) => {
        test.setTimeout(180000);

        const login = new LoginPage(page);
        const token = await getAccessTokenSmartFromCasting(request, validLogin.email);

        // Update settings
        await updateCastingSettings(request, token, {
            two_factor_auth: true,
            max_limit: "2",
            blocking_time: "1"
        });
        await page.waitForTimeout(75000);

        await page.goto(urls.casting);

        await login.enterEmail(validLogin.email);

        const loginBtn = page.locator(loginLocators.logInButton);
        await expect(loginBtn).toBeEnabled();
        await loginBtn.click();

        const passwordField = page.locator(loginLocators.password);
        await expect(passwordField).toBeVisible();
        await passwordField.fill(validLogin.password);
        await loginBtn.click();

        // Attempts 
        for (let i = 1; i <= 3; i++) {
            console.log(`Attempt ${i}`);


            // Wait for otp input before entering
            await page.locator(loginLocators.enterOtpInput).first().waitFor({ state: "visible" });
            await enterOtpForCasting(page, "555555");
            const errorText = await login.getUnauthorizedLoginError();

            if (i <= 2) {
                expect(errorText).toMatch(/The passcode you entered is invalid/i);
            } else {
                expect(errorText).toMatch(/account is blocked/i);
                console.log("Blocked reached → stopping further attempts");
                break;
            }
        }

        // Verify blocked message
        const blockedMessage = await login.getUnauthorizedLoginError();
        expect(blockedMessage).toMatch(/account is blocked/i);

        console.log("User is blocked as expected");

        // Try before 1 minute 
        await passwordField.fill(validLogin.password);
        await loginBtn.click();

        await page.locator(loginLocators.enterOtpInput).first().waitFor({ state: "visible" });
        await enterOtpForCasting(page, "555555");

        const stillBlocked = await login.getUnauthorizedLoginError();
        expect(stillBlocked).toMatch(/account is blocked/i);

        console.log("Still blocked before 1 minute ");

        // Wait for unblock
        await page.waitForTimeout(60000);

        // Try after 1 minute 
        await passwordField.fill(validLogin.password);
        await loginBtn.click();

        await page.locator(loginLocators.enterOtpInput).first().waitFor({ state: "visible" });
        await enterOtpForCasting(page, "123456");

        await page.waitForLoadState("networkidle");

        await expect(page).toHaveURL(/projects/);

        console.log("Login successful after blocking time ");
    });


});

