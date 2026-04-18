import { expect, Page } from "@playwright/test";
import { manageAccountLocators } from "./manageAccountPageLocators";

export default class ManageAccountPage {

    constructor(public page: Page) { }

    async clickOnPasswordField() {
        await this.page.locator('text=Password')
            .locator('xpath=ancestor::div[contains(@class,"n-form-item")]')
            .locator('button')
            .click();

        // wait for edit mode
        await expect(this.page.getByText('CONFIRM PASSWORD')).toBeVisible();

    }

    async changePasswordWithInvalidPasswordsAndValidate(newPassword: string, confirmPassword: string, expectedMsg: string) {

        const passwordInput = this.page.locator('div[label="Password"] input');
        const confirmInput = this.page.locator('div[label="Confirm Password"] input');

        await passwordInput.fill(newPassword);
        // await confirmInput.fill(confirmPassword);
        await this, this.page.locator(manageAccountLocators.saveButton).click();

        await expect(this.page.getByText(expectedMsg)).toBeVisible();
        await expect(this.page.locator(manageAccountLocators.invalidNewPasswordsValidation)).toHaveText(expectedMsg);

    }

    async changePassword(newPassword: string, confirmPassword: string) {

        await this.page.locator(manageAccountLocators.newPasswordField).click();

        await this.page.locator(manageAccountLocators.newPasswordField).fill(newPassword);
        await this.page.locator(manageAccountLocators.confirmPasswordField).fill(confirmPassword);
        await this, this.page.locator(manageAccountLocators.saveButton).click();


    }
}