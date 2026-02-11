import { Page } from '@playwright/test';
import { talentRegisterLocators } from './registerPageLocators';

export class TalentLoginPage {
  constructor(private page: Page) {}

  async enterFullName(name: string) {
    await this.page.locator(talentRegisterLocators.fullNameInput).fill(name);
  }

  async enterStageName(stageName: string) {
    await this.page.locator(talentRegisterLocators.stageNameInput).fill(stageName);
  }

  async selectGender(index : number) {
    await this.page.locator(talentRegisterLocators.genderSelector).click();
    const options = this.page.locator(talentRegisterLocators.genderOptions);
    await options.first().waitFor({ state: 'visible' });
    await options.nth(index).click();
  }

  async enterLocation() {
    await this.page.locator(talentRegisterLocators.locationInput).click();
  }

  async openDOB() {
    await this.page.locator(talentRegisterLocators.dobPicker).click();
  }

}
