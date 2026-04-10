import { Page } from "playwright";
import path = require("path");
import { expect } from "playwright/test";
import { memberTypesLocators } from "../memberType/memberTypePageLocators";
import { accountTeamLocators } from "../accountTeam/accountTeamPageLocators";
import { accountTeamRegisterLocators } from "./accountTeamRegisterLocator";


export class AccountTeamRegisterPage {
    constructor(private page: Page) { }

    async assertValidationErrors(expectedCount: number, expectedText: string) {
        const errors = this.page.locator('.n-form-item-feedback__line:visible');

        await expect(errors).toHaveCount(expectedCount);
        const expectedArray = Array(expectedCount).fill(expectedText);
        await expect(errors).toHaveText(expectedArray);
    }

    async assertTokenValidation(expectedText: string) {
        const alert = this.page.locator('.n-alert-body__content');

        await expect(alert).toBeVisible();
        await expect(alert).toContainText(expectedText);
    }

    async clickNext() {
        await this.page.locator('span').filter({ hasText: 'Next' }).last().click();
    }

    async CheckTermsAndConditions() {
        await this.page.locator(accountTeamRegisterLocators.termsAndConditionsCheckBox).click();
    }

    async enterDataForRegistration(email: string, name: string) {
        await this.page.locator(accountTeamRegisterLocators.fullname_input).fill(name);
        await this.page.locator(accountTeamRegisterLocators.email_input).fill(email);

        const countryInput = this.page.locator(accountTeamRegisterLocators.counrty_selector);
        await countryInput.click();
        await countryInput.fill('Can');
        const option = this.page.locator('.n-base-select-option', { hasText: 'Canada' });
        await expect(option).toBeVisible();
        await option.click();

        await this.page.locator(accountTeamRegisterLocators.password_input).fill("123456#ABCd");
        await this.page.locator(accountTeamRegisterLocators.confirmPassword_input).fill("123456#ABCd");
    }

}