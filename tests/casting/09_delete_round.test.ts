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


    // =========================================================
    test('Delete rounds and verify it disappears in rounds list when project and rounds are not active', async ({ page, request }) => {
        test.setTimeout(90000);

        // Create project
        const { response } = await createProject(request, token);
        projectId = response.data.id;
        projectName = response.data.title;

        // Create role
        await createRole(request, token, projectId);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[0];
        expect(role).toBeDefined();

        roleId = role.id;
        roleName = role.role_name;

        // Create round
        await createOnlineRound(request, token, projectId, roleId);

        const rounds = await getProjectRounds(request, token, projectId);
        const round = rounds.data[rounds.data.length - 1];
        expect(round).toBeDefined();

        roundId = round.id;
        roundName = round.round_name;

        const roundPage = new RoundPage(page);
        const projectPage = new ProjectPage(page);

        await projectPage.openSearchedProject(projectName);
        await roundPage.gotoRoundsTab();


        await expect(async () => {
            const roundRow = page.locator('[data-col-key="round_name"]', {
                hasText: roundName
            });

            if (!(await roundRow.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
            }

            await expect(roundRow).toBeVisible();
        }).toPass({ timeout: 15000 });

        // Delete round
        await roundPage.searchRound(roundName);
        await roundPage.clickDeleteRound();
        await roundPage.clickDeleteConfirmationButton();

        await expect(page.locator(roundLocators.deleteConfirmationBtn)).toBeHidden();
        await expect(page.locator(roundLocators.emptyRoundMessage))
            .toContainText('No rounds to display');

        // Create another round
        await createInPersonRound(request, token, projectId, roleId);

        const newRounds = await getProjectRounds(request, token, projectId);
        const newRound = newRounds.data[newRounds.data.length - 1]; // ✅ latest
        expect(newRound).toBeDefined();

        roundId = newRound.id;
        roundName = newRound.round_name;

        await expect(async () => {
            const roundRow = page.locator('[data-col-key="round_name"]', {
                hasText: roundName
            });

            if (!(await roundRow.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
            }

            await expect(roundRow).toBeVisible();
        }).toPass({ timeout: 15000 });

        // Delete again
        await roundPage.searchRound(roundName);
        await roundPage.clickDeleteRound();
        await roundPage.clickDeleteConfirmationButton();

        await expect(page.locator(roundLocators.deleteConfirmationBtn)).toBeHidden();
        await expect(page.locator(roundLocators.emptyRoundMessage))
            .toContainText('No rounds to display');

        // Cleanup
        if (projectId) {
            await deleteProject(request, token, projectId);
        }
    });

    // =========================================================
    test('Delete rounds and verify it disappears in rounds list when project active and rounds is not active', async ({ page, request }) => {
        test.setTimeout(90000);

        // Create project
        const { response } = await createProject(request, token);
        projectId = response.data.id;
        projectName = response.data.title;

        await publishProject(request, token, projectId);

        // Create role
        await createRole(request, token, projectId);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[0];
        expect(role).toBeDefined();

        roleId = role.id;
        roleName = role.role_name;

        // Create round
        await createOnlineRound(request, token, projectId, roleId);

        const rounds = await getProjectRounds(request, token, projectId);
        const round = rounds.data[rounds.data.length - 1];
        expect(round).toBeDefined();

        roundId = round.id;
        roundName = round.round_name;

        const roundPage = new RoundPage(page);
        const projectPage = new ProjectPage(page);

        await projectPage.openSearchedProject(projectName);
        await roundPage.gotoRoundsTab();

        await expect(async () => {
            await roundPage.searchRound(roundName);

            const row = page.locator('[data-col-key="round_name"]', {
                hasText: roundName
            });

            if (!(await row.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
                await roundPage.searchRound(roundName);
            }

            await expect(row).toBeVisible();
        }).toPass({ timeout: 15000 });

        // Delete round
        await roundPage.clickDeleteRound();
        await roundPage.clickDeleteConfirmationButton();

        await expect(page.locator(roundLocators.deleteConfirmationBtn)).toBeHidden();
        await expect(page.locator(roundLocators.emptyRoundMessage))
            .toContainText('No rounds to display');

        // Create another round
        await createInPersonRound(request, token, projectId, roleId);

        const newRounds = await getProjectRounds(request, token, projectId);
        const newRound = newRounds.data[newRounds.data.length - 1];
        expect(newRound).toBeDefined();

        roundId = newRound.id;
        roundName = newRound.round_name;

        await expect(async () => {
            await roundPage.searchRound(roundName);

            const row = page.locator('[data-col-key="round_name"]', {
                hasText: roundName
            });

            if (!(await row.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
                await roundPage.searchRound(roundName);
            }

            await expect(row).toBeVisible();
        }).toPass({ timeout: 15000 });

        // Delete again
        await roundPage.clickDeleteRound();
        await roundPage.clickDeleteConfirmationButton();

        await expect(page.locator(roundLocators.deleteConfirmationBtn)).toBeHidden();
        await expect(page.locator(roundLocators.emptyRoundMessage))
            .toContainText('No rounds to display');

        // Cleanup
        if (projectId) {
            await deleteProject(request, token, projectId);
        }
    });

    // =========================================================
    test('Delete rounds and verify it disappears in rounds list when project and rounds is active', async ({ page, request }) => {
        test.setTimeout(90000);

        // Create project
        const { response } = await createProject(request, token);
        projectId = response.data.id;
        projectName = response.data.title;

        await publishProject(request, token, projectId);

        // Create role
        await createRole(request, token, projectId);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[0];
        expect(role).toBeDefined();

        roleId = role.id;
        roleName = role.role_name;

        // Create round
        await createOnlineRound(request, token, projectId, roleId);

        const rounds = await getProjectRounds(request, token, projectId);
        const round = rounds.data[rounds.data.length - 1];
        expect(round).toBeDefined();

        roundId = round.id;
        roundName = round.round_name;

        // Activate round
        await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);

        const roundPage = new RoundPage(page);
        const projectPage = new ProjectPage(page);

        await projectPage.openSearchedProject(projectName);
        await roundPage.gotoRoundsTab();

        await expect(async () => {
            await roundPage.searchRound(roundName);

            const row = page.locator('[data-col-key="round_name"]', {
                hasText: roundName
            });

            if (!(await row.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
                await roundPage.searchRound(roundName);
            }

            await expect(row).toBeVisible();
        }).toPass({ timeout: 15000 });

        // Delete round
        await roundPage.clickDeleteRound();
        await roundPage.clickDeleteConfirmationButton();

        await expect(page.locator(roundLocators.deleteConfirmationBtn)).toBeHidden();
        await expect(page.locator(roundLocators.emptyRoundMessage))
            .toContainText('No rounds to display');

        // Create another round
        await createInPersonRound(request, token, projectId, roleId);

        const newRounds = await getProjectRounds(request, token, projectId);
        const newRound = newRounds.data[newRounds.data.length - 1];
        expect(newRound).toBeDefined();

        roundId = newRound.id;
        roundName = newRound.round_name;

        await expect(async () => {
            await roundPage.searchRound(roundName);

            const row = page.locator('[data-col-key="round_name"]', {
                hasText: roundName
            });

            if (!(await row.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
                await roundPage.searchRound(roundName);
            }

            await expect(row).toBeVisible();
        }).toPass({ timeout: 15000 });

        // Delete again
        await roundPage.clickDeleteRound();
        await roundPage.clickDeleteConfirmationButton();

        await expect(page.locator(roundLocators.deleteConfirmationBtn)).toBeHidden();
        await expect(page.locator(roundLocators.emptyRoundMessage))
            .toContainText('No rounds to display');

        // Cleanup
        if (projectId) {
            await deleteProject(request, token, projectId);
        }
    });

    // =========================================================
    test('should delete rounds from the list when question is created', async ({ page, request }) => {
        test.setTimeout(90000);

        // Create project
        const { response } = await createProject(request, token);
        projectId = response.data.id;
        projectName = response.data.title;

        await publishProject(request, token, projectId);

        // Create role
        await createRole(request, token, projectId);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[0];
        expect(role).toBeDefined();

        roleId = role.id;
        roleName = role.role_name;

        // Create round
        await createOnlineRound(request, token, projectId, roleId);

        const rounds = await getProjectRounds(request, token, projectId);
        const round = rounds.data[rounds.data.length - 1];
        expect(round).toBeDefined();

        roundId = round.id;
        roundName = round.round_name;

        await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);

        // Create talent
        const talentEmail = generateEmail();
        const talentToken = await getTalentAccessToken(request, talentEmail);
        const talentName = "AutoTalent_" + Date.now();

        const result = await registerTalent(request, talentToken, talentName);
        expect(result).toBeTruthy();

        // Create question
        await createTextQuestion(
            request, token, projectId, roundId, roleId,
            "Tell us about yourself"
        );

        const roundPage = new RoundPage(page);
        const projectPage = new ProjectPage(page);

        await projectPage.openSearchedProject(projectName);
        await roundPage.gotoRoundsTab();

        await expect(async () => {
            await roundPage.searchRound(roundName);

            const row = page.locator('[data-col-key="round_name"]', {
                hasText: roundName
            });

            if (!(await row.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
                await roundPage.searchRound(roundName);
            }

            await expect(row).toBeVisible();
        }).toPass({ timeout: 15000 });

        // Delete round
        await roundPage.clickDeleteRound();
        await roundPage.clickDeleteConfirmationButton();

        await expect(page.locator(roundLocators.deleteConfirmationBtn)).not.toBeVisible();
        await expect(page.locator(roundLocators.emptyRoundMessage))
            .toContainText('No rounds to display');

        const deletedRow = page.locator('[data-col-key="round_name"]', {
            hasText: roundName
        });
        await expect(deletedRow).toHaveCount(0);

        // Cleanup
        if (projectId) {
            await deleteProject(request, token, projectId);
        }
    });

    // =========================================================
    test('should delete rounds from the list when talent has been applied', async ({ page, request }) => {
        test.setTimeout(90000);

        // Create project
        const { response } = await createProject(request, token);
        projectId = response.data.id;
        projectName = response.data.title;

        await publishProject(request, token, projectId);

        // Create role
        await createRole(request, token, projectId);

        const roles = await getProjectRoles(request, token, projectId);
        const role = roles.data[0];
        expect(role).toBeDefined();

        roleId = role.id;
        roleName = role.role_name;

        // Create round
        await createOnlineRound(request, token, projectId, roleId);

        const rounds = await getProjectRounds(request, token, projectId);
        const round = rounds.data[rounds.data.length - 1]; 
        expect(round).toBeDefined();

        roundId = round.id;
        roundName = round.round_name;

        await updateRoundSubmissionStatus(request, token, projectId, roundId, 1);

        // Create talent
        const talentEmail = generateEmail();
        const talentToken = await getTalentAccessToken(request, talentEmail);
        const talentName = "AutoTalent_" + Date.now();

        const result = await registerTalent(request, talentToken, talentName);
        expect(result).toBeTruthy();

        // Create question
        const question = await createTextQuestion(
            request, token, projectId, roundId, roleId,
            "Tell us about yourself"
        );

        // Apply for round
        await applyForRound(
            request,
            talentToken,
            validLogin.tenant_id,
            projectId,
            roundId,
            roleId,
            question.data.question_id
        );

        const roundPage = new RoundPage(page);
        const projectPage = new ProjectPage(page);

        await projectPage.openSearchedProject(projectName);
        await roundPage.gotoRoundsTab();

        await expect(async () => {
            await roundPage.searchRound(roundName);

            const row = page.locator('[data-col-key="round_name"]', {
                hasText: roundName
            });

            if (!(await row.first().isVisible().catch(() => false))) {
                await page.reload();
                await page.waitForLoadState('networkidle');
                await roundPage.searchRound(roundName);
            }

            await expect(row).toBeVisible();
        }).toPass({ timeout: 15000 });

        // Delete round
        await roundPage.clickDeleteRound();
        await roundPage.clickDeleteConfirmationButton();

        await expect(page.locator(roundLocators.deleteConfirmationBtn)).not.toBeVisible();
        await expect(page.locator(roundLocators.emptyRoundMessage))
            .toContainText('No rounds to display');

        const deletedRow = page.locator('[data-col-key="round_name"]', {
            hasText: roundName
        });
        await expect(deletedRow).toHaveCount(0);

        // Cleanup
        if (projectId) {
            await deleteProject(request, token, projectId);
        }
    });

});



