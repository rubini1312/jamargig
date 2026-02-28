import { Page } from "playwright";
import { talentApplyPageLocators } from "./applyRoundLocators";


export class TalentApplyPage {
    constructor(private page: Page) { }

    async clickApplyOnlineround() {
        await this.page.locator(talentApplyPageLocators.applyBtn_onlineRound).click();
    }

    async clickSubmit() {
        await this.page.locator(talentApplyPageLocators.submitBtn).click();
    }

    async getEmptyRoleError() {
        return await this.page
            .locator(talentApplyPageLocators.emptyRole_errorMsg)
            .textContent();
    }

    async clickRoleSelector() {
        await this.page.locator(talentApplyPageLocators.role_selector).click();
    }

    async getSubmitedTagText() {
        return await this.page
            .locator(talentApplyPageLocators.submitedTag)
            .textContent();
    }

    async getSubmitedRole() {
        return await this.page
            .locator(talentApplyPageLocators.submitedRole)
            .textContent();
    }
}