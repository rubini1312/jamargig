import { Page } from "playwright";
import path = require("path");
import { expect } from "playwright/test";
import { memberTypesLocators } from "./memberTypePageLocators";


export class MemberTypePage {
    constructor(private page: Page) { }

    async selectPermission(rowName: string, columnIndex: number) {
        const row = this.page.locator(`text=${rowName}`)
            .locator('xpath=ancestor::div[contains(@class,"permission-choice")]');

        const checkbox = row.locator('.n-checkbox-box').nth(columnIndex);

        await checkbox.click();
        await expect(checkbox).toHaveClass(/checked|active/);
    }

    async entermemberName(name: string) {
        await this.page.locator(memberTypesLocators.memberNameInput).fill(name);

    }

    async clickOnMemberTypesTab() {
        await this.page.locator(memberTypesLocators.memberTypesTab).click();
        await expect(this.page.getByText('Add team member')).toBeVisible();
    }

    async clickCreateMember() {
        await this.page.locator(memberTypesLocators.createMemberTypeButton).click();
        await expect(
            this.page.getByText('Create Member Type')
        ).toBeVisible({ timeout: 10000 });

        const permissions = this.page.locator('text=Project Permissions');
        await permissions.waitFor({ state: 'visible', timeout: 25000 });
    }

    async sendInvitationWithoutMemberDataAndValidations() {
        await this.page.locator(memberTypesLocators.createMemberSaveButton).click();
        await expect(this.page.locator(memberTypesLocators.createMemeberValidation)).toHaveText('Role label is required.');
    }

    async saveMemeber() {
        await this.page.locator(memberTypesLocators.createMemberSaveButton).click();
        await expect(
            this.page.getByText('Save')
        ).toBeHidden({ timeout: 10000 });
    }

}