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

}