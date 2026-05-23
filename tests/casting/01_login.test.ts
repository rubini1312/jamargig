import { expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import { validLogin, invalidPasswordLogin, emptyLogin, invalidEmailLogin } from "@/test-data/loginData";
import { urls } from "@/utils/urls";
import { loginLocators } from "@/pages/casting/owner/login/loginPageLocators";


test.describe("Casting owner login", () => {

  // =========================================================
  test("User login with empty email input", async ({ page }) => {
    const login = new LoginPage(page);
    await page.goto(urls.casting);

    await login.enterEmail(emptyLogin.email);

    const loginBtn = page.locator(loginLocators.logInButton);
    await expect(loginBtn).toBeVisible();
    await expect(loginBtn).toBeEnabled();

    await loginBtn.click();

    const errorLocator = page.locator(loginLocators.valueRequiredError);
    await expect(errorLocator).toBeVisible({ timeout: 5000 });

    const errorText = await errorLocator.textContent();
    expect(errorText).toContain("Value is required");
  });


  // =========================================================
  test("User login with invalid email ", async ({ page, request }) => {
    const login = new LoginPage(page);
    await page.goto(urls.casting);

    // invalid email format
    await login.enterEmail(invalidEmailLogin.invalidformatemail);
    await page.waitForTimeout(2000);
    const validationText = await login.getInvalidInputError();
    expect(validationText).toContain("Value is not a valid email address");

    // unAuthorized email
    await login.enterEmail(invalidEmailLogin.unAuthorizedEmail);
    const loginBtn = page.locator(loginLocators.logInButton);
    await loginBtn.waitFor({ state: "visible", timeout: 15000 });
    await expect(loginBtn).toBeEnabled();
    await loginBtn.click();

    const errorText = await login.getUnauthorizedLoginError();
    expect(errorText).toContain("Access unauthorized");
  });

  // =========================================================
  test("User login with valid email and invalid password", async ({ page, request }) => {
    const login = new LoginPage(page);
    await page.goto(urls.casting);

    // valid email
    await login.enterEmail(invalidPasswordLogin.email);
    const loginBtn = page.locator(loginLocators.logInButton);
    await loginBtn.waitFor({ state: "visible", timeout: 15000 });
    await expect(loginBtn).toBeEnabled();
    await loginBtn.click();

    // invalid password
    const passwordField = page.locator(loginLocators.password);
    await passwordField.waitFor({ state: "visible", timeout: 25000 });
    await passwordField.fill(invalidPasswordLogin.password);

    await expect(loginBtn).toBeEnabled({ timeout: 15000 });
    await loginBtn.click();

    const errorText = await login.getUnauthorizedLoginError();
    expect(errorText).toContain("Access unauthorized");
  });

  // =========================================================
  test("User login with valid credentials", async ({ page, request }) => {
    const login = new LoginPage(page);
    const status = await login.validLoginwithUI(validLogin.email, validLogin.password, request);
    console.log("2FA Status:", status);
  });


});