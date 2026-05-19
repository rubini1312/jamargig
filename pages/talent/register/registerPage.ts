import { Page } from '@playwright/test';
import { talentRegisterLocators } from './registerPageLocators';
import path = require('path');
import { roleLocators } from '@/pages/casting/owner/role/rolePageLocators';

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
    const filePath = path.join(
      process.cwd(),
      'test-files/images/test-role.jpg'
    );

    // Wait until the file input is attached to the DOM
    const fileInput = this.page.locator(talentRegisterLocators.uploadInput);

    await fileInput.waitFor({
      state: 'attached',
      timeout: 15000,
    });

    // Upload the file
    await fileInput.setInputFiles(filePath);

    // Optional: wait briefly for crop modal to appear
    await this.page.waitForTimeout(2000);
  }

  async saveCroppedProfilePicture() {
    // Wait until the Continue button is visible and enabled
    const continueButton = this.page.locator(
      talentRegisterLocators.cropImageSaveButton
    );


    await continueButton.waitFor({
      state: 'visible',
      timeout: 15000,
    });

    await continueButton.click();
  }

  async uploadRandomSupportedMedia() {
    const supportedFiles = [
      'test-files/images/test-role.jpg',      // JPG
      'test-files/images/test-pngFile.png',   // PNG
      'test-files/images/test-webpFile.webp', // WEBP
    ];

    const randomFile =
      supportedFiles[Math.floor(Math.random() * supportedFiles.length)];

    console.log(`Selected media file: ${randomFile}`);

    const filePath = path.join(process.cwd(), randomFile);

    const container = this.page.locator('[data-testid="auth-m_CmsQ"]');

    await container.waitFor({
      state: 'visible',
      timeout: 15000,
    });

    const fileInput = container.locator('input[type="file"]');

    await fileInput.waitFor({
      state: 'attached',
      timeout: 15000,
    });

    await fileInput.setInputFiles(filePath);

    const uploadedFileName = await fileInput.evaluate(
      (input: HTMLInputElement) => input.files?.[0]?.name || null
    );

    console.log(`Uploaded file: ${uploadedFileName}`);

    await this.page.waitForTimeout(3000);
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

  async uploadMedia(filePath: string) {

    const tab = this.page.locator(roleLocators.addMaterial_btn);
    await tab.waitFor({ state: "visible", timeout: 30000 });
    await tab.click();

    const browseFileOption = this.page.locator(roleLocators.materialBrowse_option);
    await browseFileOption.waitFor({ state: "visible", timeout: 30000 });
    await browseFileOption.click();

    await this.page.getByText("Drop file or browse").waitFor({ timeout: 30000 });

    await this.page.setInputFiles(
      '[data-testid="material-add-upload"] input[type="file"]',
      filePath
    );
  }


}
