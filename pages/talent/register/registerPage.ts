import { Page } from '@playwright/test';
import { talentRegisterLocators } from './registerPageLocators';
import path = require('path');

export class TalentRegisterPage {
  constructor(private page: Page) { }

  async enterFullName(name: string) {
    await this.page.locator(talentRegisterLocators.fullNameInput).fill(name);
  }

  async enterStageName(stageName: string) {
    await this.page.locator(talentRegisterLocators.stageNameInput).fill(stageName);
  }

  async selectGender(index: number) {
    await this.page.locator(talentRegisterLocators.genderSelector).click();
    const options = this.page.locator(talentRegisterLocators.dropDownOptions);
    await this.page.keyboard.press('ArrowDown');
    await this.page.keyboard.press('Enter');
  }

  async setLocation(value: string) {
    const input = this.page.locator(talentRegisterLocators.locationInput);
    await input.scrollIntoViewIfNeeded();
    await input.fill(value);

    const option = this.page.getByRole('option', { name: value }).first();
    try {
      await option.waitFor({ state: 'visible', timeout: 5000 });
      await option.click();
      return;

    } catch {
      await input.press('Enter');
    }
  }

  async openDOBAndSelectDate(dob: string) {
    await this.page.locator(talentRegisterLocators.dobPicker).fill(dob);
  }

  async clickTermsAndConditionCheckBox() {
    await this.page.locator(talentRegisterLocators.termsAndConditionCheckBox).click();
  }

  async clickContinueButton() {
    const continueBtn = this.page.locator(talentRegisterLocators.continueButton);
    await continueBtn.scrollIntoViewIfNeeded();
    await continueBtn.click();
    await this.page.waitForTimeout(5000);
  }

  async uploadProfilePicture() {
    const filePath = path.join(process.cwd(), "test-files/images/test-role.jpg");
    await this.page.waitForLoadState('domcontentloaded');
    const fileInput = this.page.locator(talentRegisterLocators.uploadInput);
    await fileInput.waitFor({ state: "attached" });
    await fileInput.setInputFiles(filePath);
  }

  async saveCroppedProfilePicture() {
    await this.page.waitForTimeout(3000);
    await this.page.locator(talentRegisterLocators.cropImageSaveButton).click();
  }

  async selectSelfRatedSkill(index: number, skill: string) {
    await this.page.locator(talentRegisterLocators.selfRatedSkillsDropdown).click();
    await this.page.waitForTimeout(3000);
    await this.page.locator(talentRegisterLocators.selfRatedSkillsInput).fill(skill);
    const options = this.page.locator(talentRegisterLocators.dropDownOptions);
    await this.page.keyboard.press('ArrowDown');
    await this.page.keyboard.press('Enter');
  }

  async selectUnions(index: number) {
    await this.page.locator(talentRegisterLocators.unionsDropdown).click();
    const options = this.page.locator(talentRegisterLocators.dropDownOptions);
    await this.page.keyboard.press('ArrowDown');
    await this.page.keyboard.press('Enter');
  }

  async enterDescription(description: string) {
    await this.page.locator(talentRegisterLocators.descriptionInput).fill(description);
  }

  async enterMobile(number: string) {
    await this.page.locator(talentRegisterLocators.mobileInput).fill(number);
  }

  async selectProductType(index: number) {
    await this.page.locator(talentRegisterLocators.productionTypeSelector).click();
    const options = this.page.locator(talentRegisterLocators.dropDownOptions);
    await this.page.keyboard.press('ArrowDown');
    await this.page.keyboard.press('Enter');
  }

}
