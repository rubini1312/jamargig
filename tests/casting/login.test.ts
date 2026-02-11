import { expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import * as data from "../../test-data/test-data.json";



test.describe("Casting owner login", () => {

  test("User login with valid credentials", async ({ page }) => {
    const login = new LoginPage(page);
    await login.validLogin(data.email, data.password);
    await expect(page).toHaveURL(/projects/);
  });

});