import { Page } from "playwright";
import { logoutLocators } from "./homePageLocatots";
import { expect } from "playwright/test";

export default class homePage {
  constructor(public page: Page) {}

  private locators = logoutLocators;

  async logout(): Promise<void> {

    const profileButton = this.page.locator(this.locators.profileButton);
    const logoutButton = this.page.locator(this.locators.logoutButton);

    await expect(profileButton).toBeVisible();
    await profileButton.click();

    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    await this.page.waitForLoadState("domcontentloaded");
    await expect(this.page).toHaveURL(/\/login/);
  }
}