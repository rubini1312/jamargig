import { expect, Page } from "@playwright/test";
import { castListLocators } from "./castListLocators";

export default class CastListPage {
    constructor(public page: Page) { }

    async openFirstProjectIfNeeded() {
        const url = this.page.url();

        if (/\/projects\/\d+/.test(url)) return;

        console.log("Not inside project → opening first project");

        const project = this.page
            .locator('[data-testid$="cover-image"]')
            .first();

        await project.waitFor({ state: "visible", timeout: 20000 });

        const before = this.page.url();
        console.log("Before click:", before);

        await project.click();

        await Promise.race([
            this.page.waitForURL(/\/projects\/\d+/, { timeout: 20000 }),
            this.page.getByText("Roles").waitFor({ state: "visible", timeout: 20000 })
        ]);

        console.log("After click:", this.page.url());
    }

    async gotoCastListTab() {
        await this.openFirstProjectIfNeeded();
        const tab = this.page.getByTitle("Working Cast List");
        await tab.waitFor({ state: "visible", timeout: 30000 });
        await tab.click();
        await this.page.getByText("New Working Cast List").waitFor({ timeout: 30000 });
    }

    async clickDeleteButton() {
        await this.page.locator(castListLocators.deleteCast_btn).click();
        await expect(this.page.locator(castListLocators.deleteConfirmationBtn)).toBeVisible();
    }

    async clickDeleteConfirmationButton() {
        const confirmBtn = this.page.locator(castListLocators.deleteConfirmationBtn);
        await confirmBtn.click();
    }

    async closeDeleteConfirmationModel() {
        const close = this.page.locator(castListLocators.deleteconfirmation_closeIcon);
        await close.click();
    }

    async clickCreateWcl() {
        const create = this.page.locator(castListLocators.addwcl_createBtn);
        await create.click();
    }

    async enterWclName(wclName: string) {
        const name = this.page.locator(castListLocators.addwcl_nameInput);
        await name.fill(wclName);
    }
    async selectRole(wclRoleName: string) {
        const dropdown = this.page.locator(castListLocators.addwcl_roleDropdown);
        const input = this.page.locator(castListLocators.addwcl_roleDropdownInput);
        await dropdown.click();

        await input.fill(wclRoleName);
        const option = this.page.locator('.n-base-select-option', {
            hasText: wclRoleName
        }).first();

        await expect(option).toBeVisible({ timeout: 10000 });
        await option.click();
    }

    async clickAdd() {
        await this.page.locator(castListLocators.addwcl_addBtn).click();
    }

    async clickSubmitBtn() {
        await this.page.locator(castListLocators.addwcl_submitBtn).click();
        await expect(this.page.locator(castListLocators.addwcl_submitBtn)).toBeHidden();

    }

    async verifyWclRow(data: {
        name: string;
        role?: string;
        status?: string;
    }) {
        const row = this.page.locator('tbody tr.n-data-table-tr').first();

        row.filter({
            has: this.page.locator(`[data-col-key="name"]`, { hasText: data.name })
        });

        await expect(row).toBeVisible();

        if (data.role) {
            await expect(row.locator('[data-col-key="roles"]'))
                .toHaveText(data.role);
        }

        if (data.status) {
            await expect(row.locator('[data-col-key="status"]'))
                .toHaveText(data.status);
        }
    }

    async clickEditBtn() {
        await this.page.locator(castListLocators.editCast_btn).click();
    }

    async clickUpdateBtn() {
        await this.page.locator(castListLocators.editCast_updateBtn).click();
        await expect(this.page.locator(castListLocators.editCast_updateBtn)).toBeHidden();

    }

}