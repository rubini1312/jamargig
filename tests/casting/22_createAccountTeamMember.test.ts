import { APIRequestContext, expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import { validLogin } from "@/test-data/loginData";
import { urls } from "@/utils/urls";
import { generateEmail } from "@/test-data/random-data";
import { AccountTypePage } from "@/pages/casting/owner/settings/accountTeam/accountTeamPage";
import { MailtrapService } from "@/utils/mailtrapInvitation";
import { AccountTeamRegisterPage } from "@/pages/casting/owner/settings/accountTeamRegister/accountTeamRegisterPage";
import { getAccessTokenSmartFromCasting } from "@/helpers/api/casting/authApi";
import { getUserUuidByEmail, removeTeamMember } from "../../helpers/api/casting/accountTeamApi";

test.describe("Casting owner Account Team Member Type flow", () => {


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
    test("Create Account Member- should shows validation (required fields)", async ({ page }) => {

        await page.goto(urls.casting + "/settings");
        await expect(page.getByTitle('Member Types')).toBeVisible();
        const accountTeamPage = new AccountTypePage(page)
        const email = generateEmail();

        await accountTeamPage.clickCreatememberButton();
        await accountTeamPage.addTeamMemberWithoutRoleTypeAndValidation();
        await accountTeamPage.sendInvitationWithoutMemberDataAndValidations();

    });


    // =========================================================
    test("Create member- should show the memeber details & should receive invitation successfully", async ({ page, request }) => {

        await page.goto(urls.casting + "/settings");
        await expect(page.getByTitle('Member Types')).toBeVisible();
        const accountTeamPage = new AccountTypePage(page)
        const email = generateEmail();

        await accountTeamPage.clickCreatememberButton();
        await accountTeamPage.enterMemberEmail(email);

        await accountTeamPage.selectAccountType();
        await accountTeamPage.clickAddMemeber();
        await accountTeamPage.sendInvitation();

        await accountTeamPage.ensureMemberData(email, "Casting", "Pending");

        const mailtrap = new MailtrapService(request);

        const link = await mailtrap.getInvitationLink(email);

        expect(link).toBeTruthy();

        await page.goto(link);
        await expect(page).toHaveURL(/\/register\?token=/);

    });

    // =========================================================
    test("Create member & Registration- validations should visible (required validation)", async ({ page, request, browser }) => {

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

        const mailtrap = new MailtrapService(request);

        const link = await mailtrap.getInvitationLink(email);
        console.log(link);
        expect(link).toBeTruthy();

        const context = await browser.newContext();
        const invitePage = await context.newPage();

        await invitePage.goto(link, { waitUntil: 'domcontentloaded' });
        await invitePage.waitForLoadState('networkidle');

        await expect(invitePage).toHaveURL(/register\?token=/);
        await expect(invitePage.getByText('Create a casting account')).toBeVisible();

        const registerPage = new AccountTeamRegisterPage(invitePage);

        await registerPage.clickNext();
        await registerPage.assertValidationErrors(6, 'Value is required');

        await registerPage.enterDataForRegistration("abc@gmail.com", "TestAutomation-Member");
        await registerPage.CheckTermsAndConditions();
        await registerPage.clickNext();
        await registerPage.assertTokenValidation('Please provide the email that the invitation send to');

    });

    // =========================================================
    test("Create member & Registration- should register member successfully", async ({ page, request, browser }) => {

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

        const mailtrap = new MailtrapService(request);

        const link = await mailtrap.getInvitationLink(email);
        console.log(link);
        expect(link).toBeTruthy();

        const context = await browser.newContext();
        const invitePage = await context.newPage();

        await invitePage.goto(link, { waitUntil: 'domcontentloaded' });
        await invitePage.waitForLoadState('networkidle');

        await expect(invitePage).toHaveURL(/register\?token=/);
        await expect(invitePage.getByText('Create a casting account')).toBeVisible();

        const registerPage = new AccountTeamRegisterPage(invitePage);

        await registerPage.enterDataForRegistration(email, "TestAutomation-Member");
        await registerPage.CheckTermsAndConditions();
        await registerPage.clickNext();

        await expect(invitePage.getByText("Add a photo of yourself")).toBeVisible();
        await registerPage.clickNext();
        await invitePage.waitForURL("**/projects", { timeout: 60000 });

        const token = await getAccessTokenSmartFromCasting(request, validLogin.email);
        const memberUuid = await getUserUuidByEmail(request, token, email);
        await removeTeamMember(request, token, memberUuid, email);
    });

});

