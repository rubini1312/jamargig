import { Page, APIRequestContext, expect } from "@playwright/test";
import { loginLocators } from "./loginPageLocators";
import { urls } from "@/utils/urls";
import { enterOtpForCasting, getOtpFromMailtrap } from "@/utils/mailtrapOtp";
import { isTwoFactorEnabled } from "@/helpers/api/casting/settingsApi";

export default class loginPage {
  constructor(public page: Page) { }

  async validLoginwithApi(
    email: string,
    password: string,
    request: APIRequestContext
  ) {
    const twoFA = await isTwoFactorEnabled(request);
    console.log("2FA =", twoFA);

    await this.page.goto(urls.casting);
    await this.enterEmail(email);
    await this.clickOnLoginBtn();
    await this.enterPassword(password);
    await this.clickOnLoginBtn();

    if (twoFA) {
      console.log("2FA enabled → handle OTP");

      // wait for OTP field
      await this.page
        .locator(loginLocators.enterOtpInput)
        .waitFor({ state: "visible", timeout: 15000 });

      // fetch OTP from mailtrap + enter
      const otp = await getOtpFromMailtrap(request, email, 60000);
      await enterOtpForCasting(this.page, otp);
      // after OTP success
      await this.page.waitForURL("**/projects", { timeout: 60000 });

    } else {
      console.log("2FA disabled → dashboard");
      await this.page.waitForURL("**/projects", { timeout: 60000 });
    }
  }

  async validLoginwithUI(
    email: string,
    password: string,
    request: APIRequestContext
  ): Promise<"enabled" | "disabled"> {

    await this.page.goto(urls.casting);

    // email
    await this.enterEmail(email);
    const loginBtn = this.page.locator(loginLocators.logInButton);
    await loginBtn.waitFor({ state: "visible", timeout: 15000 });
    await expect(loginBtn).toBeEnabled();
    await loginBtn.click();

    // password
    const passwordField = this.page.locator(loginLocators.password);
    const otpField = this.page.locator(loginLocators.enterOtpInput);

    let flowStatus: "enabled" | "disabled" = "disabled";

    await passwordField.waitFor({ state: "visible", timeout: 25000 });
    await passwordField.fill(password);

    await expect(loginBtn).toBeEnabled({ timeout: 15000 });
    await loginBtn.click();
    await this.page.waitForTimeout(2000);

    // check for otp
    if (await otpField.isVisible().catch(() => false)) {

      await expect(otpField).toBeVisible({ timeout: 20000 });
      await this.page.waitForTimeout(4000);

      const otp = await getOtpFromMailtrap(request, email, 120000);
      await enterOtpForCasting(this.page, otp);
      await this.page.waitForURL("**/projects", { timeout: 60000 });
      await this.page.waitForLoadState("networkidle");

      flowStatus = "enabled";
    }

    //if not otp, wait for project oage
    else {
      await this.page.waitForURL("**/projects", { timeout: 60000 });
      flowStatus = "disabled";
    }

    // verify settings page navigation
    await this.page.goto(`${urls.casting}/settings/general-settings`);
    await this.page.waitForURL("**/settings/general-settings");

    //get 2FA status
    const twoFaSwitch = this.page.locator('[role="switch"]').first();
    await twoFaSwitch.waitFor({ state: "visible", timeout: 150000 });
    const aria = await twoFaSwitch.getAttribute("aria-checked");
    const settingsStatus = aria === "true" ? "enabled" : "disabled";
    expect(settingsStatus).toBe(flowStatus);

    return flowStatus;
  }

  async enterEmail(email: string) {
    await this.page.locator(loginLocators.email).fill(email);
  }

  async enterPassword(password: string) {
    await this.page.locator(loginLocators.password).fill(password);
  }

  async clickOnLoginBtn() {
    await this.page.locator(loginLocators.logInButton).click();
  }

  async getUnauthorizedLoginError() {
    await this.page.locator(loginLocators.unAuthorizedLoginAlert).waitFor({ state: "visible", timeout: 10000 });
    return this.page.locator(loginLocators.unAuthorizedLoginAlert).textContent();
  }

  async getInvalidInputError() {
    await this.page.locator(loginLocators.valueRequiredError).waitFor({ state: "visible", timeout: 10000 });
    return this.page.locator(loginLocators.valueRequiredError).textContent();
  }
}
