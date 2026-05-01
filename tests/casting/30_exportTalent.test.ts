import { expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import { validLogin } from "@/test-data/loginData";
import { urls } from "@/utils/urls";
import { createProject, deleteProject, publishProject } from "@/helpers/api/casting/projectApi";
import ProjectPage from "@/pages/casting/owner/project/projectPage";
import { getAccessTokenSmartFromCasting } from "@/helpers/api/casting/authApi";
import ProjectDetailsPage from "@/pages/casting/owner/projectDetails/projectDetailsPage";
import { projectDetailsLocators } from "@/pages/casting/owner/projectDetails/projectDetailsPageLocators";
import Talentpage from "@/pages/casting/owner/talentProfile/talentPage";

test.describe('Casting owner-export talent records scenarios', () => {
    let token: string;
    let uniqueName: string;

    test.beforeAll(async ({ request }) => {
        token = await getAccessTokenSmartFromCasting(request, validLogin.email);
        uniqueName = `Automation Talent-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    });

    test.beforeEach(async ({ page, request }) => {
        await page.goto(urls.casting);
        const login = new LoginPage(page);
        const status = await login.validLoginwithUI(validLogin.email, validLogin.password, request);
        console.log("2FA Status:", status);
        await page.goto(urls.casting + "/projects"); await expect(page).toHaveURL(/projects/);
    });



    test("Download talent Excel file", async ({ page }) => {

        await page.goto(urls.casting + "/talents");
        const talentPage = new Talentpage(page);
        await page.waitForLoadState("networkidle");

        // download
        const [download] = await Promise.all([
            page.waitForEvent('download'),
            talentPage.clickDownloadButton(),
        ]);

        // save file to download dir
        const filePath = `downloads/talents.xlsx`;

        await download.saveAs(filePath);

        console.log("Downloaded file:", filePath);

        // verify file exists
        const fs = require('fs');
        expect(fs.existsSync(filePath)).toBeTruthy();

        // delete file
        fs.unlinkSync(filePath);

        // verify deletion
        expect(fs.existsSync(filePath)).toBeFalsy();
    });
});