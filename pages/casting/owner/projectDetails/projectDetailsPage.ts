import { APIRequestContext, expect, Page } from "@playwright/test";
import { projectDetailsLocators } from "./projectDetailsPageLocators";
import { projectLocators } from "../project/projectPageLocators";
import { getTalentUploadedMedia } from "@/helpers/api/casting/talentApi";

export default class ProjectDetailsPage {
    constructor(public page: Page) { }

    async editProjectDetails() {

        //name 
        await this.page.locator(projectDetailsLocators.editProject_name).click();
        await this.page.locator(projectDetailsLocators.editProjectName_editable).press('Control+A');
        await this.page.locator(projectDetailsLocators.editProjectName_editable).press('Delete');
        await this.page.locator(projectDetailsLocators.editProjectName_editable).fill('Edited Project Name');

        //description 
        await this.page.locator(projectDetailsLocators.editProject_description).click();
        await this.page.locator(projectDetailsLocators.editProject_description).click();

        await this.page.locator(projectDetailsLocators.editProjectDescription_editable).press('Control+A');
        await this.page.locator(projectDetailsLocators.editProjectDescription_editable).press('Delete');
        await this.page.locator(projectDetailsLocators.editProjectDescription_editable).fill('Edited Project Description');
    }

    async gotToProjectDetails() {
        await this.page.locator(projectDetailsLocators.projectDetailsTab).click();
        await expect(this.page.getByText('About the project')).toBeVisible();
    }

    async saveProjectData() {
        await this.page.locator(projectDetailsLocators.editProject_saveBtn).click();
        await expect(this.page.getByText('Save')).toBeHidden();
    }

    async verifyProjectEdited(editedRoleName: string) {
        await expect(
            this.page.locator(projectDetailsLocators.editProject_name)
        ).toHaveText(editedRoleName);
    }


    async verifyUploadedMediaFromApi(
        request: APIRequestContext,
        token: string,
        projectId: number,
        talentUuid: string,
        fileName: string
    ) {

        await expect.poll(async () => {

            const response = await getTalentUploadedMedia(
                request,
                token,
                projectId,
                talentUuid
            );

            const mediaList = response.data || [];

            return mediaList.some((m: any) =>
                m.original_name?.includes(fileName) ||
                m.name?.includes(fileName)
            );

        }, {
            timeout: 20000,
            intervals: [1000]
        }).toBeTruthy();
    }
}