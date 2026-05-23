import { expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import { validLogin } from "@/test-data/loginData";
import { urls } from "@/utils/urls";
import { MemberTypePage } from "@/pages/casting/owner/settings/memberType/memberTypePage";

test.describe("Casting owner create Member Type flow", () => {


    test.beforeEach(async ({ page, request }) => {
        const loginPage = new LoginPage(page);
        const twoFaStatus = await loginPage.validLoginwithUI(
            validLogin.email,
            validLogin.password,
            request
        );
        console.log(`2FA status detected: ${twoFaStatus}`);

        await page.goto(`${urls.casting}/projects`, {
            waitUntil: 'domcontentloaded',
        });

        await expect(page).toHaveURL(/projects/);
    });


    // =========================================================
    test("Create member- should shows validation (required fields)", async ({ page }) => {

        await page.goto(urls.casting + "/settings");
        await expect(page.getByTitle('Member Types')).toBeVisible();
        const memeberTypesPage = new MemberTypePage(page)

        await memeberTypesPage.clickOnMemberTypesTab();
        await memeberTypesPage.clickCreateMember();
        await memeberTypesPage.sendInvitationWithoutMemberDataAndValidations();

    });


    // =========================================================
    test("Create member- should create member successfully", async ({ page }) => {

        await page.goto(urls.casting + "/settings");
        await expect(page.getByTitle('Member Types')).toBeVisible();
        const memeberTypesPage = new MemberTypePage(page)

        await memeberTypesPage.clickOnMemberTypesTab();
        await memeberTypesPage.clickCreateMember();
        await memeberTypesPage.entermemberName("Automation Member");
        await memeberTypesPage.selectPermission('Project Details', 1);
        await memeberTypesPage.selectPermission('Questions', 2);
        await memeberTypesPage.selectPermission('Roles', 2);
        await memeberTypesPage.saveMemeber();


    });

});