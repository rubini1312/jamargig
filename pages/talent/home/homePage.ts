import { Page } from "playwright";
import { talentHomePageLocators } from "./homePageLocator";


export class TalentHomePage {
  constructor(private page: Page) { }

  async enterProjectName(project: string) {
    await this.page.locator(talentHomePageLocators.projectSearchBar).fill(project);
  }

  async clickApplyForSearchedProject() {
    await this.page.locator(talentHomePageLocators.searchedProjectApplyButton).click();
  }


}