import { Page, APIRequestContext } from "@playwright/test";
import { loginLocators } from "./loginPageLocators";
import { urls } from "@/utils/urls";
import { isTwoFactorEnabled } from "../../../../helpers/api/settingsApi";
import { enterOtp, getOtpFromMailtrap } from "../../../../helpers/mailtrapOtp"; 

export default class loginPage {
  constructor(public page: Page) {}

  async validLogin(
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
      await enterOtp(this.page, otp);
      // after OTP success
      await this.page.waitForURL("**/projects", { timeout: 60000 });

    } else {
      console.log("2FA disabled → dashboard");
      await this.page.waitForURL("**/projects", { timeout: 60000 });
    }
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
}
