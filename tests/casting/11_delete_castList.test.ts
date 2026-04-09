import { APIRequestContext, expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import RoundPage from "../../pages/casting/owner/round/roundPage";
import { roundLocators } from "../../pages/casting/owner/round/roundPageLocators";
import { validLogin } from "@/test-data/loginData";
import { urls } from "@/utils/urls";
import { createProject, deleteProject, publishProject } from "@/helpers/api/casting/projectApi";
import { createRole, deleteAllRoles, deleteRole, getProjectRoles } from "@/helpers/api/casting/roleApi";
import { createInPersonRound, createOnlineRound, deleteAllRounds, getProjectRounds, updateRoundSubmissionStatus } from "@/helpers/api/casting/roundApi";
import ProjectPage from "@/pages/casting/owner/project/projectPage";
import { onlineRoundData, inPersonRoundData } from "@/test-data/roundData";
import { getTalentAccessToken } from "@/helpers/api/talent/authApi";
import { generateEmail } from "@/test-data/random-data";
import { applyForRound, registerTalent } from "@/helpers/api/talent/talentApi";
import { getAccessTokenSmartFromCasting } from "@/helpers/api/casting/authApi";
import { applyRegistrationConfig, deleteTalent, getFieldsByPageId, getTalentUuidByName } from "@/helpers/api/casting/talentApi";
import { apiConfig } from "@/test-data/dataModelConfig";
import { createTextQuestion } from "@/helpers/api/casting/questionApi";
import { createWorkingCastList } from "@/helpers/api/casting/castListApi";
import CastListPage from "@/pages/casting/owner/workingCastList/workingCastListPage";

test.describe('Casting owner delete round scenarios', () => {
    let token: string;
    let projectId: number;
    let roundId: number;
    let roleId: number;
    let roleName: string;
    let roundName: string;
    let projectName: string;
    let uniqueName: string;

    test.beforeAll(async ({ request }) => {
        token = await getAccessTokenSmartFromCasting(request, validLogin.email);

        uniqueName = `Automation Talent-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    });

    test.beforeEach(async ({ page, request }) => {
        await page.goto(urls.casting);
        const login = new LoginPage(page);
        const status = await login.validLoginwithUI(validLogin.email, validLogin.password, request);
        console.log("2FA Status:", status);
        await page.goto(urls.casting + "/projects"); await expect(page).toHaveURL(/projects/);
    });

    test.afterAll(async ({ request }) => {

    });

    // =========================================================
    test('Delete cast and verify it disappears in list when project is not active', async ({ page, request }) => {
        test.setTimeout(90000);

        // Create project
        const { response } = await createProject(request, token);
        const projectId = response.data.id;
        const projectName = response.data.title;

        // Create role
        await createRole(request, token, projectId);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[roles.data.length - 1];
        expect(role).toBeDefined();

        const roleId = role.id;

        // Create cast list
        await createWorkingCastList(request, token, projectId, roleId, "Automated Cast");

        const projectPage = new ProjectPage(page);
        const castListPage = new CastListPage(page);

        await projectPage.openSearchedProject(projectName);
        await castListPage.gotoCastListTab();

        await expect(async () => {
            const row = page.locator('[data-col-key="name"]', {
                hasText: "Automated Cast"
            });

            if (!(await row.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
            }

            await expect(row).toBeVisible();
        }).toPass({ timeout: 15000 });

        // Delete cast list
        await castListPage.clickDeleteButton();
        await castListPage.clickDeleteConfirmationButton();

        // Verify deletion success
        const deletedRow = page.locator('[data-col-key="name"]', {
            hasText: "Automated Cast"
        });

        await expect(deletedRow).toHaveCount(0);

        // Cleanup
        await deleteProject(request, token, projectId);
    });

});