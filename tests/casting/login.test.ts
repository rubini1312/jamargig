import { expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import * as data from "../../test-data/test-data.json";
// @ts-ignore: import of JSON file without type declarations
//const data = require("../test-data/test-data.json");


test.describe('Casting owner member login scenarios', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login')
    });
    test("User login with valid credentials test", async ({ page }) => {
        const login = new LoginPage(page);
        //await page.goto('/login')
        await login.validLogin(data.email, data.password);
        await expect(page).toHaveURL('/projects');
    });
});