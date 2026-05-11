import { expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import { validLogin } from "@/test-data/loginData";
import { urls } from "@/utils/urls";
import { createProject, deleteProject, publishProject } from "@/helpers/api/casting/projectApi";
import ProjectPage from "@/pages/casting/owner/project/projectPage";
import { getAccessTokenSmartFromCasting } from "@/helpers/api/casting/authApi";
import ProjectDetailsPage from "@/pages/casting/owner/projectDetails/projectDetailsPage";
import { projectDetailsLocators } from "@/pages/casting/owner/projectDetails/projectDetailsPageLocators";

test.describe('Casting owner edit project scenarios', () => {
    let token: string;
    let uniqueName: string;

    test.beforeAll(async ({ request }) => {
        token = await getAccessTokenSmartFromCasting(request, validLogin.email);
        uniqueName = `Automation Talent-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    });

    test.beforeEach(async ({ page }) => {
        await page.goto(`${urls.casting}/projects`, {
            waitUntil: 'domcontentloaded',
        });

        await expect(page).toHaveURL(/projects/);
    });


    // =========================================================
    test('should validate required fields when editing project details', async ({ page, request }) => {
        test.setTimeout(90000);

        const { response } = await createProject(request, token);
        const projectId = response.data.id;
        const projectName = response.data.title;
        const projectPage = new ProjectPage(page);

        const projectDetails = new ProjectDetailsPage(page);

        await projectPage.openSearchedProject(projectName);
        await projectDetails.gotToProjectDetails();

        await page.locator(projectDetailsLocators.editProject_name).click()
        await page.locator(projectDetailsLocators.editProjectName_editable).press('Control+A');
        await page.locator(projectDetailsLocators.editProjectName_editable).press('Delete');
        await expect(page.locator(projectDetailsLocators.emptyName_error)).toHaveText('Value is required');
        await deleteProject(request, token, projectId);
    });

    // =========================================================
    test('should edit project successfully when project is inactive', async ({ page, request }) => {
        test.setTimeout(90000);

        const { response } = await createProject(request, token);
        const projectId = response.data.id;
        const projectName = response.data.title;

        const projectPage = new ProjectPage(page);
        const projectDetails = new ProjectDetailsPage(page);

        await projectPage.openSearchedProject(projectName);
        await projectDetails.gotToProjectDetails();
        await projectDetails.editProjectDetails();
        await projectDetails.saveProjectData();
        await projectDetails.verifyProjectEdited('Edited Project Name');

        await deleteProject(request, token, projectId);

    });

    // =========================================================
    test('should edit project successfully when project is active', async ({ page, request }) => {
        test.setTimeout(90000);

        const { response } = await createProject(request, token);
        const projectId = response.data.id;
        const projectName = response.data.title;
        await publishProject(request, token, projectId);

        const projectPage = new ProjectPage(page);
        const projectDetails = new ProjectDetailsPage(page);

        await projectPage.openSearchedProject(projectName);
        await projectDetails.gotToProjectDetails();
        await projectDetails.editProjectDetails();
        await projectDetails.saveProjectData();
        await projectDetails.verifyProjectEdited('Edited Project Name');

        await deleteProject(request, token, projectId);

    });
});
