import { Page } from "playwright";
import { logoutLocators } from "./homePageLocatots";
import { expect } from "playwright/test";

export default class HomePage {
  constructor(public page: Page) { }

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

  async clickManageAccount() {

    const profileButton = this.page.locator(this.locators.profileButton);
    const manageAccountBtn = this.page.locator(this.locators.manageAccountBtn);

    await expect(profileButton).toBeVisible();
    await profileButton.click();

    console.log("profile button clicked");
    await expect(manageAccountBtn).toBeVisible();
    await manageAccountBtn.click();

    await expect(this.page).toHaveURL(/\/profile/);
    await expect(this.page.getByText('Password')).toBeVisible();

  }
}