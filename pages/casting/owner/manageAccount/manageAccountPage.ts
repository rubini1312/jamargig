import { expect, Page } from "@playwright/test";
import { manageAccountLocators } from "./manageAccountPageLocators";

export default class ManageAccountPage {

    constructor(public page: Page) { }

    async clickOnPasswordField() {
        const wrapper = this.page.locator('.editable-field-content-inner', {
            hasText: 'Password'
        });

        await expect(wrapper).toBeVisible();

        await wrapper.scrollIntoViewIfNeeded(); // ✅ now safe

        await wrapper.click();

        // const editBtn = wrapper.locator('button');

        // await expect(editBtn).toBeVisible();
        // await editBtn.click();

        // wait for edit mode
        await expect(this.page.getByText('CONFIRM PASSWORD')).toBeVisible();
    }

    async changePasswordWithInvalidPasswordsAndValidate(newPassword: string, confirmPassword: string, expectedMsg: string) {

        await this.page.locator(manageAccountLocators.newPasswordField).click();

        await this.page.locator(manageAccountLocators.newPasswordField).fill(newPassword);
        await this.page.locator(manageAccountLocators.confirmPasswordField).fill(confirmPassword);
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