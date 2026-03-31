
import { expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import { validLogin } from "@/test-data/loginData";
import { urls } from "@/utils/urls";
import { generateEmail } from "@/test-data/random-data";
import { AccountTypePage } from "@/pages/casting/owner/settings/accountTeam/accountTeamPage";
import { MailtrapService } from "@/utils/mailtrapInvitation";
import { AccountTeamRegisterPage } from "@/pages/casting/owner/settings/accountTeamRegister/accountTeamRegisterPage";

test.describe("Casting owner Account Team Member Type flow", () => {

    test.beforeEach(async ({ page, request }) => {
        await page.goto(urls.casting);
        const login = new LoginPage(page);
        const status = await login.validLoginwithUI(validLogin.email, validLogin.password, request);
        console.log("2FA Status:", status);
        await page.goto(urls.casting + "/projects");
        await expect(page).toHaveURL(/projects/);;
    });

    // =========================================================
    test("Delete member - should delete member successfully before registration", async ({ page, request, browser }) => {

        await page.goto(urls.casting + "/settings");
        await expect(page.getByTitle('Member Types')).toBeVisible();
        const accountTeamPage = new AccountTypePage(page);
        const email = generateEmail();

        await accountTeamPage.clickCreatememberButton();
        await accountTeamPage.enterMemberEmail(email);

        await accountTeamPage.selectAccountType();
        await accountTeamPage.clickAddMemeber();
        await accountTeamPage.sendInvitation();

        await accountTeamPage.ensureMemberData(email, "Casting", "Pending");

        await accountTeamPage.deleteMemberAndVerify(email);

    });
});