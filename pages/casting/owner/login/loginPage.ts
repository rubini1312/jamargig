import { Page } from "@playwright/test";
import { loginLocators } from "./loginPageLocators";

export default class loginPage {
  constructor(public page: Page) { }

  async validLogin(email: string, password: string) {
    await this.enterEmail(email);
    await this.clickOnLoginBtn();
    await this.enterPassword(password);
    await this.clickOnLoginBtn();
  }

  async enterEmail(email: string) {
    await this.page.locator(loginLocators.email).fill(email);
  }

  async enterPassword(password: string) {
    await this.page.locator(loginLocators.password).fill(password);
  }

  async clickOnLoginBtn() {
    await this.page.locator(loginLocators.logInButton).click();
    await this.page.waitForLoadState("domcontentloaded");
  }
}