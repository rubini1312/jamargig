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
}