import { Page } from "playwright";
import path = require("path");
import { expect } from "playwright/test";
import { memberTypesLocators } from "../memberType/memberTypePageLocators";
import { accountTeamLocators } from "./accountTeamPageLocators";


export class AccountTypePage {
    constructor(private page: Page) { }

    async selectAccountType() {
        const dropdown = this.page.locator(accountTeamLocators.memberTypeDropdown);
        await dropdown.click();

        const option = this.page.locator('.n-base-select-option', {
            hasText: 'Casting'
        });

        await option.waitFor({ state: 'visible' });
        await option.click();
    }

    async enterMemberEmail(email: string) {
        await this.page.locator(accountTeamLocators.emailInput).fill(email);

    }

    async clickCreatememberButton() {
        await this.page.locator(accountTeamLocators.createMemberTypeButton).click();
        await expect(this.page.getByText('Add team members')).toBeVisible();
    }

    async clickAddMemeber() {
        await this.page.locator(accountTeamLocators.createMemberModel_addMemberBtn).click();


        const table = this.page
            .locator('.n-data-table-wrapper')
            .first()
            .locator('.n-data-table-table');

        await expect(table).toBeVisible();
    }

    async sendInvitationWithoutMemberDataAndValidations() {
        await this.page.locator("//span[normalize-space()='Send Invitation']").click();
        await expect(this.page.locator(memberTypesLocators.createMemeberValidation)).toHaveText('Please add at least one member');
    }

    async addTeamMemberWithoutRoleTypeAndValidation() {
        await this.page.locator(accountTeamLocators.createMemberModel_addMemberBtn).click();
        const validation = this.page.locator(accountTeamLocators.createMemeberValidation);

        await validation.waitFor({ state: 'visible' });

        await expect(validation).toHaveText('Value is required');
    }

    async sendInvitation() {
        const modal = this.page.getByRole('dialog');

        await modal.getByRole('button', { name: 'Send Invitation' }).click();

        await expect(
            modal.getByText('Send Invitation')
        ).toBeHidden({ timeout: 10000 }); await expect(
            this.page.getByText('Send Invitation')
        ).toBeHidden({ timeout: 10000 });
    }

    async searchMember(email: string): Promise<void> {
        await this.page.locator(accountTeamLocators.searchMember).hover();
        await this.page.locator(accountTeamLocators.searchInput).fill(email);
    }

    async ensureMemberData(email: string, role: string, status: string): Promise<void> {
        await expect(async () => {

            await this.searchMember(email);

            const row = this.page.locator('tr.n-data-table-tr', {
                has: this.page.locator('[data-col-key="name"]', { hasText: email })
            });

            if (!(await row.first().isVisible().catch(() => false))) {
                await this.page.reload();
                await this.page.waitForLoadState('networkidle');
                await this.searchMember(email);
            }

            await expect(row).toBeVisible();

            await expect(row.locator('[data-col-key="name"]')).toContainText(email);
            await expect(row.locator('[data-col-key="role"]')).toContainText(role);
            await expect(row.locator('[data-col-key="status"]')).toContainText(status);

        }).toPass({ timeout: 15000 });
    }

    async removeUserAndVerify(email: string) {

        const row = this.page.locator('.n-data-table-tr', {
            has: this.page.getByText(email)
        });

        await row.locator('[data-testid*="actions-dropdown"]').click();
        await this.page.getByText('Remove', { exact: true }).click();

        const confirmBtn = this.page.getByRole('button', { name: /confirm|yes|remove/i });
        if (await confirmBtn.isVisible().catch(() => false)) {
            await confirmBtn.click();
        }

        // empty state
        await expect(this.page.getByText('No team members to display')).toBeVisible();

        // clear search
        const searchInput = this.page.locator('input[placeholder*="Search"]');
        await searchInput.fill('');

        // wait for refresh
        await this.page.waitForLoadState('networkidle');

        // final verification
        const table = this.page.locator('.n-data-table-wrapper').first();

        await expect(table.getByText(email)).toHaveCount(0);
    }

    async deleteMemberAndVerify(email: string) {
        await this.searchMember(email);

        const row = this.page.locator('.n-data-table-tr', {
            has: this.page.getByText(email)
        });

        await row.locator('[data-testid*="actions-dropdown"]').click();

        // await this.page.getByText('Remove', { exact: true }).click();

        const removeOption = this.page.locator('[data-testid*="option-remove"]');
        await expect(removeOption).toBeVisible();
        await removeOption.click();

        const confirmBtn = this.page.getByRole('button', { name: /confirm|yes|remove/i });
        if (await confirmBtn.isVisible().catch(() => false)) {
            await confirmBtn.click();
        }

        await expect(
            this.page.getByText('No team members to display')
        ).toBeVisible({ timeout: 25000 });

        const searchInput = this.page.locator('input[placeholder*="Search"]');

        await searchInput.click();
        await searchInput.fill('');

        await this.page.reload();
        await this.page.waitForLoadState('networkidle');

        await this.searchMember(email);
        const table = this.page.locator('.n-data-table-wrapper').first();

        await expect(
            table.getByText(email)
        ).toHaveCount(0);


    }

}