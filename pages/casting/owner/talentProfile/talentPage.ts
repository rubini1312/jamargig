import { expect, Page } from "@playwright/test";

export default class Talentpage {
    constructor(public page: Page) { }

    async getTalentCountFromPlaceholder(): Promise<number> {
        const placeholder = await this.page
            .getByPlaceholder(/Search/i)
            .getAttribute("placeholder");

        const count = Number(placeholder?.match(/\d+/)?.[0]);

        if (isNaN(count)) {
            throw new Error("Could not extract talent count from placeholder");
        }

        return count;
    }


    async clickDownloadButton() {
        const downloadBtn = this.page.locator('.filters-header button').nth(2);
        await downloadBtn.click();
    }

    async clickTalentCardByName(talentName: string) {
        const talentCard = this.page
            .locator('.card-title h3 span')
            .filter({ hasText: talentName })
            .first();

        await talentCard.scrollIntoViewIfNeeded();
        await talentCard.click();
        await expect(this.page.getByText('Talent Details')).toBeVisible();

    }
    async clickOnSubmissionFormTab(question: string) {

        const submittedFormTab = this.page
            .getByTestId('submitted-form-tab');
        await expect(submittedFormTab).toBeVisible();

        await submittedFormTab.click();
        await expect(this.page.getByText(question)).toBeVisible();

    }

    async clickOnSubmissionMediaTab(media: string) {

        const submittedFormTab = this.page
            .getByTestId('media-tab');
        await expect(submittedFormTab).toBeVisible();

        await submittedFormTab.click();
        await expect(this.page.getByText(media)).toBeVisible();

    }

    async verifyUploadedFileNames(fileNames: string[]) {

        for (const fileName of fileNames) {

            await expect(
                this.page.getByText(fileName, { exact: true })
            ).toBeVisible();
        }
    }

    async verifyQuestionAndAnswer(
        question: string,
        answer: string
    ) {

        const questionBlock = this.page.locator('.question', {
            hasText: question
        });

        await expect(questionBlock).toContainText(question);
        await expect(questionBlock).toContainText(answer);
    }

    async verifyQuestionAndMultipleAnswers(
        question: string,
        answers: string[]
    ) {

        const questionBlock = this.page.locator('.question', {
            hasText: question
        });

        for (const answer of answers) {
            await expect(questionBlock).toContainText(answer);
        }
    }
}

