import { expect, Page } from "@playwright/test";
import { talentloginPageLocators } from "./loginPageLocators";
import { urls } from "@/utils/urls";

export default class loginPage {
  [x: string]: any;
  constructor(public page: Page) { }

  async validTalentLogin(email: string) {
    await this.page.goto(urls.talent, { waitUntil: 'domcontentloaded' });
    await this.enterEmail(email);
    await this.clickOnContinueBtn();
  }

  async enterEmail(email: string) {
    await expect(this.page.locator(talentloginPageLocators.emailInput)).toBeVisible();
    await this.page.locator(talentloginPageLocators.emailInput).fill(email);
  }

  async clickOnContinueBtn() {
    await this.page.locator(talentloginPageLocators.continueButton).click();
    await this.page.waitForLoadState("domcontentloaded");
  }

}