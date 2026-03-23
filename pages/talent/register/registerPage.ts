import { Page, expect } from '@playwright/test';
import { talentRegisterLocators } from './registerPageLocators';
import path = require('path');

export class TalentRegisterPage {
  constructor(private page: Page) {}

  async enterFullName(name: string) {
    await this.page.locator(talentRegisterLocators.fullNameInput).fill(name);
  }

  async enterStageName(stageName: string) {
    await this.page.locator(talentRegisterLocators.stageNameInput).fill(stageName);
  }

  async selectGender(index: number) {
    await this.page.locator(talentRegisterLocators.genderSelector).click();

    const options = this.page.locator(talentRegisterLocators.dropDownOptions);
    await expect(options.first()).toBeVisible();

    await options.nth(index).click();
  }

  async setLocation(value: string) {
    const input = this.page.locator(talentRegisterLocators.locationInput);

    await input.fill(value);

    const option = this.page.getByRole('option', { name: value }).first();

    if (await option.isVisible().catch(() => false)) {
      await option.click();
    } else {
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

    // ✅ wait for next page (form change)
    await this.page.waitForLoadState('networkidle');
  }

  async uploadProfilePicture() {
    const filePath = path.join(process.cwd(), "test-files/images/test-role.jpg");

    const fileInput = this.page.locator(talentRegisterLocators.uploadInput);
    await fileInput.setInputFiles(filePath);

    // wait for crop modal
    await expect(this.page.locator(talentRegisterLocators.cropImageSaveButton))
      .toBeVisible();
  }

  async saveCroppedProfilePicture() {
    const saveBtn = this.page.locator(talentRegisterLocators.cropImageSaveButton);

    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // wait until crop modal disappears
    await expect(saveBtn).toBeHidden();
  }

  async selectSelfRatedSkill(index: number, skill: string) {
    await this.page.locator(talentRegisterLocators.selfRatedSkillsDropdown).click();

    const input = this.page.locator(talentRegisterLocators.selfRatedSkillsInput);
    await input.fill(skill);

    const options = this.page.locator(talentRegisterLocators.dropDownOptions);
    await expect(options.first()).toBeVisible();

    await options.nth(index).click();
  }

  async selectUnions(index: number) {
    await this.page.locator(talentRegisterLocators.unionsDropdown).click();

    const options = this.page.locator(talentRegisterLocators.dropDownOptions);
    await expect(options.first()).toBeVisible();

    await options.nth(index).click();
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
    await expect(options.first()).toBeVisible();

    await options.nth(index).click();
  }
}