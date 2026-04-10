import { Page } from "playwright";
import { talentHomePageLocators } from "./homePageLocator";
import { expect } from "playwright/test";


export class TalentHomePage {
  constructor(private page: Page) { }

  async enterProjectName(project: string) {
    await this.page.locator(talentHomePageLocators.projectSearchBar).fill(project);
  }

  async clickApplyForSearchedProject(roleName : string) {
    await this.page.locator(talentHomePageLocators.searchedProjectApplyButton).click();

    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.getByText(roleName)).toBeVisible();
  }
}