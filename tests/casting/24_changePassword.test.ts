import { expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import { validLogin } from "@/test-data/loginData";
import { urls } from "@/utils/urls";
import HomePage from "@/pages/casting/owner/home/homePage";
import ManageAccountPage from "@/pages/casting/owner/manageAccount/manageAccountPage";

test.describe("Casting owner Change Password Scenarios", () => {


    test.beforeEach(async ({ page, request }) => {
        const loginPage = new LoginPage(page);
        const twoFaStatus = await loginPage.validLoginwithUI(
            validLogin.email,
            validLogin.password,
            request
        );
        console.log(`2FA status detected: ${twoFaStatus}`);

        await page.goto(`${urls.casting}/profile`, {
            waitUntil: 'domcontentloaded',
        });

        await page.goto(urls.casting + "/profile", { waitUntil: 'networkidle' });
    });


    // =========================================================
    test("Change Password - should not change password without confirm password", async ({ page, request, browser }) => {

        const homePage = new HomePage(page);
        const manageAccountPage = new ManageAccountPage(page);
        manageAccountPage.clickOnPasswordField();
        manageAccountPage.changePasswordWithInvalidPasswordsAndValidate('abcd', ' ', 'Password confirmation does not match.');

    });

    test("Change Password - should not change password with mismatch password", async ({ page}) => {

        const homePage = new HomePage(page);
        const manageAccountPage = new ManageAccountPage(page);
        manageAccountPage.clickOnPasswordField();
        manageAccountPage.changePasswordWithInvalidPasswordsAndValidate('abcd', '', 'Password confirmation does not match.');

    });

    test("Change Password - should change password with valid and matching passwords", async ({page}) => {

        //const homePage = new HomePage(page);
        const manageAccountPage = new ManageAccountPage(page);
        manageAccountPage.clickOnPasswordField();
        manageAccountPage.changePassword('@ut0maT312345', '@ut0maT312345');

    });
});

