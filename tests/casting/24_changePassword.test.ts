import { expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import { validLogin } from "@/test-data/loginData";
import { urls } from "@/utils/urls";
import HomePage from "@/pages/casting/owner/home/homePage";
import ManageAccountPage from "@/pages/casting/owner/manageAccount/manageAccountPage";

test.describe("Casting owner Change Password Scenarios", () => {

    test.beforeEach(async ({ page, request }) => {
        await page.goto(urls.casting);
        const login = new LoginPage(page);
        const status = await login.validLoginwithUI(validLogin.email, validLogin.password, request);
        console.log("2FA Status:", status);
        await page.goto(urls.casting + "/profile");
        await page.goto(urls.casting + "/profile", { waitUntil: 'networkidle' });
    });

    // =========================================================
    test("Change Password - should not change password without confirm password", async ({ page, request, browser }) => {

        const homePage = new HomePage(page);
        const manageAccountPage = new ManageAccountPage(page);
        manageAccountPage.clickOnPasswordField();
        manageAccountPage.changePasswordWithInvalidPasswordsAndValidate('abcd', '', 'Password confirmation does not match.');

    });

    test("Change Password - should not change password with mismatch password", async ({ page, request, browser }) => {

        const homePage = new HomePage(page);
        const manageAccountPage = new ManageAccountPage(page);
        manageAccountPage.clickOnPasswordField();
        manageAccountPage.changePasswordWithInvalidPasswordsAndValidate('abcd', '', 'Password confirmation does not match.');

    });

        test("Change Password - should not change password with password", async ({ page, request, browser }) => {

        const homePage = new HomePage(page);
        const manageAccountPage = new ManageAccountPage(page);
        manageAccountPage.clickOnPasswordField();
        manageAccountPage.changePassword('@ut0maT312345', '@ut0maT312345');

    });
});

