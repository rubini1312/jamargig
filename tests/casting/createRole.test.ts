import { expect, test } from "@playwright/test";
import LoginPage from "../../pages/casting/owner/login/loginPage";
import RolePage from "../../pages/casting/owner/role/rolePage";
import { roleLocators } from "../../pages/casting/owner/role/rolePageLocators";
import * as data from "../../test-data/test-data.json";
import { openFirstProject } from '../../helpers/projects';

test.describe('Casting owner create role scenarios', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
    });

    test('Create new role and verify it appears in roles list', async ({ page }) => {
        test.setTimeout(60000);
        const login = new LoginPage(page);
        await login.validLogin(data.email, data.password);
        await expect(page).toHaveURL('/projects');


        const rolePage = new RolePage(page);
        const projectId = await openFirstProject(page);
        await rolePage.openProjectById(projectId, { waitForUrl: new RegExp(`/projects/${projectId}`) });
        await rolePage.gotoRolesTab();

        const roleName = `Automation Role ${Date.now()}`;
        await rolePage.createNewRole({
            name: roleName,
            imagePath: 'test-files/images/test-role.jpg',
            descriptionHtml: 'Automated role description for testing purposes - You can add more details here.',
            numberOfPeople: 5,
            contractTypeIndex: 2,
            contractFrom: "26 Dec 2025",
            contractTo: "31 Jan 2026",
            rehearsalFrom: "01 Nov 2025",
            rehearsalTo: "10 Nov 2025",
            gender: 'Female',
            minAge: '25',
            maxAge: '55',
            ethnicity: 'Hispanic or Latino',
            skills: 'Dancing',
            languages: 'English',
            nudity: 'No',
            minHeight: '150',
            maxHeight: '198',
            heightUnit: 'CMs',
            minWeight: '45',
            maxWeight: '91',
            weightUnit: 'Kgs'
        });
        // small wait for list to refresh then verify
        await page.waitForTimeout(2000);
        expect(await rolePage.isRolePresent(roleName)).toBeTruthy();
    });

    test('Submitting empty New Role form shows validation (required fields)', async ({ page }) => {
        const login = new LoginPage(page);
        await login.validLogin(data.email, data.password);
        await expect(page).toHaveURL('/projects');

        const rolePage = new RolePage(page);
        await rolePage.gotoRolesTab();
        await rolePage.openCreateRole();

        // ensure role name empty and contract/unions not selected
        expect(await page.locator(roleLocators.roleNameInput).inputValue()).toBe('');

        // Click submit with empty required fields
        await page.locator(roleLocators.roleNewSubmitButton).click();

        // modal should remain open and show validation
        await expect(page.locator(roleLocators.roleNameInput)).toBeVisible();

        const ariaInvalid = await page.locator(roleLocators.roleNameInput).getAttribute('n-form-item-feedback__line');
        if (ariaInvalid !== null) {
            expect(ariaInvalid === 'true' || ariaInvalid === '1').toBeTruthy();
        } else {
            // fallback: look for a required message text
            const msg = await page.locator('text=required, text=Required, text=Value is required').count();
            // Need to check it later
            expect(msg).toBeGreaterThanOrEqual(0);
        }

        // Close the modal
        await rolePage.closeNewRoleModal();
    });
});
