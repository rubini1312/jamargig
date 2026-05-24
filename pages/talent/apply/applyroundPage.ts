import { Page } from "playwright";
import { talentApplyPageLocators } from "./applyRoundPageLocators";
import path from "path";
import process from "process";
import fs from "fs";
import { expect } from "playwright/test";

export class TalentApplyPage {
    constructor(private page: Page) { }

    async clickApplyOnlineround() {
        await this.page.locator(talentApplyPageLocators.applyBtn_onlineRound).click();
    }

    async enterSubmission(submission: string) {
        await this.page.locator(talentApplyPageLocators.questionSubmissionInput).fill(submission);
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

    async selectSkills(skills: string[]) {
        for (const skill of skills) {
            await this.page
                .locator(".n-checkbox")
                .filter({ hasText: skill })
                .click();
        }
    }

    async selectRadioOption(option: string) {
        await this.page
            .locator(".n-radio")
            .filter({ hasText: option })
            .click();
    }

    async selectCountry(country: string) {
        await this.page.locator(".n-base-selection-label").first().click();

        await this.page
            .locator(".n-base-select-option")
            .filter({ hasText: country })
            .click();
    }

    async selectAvailability(period: string, option: string) {
        await this.page
            .locator(".n-form-item")
            .filter({ hasText: period })
            .locator("label.n-radio-button", { hasText: option })
            .click();
    }
    async clickUploadButton(mediaName: string) {

        const section = this.page
            .locator('.n-form-item')
            .filter({ hasText: mediaName })
            .first();

        await section.locator('button.browse').click();

    }
    async openMediaLibrary() {
        await this.page.locator(talentApplyPageLocators.addMediaButton).click();
    }

    async addMediaFromDevice(fileName: string) {

        const filePath = path.join(process.cwd(), "test-files", fileName);

        const fileInput = this.page.locator("input.n-upload-file-input");

        await fileInput.setInputFiles(filePath);

        await this.page.getByRole("button", { name: "Add Media to Application" }).click();
    }

    async addMediaToLibrary() {
        await this.page.locator(talentApplyPageLocators.addToLibraryBtn).click();
    }

    async addMediaToApplication() {
        await this.page.locator(talentApplyPageLocators.addMediaToApplication).click();
    }

    async selectMedia(mediaName: string) {

        await this.page
            .locator("div")
            .filter({ hasText: mediaName })
            .locator(".n-checkbox-box__border")
            .click();

    }


    async verifyImageIsDownloadable(
        page: Page,
        mediaName: string
    ) {
        const downloadDir = path.join(process.cwd(), "downloads");

        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir);
        }

        const checkbox = page.locator('div[role="checkbox"]').first();
        await expect(checkbox).toBeVisible();

        const card = page.locator('div[role="button"]', { hasText: 'Test role' });

        await card.scrollIntoViewIfNeeded();
        await card.click();

        const image = page.locator(`img[src*="${mediaName}"]`);
        await expect(image).toBeVisible();

        await page.waitForFunction((name) => {
            const img = document.querySelector(`img[src*="${name}"]`) as HTMLImageElement;
            return img && img.complete && img.naturalWidth > 0;
        }, mediaName);

        const [newPage] = await Promise.all([
            page.waitForEvent("popup"),
            page.locator('span[role="button"]').last().click()
        ]);

        await newPage.waitForLoadState();

        const url = newPage.url();
        console.log("File URL:", url);

        const response = await page.request.get(url);
        const buffer = await response.body();

        const filePath = path.join(downloadDir, mediaName);
        fs.writeFileSync(filePath, buffer);

        console.log("Downloaded:", filePath);
    }

    async getAuditionDetailProjectName() {

        return await this.page
            .locator(talentApplyPageLocators.auditionDetail_projectName)
            .first()
            .textContent();
    }

    async getAuditionRoundName() {

        return await this.page
            .locator(talentApplyPageLocators.auditionRoundName)
            .first()
            .textContent();
    }

    async getAuditionDetailRoleName() {

        return await this.page
            .locator(talentApplyPageLocators.auditionDetail_roleName)
            .textContent();
    }


    async clickProfilePhotoUpload() {

        await this.page
            .locator(talentApplyPageLocators.uploadMediaButtons)
            .nth(0)
            .click();
    }

    async clickVideoPerformanceUpload() {

        await this.page
            .locator(talentApplyPageLocators.uploadMediaButtons)
            .nth(1)
            .click();
    }

    async clickAudioUpload() {

        await this.page
            .locator(talentApplyPageLocators.uploadMediaButtons)
            .nth(2)
            .click();
    }

    async clickDocumentUpload() {

        await this.page
            .locator(talentApplyPageLocators.uploadMediaButtons)
            .nth(3)
            .click();
    }

    async uploadMedia(filePath: string) {

        await this.page
            .locator(talentApplyPageLocators.uploadMediaDragger)
            .setInputFiles(filePath);
    }

    async clickAddToLibrary() {
        await this.page.locator(':text("Add to Library")').click();
        await expect(this.page.getByText('Select Media from Library')).toBeVisible();
    }

    async clickAddToApplication() {
        await this.page.locator(':text("Add Media to Application")').click();
        await expect(this.page.getByText('Select Media from Library')).toBeHidden();
    }

}