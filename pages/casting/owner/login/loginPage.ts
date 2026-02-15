import { Page } from "@playwright/test";
import { loginLocators } from "./loginPageLocators";
import { urls } from "@/utils/urls";

export default class loginPage {
  constructor(public page: Page) { }

  async validLogin(email: string, password: string) {
    await this.page.goto(urls.casting);
    await this.enterEmail(email);
    await this.clickOnLoginBtn();
    await this.enterPassword(password);
    await this.clickOnLoginBtn();
await Promise.all([
  this.page.waitForURL('**/projects', { timeout: 60000 }),
  this.page.waitForLoadState('domcontentloaded')
]);
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