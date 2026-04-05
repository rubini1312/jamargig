import { expect, Page } from "@playwright/test";
import { forgotPasswordLocators } from "./forgotPasswordPageLocators";
import { loginLocators } from "../login/loginPageLocators";

export default class ForgotpasswordPage {

    constructor(public page: Page) { }

    async enterInvalidEmailAndValidate(email: string, expectedMsg: string) {

        await this.page.locator(forgotPasswordLocators.emailInput).fill(email);
        await this.page.locator(forgotPasswordLocators.gettokenButton).click();
        await expect(this.page.getByText(expectedMsg)).toBeVisible();
        await expect(this.page.locator(forgotPasswordLocators.valueRequiredError)).toHaveText(expectedMsg);

    }

    async getOtpForResetPassword(email: string) {

        await this.page.locator(forgotPasswordLocators.emailInput).fill(email);
        await this.page.locator(forgotPasswordLocators.gettokenButton).click();

        await expect(this.page.getByText("Check your email for your login code")).toBeVisible();

    }

    async resetPassword(password: string) {

        await expect(this.page.getByText("Please enter your password and confirm")).toBeVisible();
        await this.page.locator(forgotPasswordLocators.resetPassword_newPassword).fill(password);
        await this.page.locator(forgotPasswordLocators.resetPassword_confirmPassword).fill(password);
        await this.page.locator(forgotPasswordLocators.savePasswordButton).click();
        await expect(this.page.getByText("Save Password")).toBeHidden();

    }

    async resetPasswordWithInvalidPassowrdsAndValidation(password: string, confirmPassword: string, expectedMsg: string, count: number) {

        await expect(this.page.getByText("Please enter your password and confirm")).toBeVisible();
        await this.page.locator(forgotPasswordLocators.resetPassword_newPassword).fill(password);
        await this.page.locator(forgotPasswordLocators.resetPassword_confirmPassword).fill(confirmPassword);
        await this.page.locator(forgotPasswordLocators.savePasswordButton).click();
        await expect(this.page.getByText(expectedMsg)).toHaveCount(count);
    }
}
