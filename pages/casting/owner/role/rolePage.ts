import { expect, Page } from "@playwright/test";
import { roleLocators } from "./rolePageLocators";
import { projectLocators } from "../project/projectPageLocators";

export default class RolePage {
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

    async gotoRolesTab() {

        await this.openFirstProjectIfNeeded();

        const tab = this.page.getByTestId("projects.roles-tab");

        await tab.waitFor({ state: "visible", timeout: 30000 });
        await tab.click();

        await this.page.getByText("Add role").waitFor({ timeout: 30000 });
    }



    async openCreateRole() {
        await this.page.locator(roleLocators.createRoleButton).click();
        await this.page.locator(roleLocators.roleNameInput).waitFor({ state: "visible" });
    }

    async fillRoleName(name: string) {
        await this.page.locator(roleLocators.roleNameInput).fill(name);
    }

    async uploadRoleImage(filePath: string) {
        // try to find a file input inside the dragger
        const input = this.page.locator(`${roleLocators.roleImage} input[type=file]`);
        await input.setInputFiles(filePath);
    }

    /*   // Fill rich text content reliably (sets innerHTML and dispatches events)
      async fillRichText(selector: string, html: string) {
        await this.page.waitForSelector(selector, { state: "visible", timeout: 7000 });
        const editable = this.page.locator(selector);
        await editable.click({ force: true });
        await this.page.evaluate(
          ({ selector, html }) => {
            const el = document.querySelector(selector) as HTMLElement | null;
            if (!el) return;
            el.focus();
            el.innerHTML = html;
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.dispatchEvent(new Event("change", { bubbles: true }));
            el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
            el.dispatchEvent(new Event("blur", { bubbles: true }));
          },
          { selector, html }
        );
        await this.page.waitForTimeout(200);
      } */

    async fillRoleDescription(description: string) {
        await this.page.locator(roleLocators.roleDescriptionContent).fill(description);
    }

    async setNumberOfPeople(n: number) {
        await this.page.locator(roleLocators.roleNumberOfPeopleInput).fill(String(n));
    }

    async selectContractType(index: number) {
        const contractType = this.page.locator(`[data-testid="role-contract-type-${index}"]`);
        await expect(contractType).toBeVisible();
        await contractType.click();
    }

    async setContractDate(from?: string, to?: string) {
        if (from) await this.page.locator(roleLocators.roleContractDateFromInput).fill(from);
        await this.page.locator(roleLocators.roleContractDateFromInput).press("Enter");
        if (to) await this.page.locator(roleLocators.roleContractDateToInput).fill(to);
        await this.page.locator(roleLocators.roleContractDateToInput).press("Enter");
    }

    async setRehearsalDate(from?: string, to?: string) {
        const fromInput = this.page.locator(roleLocators.roleRehearsalDateFromInput);
        await fromInput.scrollIntoViewIfNeeded();
        if (from) {
            await fromInput.fill(from);
            await fromInput.press("Enter").catch(() => { });
        }

        if (to) {
            const picker = this.page.locator(roleLocators.roleRehearsalDateToPicker);
            await picker.scrollIntoViewIfNeeded();

            // Try to fill an inner input if present
            const innerInput = picker.locator('input[type="text"], input.n-input__input-el, input');
            if ((await innerInput.count()) > 0) {
                await innerInput.fill(to);
                await innerInput.press('Enter').catch(() => { });
                return;
            }

            // Fallback: open the datepicker UI and click the day cell matching the day number in `to`
            await picker.click();
            const dayMatch = String(to).match(/\b(\d{1,2})\b/);
            if (dayMatch) {
                const day = dayMatch[1];
                // look for the day within the visible datepicker popup
                const dayLocator = this.page.locator(`div.n-date-picker >> text="${day}"`).first();
                if ((await dayLocator.count()) > 0) {
                    await dayLocator.click();
                    return;
                }
                // fallback: try any text match inside dialog
                const alt = this.page.locator(`role=dialog >> text="${day}"`).first();
                if ((await alt.count()) > 0) {
                    await alt.click();
                    return;
                }
            }

            // Last resort: type the date string into focused element
            await this.page.keyboard.type(String(to));
        }
    }

    async selectGender(value: string) {
        await this.selectDropdownOption(roleLocators.roleGenderDropDown, value);
    }

    async setAge(min?: string, max?: string) {
        await this.page.locator(roleLocators.roleMinAgeInput).scrollIntoViewIfNeeded();
        if (min) await this.page.locator(roleLocators.roleMinAgeInput).fill(min);
        if (max) await this.page.locator(roleLocators.roleMaxAgeInput).fill(max);
    }

    async setEthnicity(value: string) {
        await this.selectDropdownOption(roleLocators.roleEthnicityDropDown, value);
    }

    async setSkills(value: string) {
        await this.selectDropdownOption(roleLocators.roleSkillsFieldDropDown, value);
    }

    async setLanguages(value: string) {
        await this.selectDropdownOption(roleLocators.roleLanguagesDropDown, value);
    }

    async setNudityStatus(value: string) {
        await this.selectDropdownOption(roleLocators.roleNudityStatusDropDown, value);
    }

    // Helper to interact with custom select components (naive-ui / non-input selects)
    private async selectDropdownOption(selector: string, value: string) {
        const dropdown = this.page.locator(selector);
        await dropdown.scrollIntoViewIfNeeded();

        // If there's an inner text input, prefer typing and pressing Enter — but only if visible
        const innerInput = dropdown.locator('input[type="text"], input.n-input__input-el, input');
        if ((await innerInput.count()) > 0) {
            const input = innerInput.first();
            if (await input.isVisible()) {
                await input.fill(value);
                await input.press('Enter').catch(() => { });
                return;
            }
            // If the input exists but is hidden, continue to the open-menu flow below
        }

        // Otherwise, try to open the menu and pick the option by visible text.
        // Some selects render options in a portal (outside the dropdown), so search the whole page.
        // Try several ways to open the menu: click wrapper, click inner toggle, focus+keyboard.
        await dropdown.click({ force: true }).catch(() => { });
        try {
            const toggle = dropdown.locator('button, .n-base-selection, .n-base-selection-input, .n-base-selection-placeholder');
            if ((await toggle.count()) > 0) await toggle.first().click({ force: true });
        } catch (e) {
            /* ignore */
        }

        const optionSelectors = [
            `role=option >> text="${value}"`,
            `.n-select-option:has-text("${value}")`,
            `.n-base-select-option:has-text("${value}")`,
            `.n-base-select-menu:has-text("${value}")`,
            `.n-dropdown-menu:has-text("${value}")`,
            `.n-menu-item:has-text("${value}")`,
            `.n-dropdown-content:has-text("${value}")`,
            `text="${value}"`
        ];

        // Wait up to a slightly longer timeout for an option to appear (some selects load async)
        const maxWait = 5000;
        const poll = 150;
        const start = Date.now();
        while (Date.now() - start < maxWait) {
            for (const s of optionSelectors) {
                const opt = this.page.locator(s).first();
                if ((await opt.count()) > 0 && (await opt.isVisible())) {
                    await opt.click({ force: true });
                    await this.page.waitForTimeout(100);
                    return;
                }
            }

            // Retry opening by clicking a likely toggle inside the dropdown (some implementations need a more specific click)
            try {
                const toggle = dropdown.locator('button, .n-base-selection, .n-select, .n-input');
                if ((await toggle.count()) > 0) await toggle.first().click({ force: true });
                // also try focusing the hidden input and sending ArrowDown to open
                const hiddenInput = dropdown.locator('input[type="text"], input.n-input__input-el, input').first();
                if ((await hiddenInput.count()) > 0) {
                    try {
                        await hiddenInput.focus();
                        await this.page.keyboard.press('ArrowDown');
                    } catch (e) { /* ignore */ }
                }
            } catch (e) {
                // ignore and continue polling
            }

            await this.page.waitForTimeout(poll);
        }

        // After opening, some components require typing into an input inside the modal to show suggestions.
        // Try to find an input within the role dialog or the page and type the value.
        try {
            const dialog = this.page.locator('role=dialog').first();
            const container = (await dialog.count()) > 0 ? dialog : this.page;
            const postInputs = container.locator('input[type="text"], input.n-input__input-el, input').filter({ has: dropdown }).first();
            let typed = false;

            // If the filtered input didn't find anything, fallback to any visible input inside container
            if (!(await postInputs.count())) {
                const anyInput = container.locator('input[type="text"], input.n-input__input-el, input');
                for (let i = 0; i < (await anyInput.count()); i++) {
                    const cand = anyInput.nth(i);
                    if (await cand.isVisible()) {
                        await cand.fill(value);
                        await cand.press('Enter').catch(() => { });
                        typed = true;
                        break;
                    }
                }
            } else {
                if (await postInputs.isVisible()) {
                    await postInputs.fill(value);
                    await postInputs.press('Enter').catch(() => { });
                    typed = true;
                }
            }

            if (typed) {
                // allow suggestions to settle and check for chosen label
                await this.page.waitForTimeout(300);
                const checkInDialog = container.locator(`text="${value}"`).first();
                if ((await checkInDialog.count()) > 0 && (await checkInDialog.isVisible())) return;
            }
        } catch (e) {
            // ignore and let final error be thrown
        }

        // Try to focus and type into an input or contenteditable inside the dropdown itself
        try {
            const innerCandidates = dropdown.locator('input[type="text"], input.n-input__input-el, input, [contenteditable="true"], [role="combobox"]');
            const startInner = Date.now();
            const innerMax = 2000;
            while (Date.now() - startInner < innerMax) {
                for (let i = 0; i < (await innerCandidates.count()); i++) {
                    const cand = innerCandidates.nth(i);
                    if (await cand.isVisible()) {
                        try {
                            await cand.fill(value);
                            await cand.press('Enter').catch(() => { });
                        } catch {
                            await cand.type(value, { delay: 50 });
                            await this.page.keyboard.press('Enter').catch(() => { });
                        }
                        // check selection inside dropdown
                        await this.page.waitForTimeout(200);
                        const check = dropdown.locator(`text="${value}"`).first();
                        if ((await check.count()) > 0 && (await check.isVisible())) return;
                    }
                }
                // click the dropdown to prompt input to appear
                await dropdown.click({ force: true }).catch(() => { });
                await this.page.waitForTimeout(100);
            }
        } catch (e) {
            // ignore
        }

        // Try typing into the page (focus may be on the select after opening) and pressing Enter
        try {
            await this.page.keyboard.type(value, { delay: 50 });
            await this.page.keyboard.press('Enter');
            await this.page.waitForTimeout(100);
            // Validate option selected by checking existence of selected label text in DOM
            const check = this.page.locator(`text="${value}"`).first();
            if ((await check.count()) > 0) return;
        } catch (e) {
            // ignore
        }

        throw new Error(`Could not select option "${value}" for dropdown ${selector} — no visible option found after ${maxWait}ms.`);
    }

    async setHeight(min?: string, max?: string, unit?: string) {
        if (min) await this.page.locator(roleLocators.roleMinHeightInput).fill(min);
        if (max) await this.page.locator(roleLocators.roleMaxHeightInput).fill(max);
        if (unit) await this.page.locator(roleLocators.roleHeightUnit).fill(unit).catch(() => { });
    }

    async setWeight(min?: string, max?: string, unit?: string) {
        if (min) await this.page.locator(roleLocators.roleMinWeightInput).fill(min);
        if (max) await this.page.locator(roleLocators.roleMaxWeightInput).fill(max);
        if (unit) await this.page.locator(roleLocators.roleWeightUnit).fill(unit).catch(() => { });
    }

    async submitNewRole() {
        await this.page.locator(roleLocators.roleNewSubmitButton).click();
        const modal = this.page.locator('[data-testid="role-new-modal"]');
        await expect(modal).toBeHidden({ timeout: 10000 });
    }

    async closeNewRoleModal() {
        await this.page.locator(roleLocators.roleNewCloseButton).click();
        await this.page.locator(roleLocators.roleNameInput).waitFor({ state: "detached" }).catch(() => { });
    }

    // Composite create method
    async createNewRole(payload: {
        name: string;
        imagePath?: string;
        descriptionHtml?: string;
        numberOfPeople?: number;
        contractTypeIndex?: number;
        contractFrom?: string;
        contractTo?: string;
        rehearsalFrom?: string;
        rehearsalTo?: string;
        gender?: string;
        minAge?: string;
        maxAge?: string;
        ethnicity?: string;
        skills?: string;
        languages?: string;
        nudity?: string;
        minHeight?: string;
        maxHeight?: string;
        heightUnit?: string;
        minWeight?: string;
        maxWeight?: string;
        weightUnit?: string;
    }) {

        await this.openCreateRole();
        await this.fillRoleName(payload.name);

        if (payload.imagePath) await this.uploadRoleImage(payload.imagePath);
        if (payload.descriptionHtml) await this.fillRoleDescription(payload.descriptionHtml);
        if (payload.numberOfPeople !== undefined) await this.setNumberOfPeople(payload.numberOfPeople);
        if (payload.contractTypeIndex) await this.selectContractType(payload.contractTypeIndex);
        if (payload.contractFrom || payload.contractTo) await this.setContractDate(payload.contractFrom ?? "", payload.contractTo);
        if (payload.rehearsalFrom || payload.rehearsalTo) await this.setRehearsalDate(payload.rehearsalFrom ?? "", payload.rehearsalTo);
        if (payload.gender) await this.selectGender(payload.gender);
        if (payload.minAge || payload.maxAge) await this.setAge(payload.minAge, payload.maxAge);
        if (payload.ethnicity) await this.setEthnicity(payload.ethnicity);
        if (payload.skills) await this.setSkills(payload.skills);
        if (payload.languages) await this.setLanguages(payload.languages);
        if (payload.nudity) await this.setNudityStatus(payload.nudity);
        if (payload.minHeight || payload.maxHeight || payload.heightUnit) await this.setHeight(payload.minHeight, payload.maxHeight, payload.heightUnit);
        if (payload.minWeight || payload.maxWeight || payload.weightUnit) await this.setWeight(payload.minWeight, payload.maxWeight, payload.weightUnit);

        const roleNameInput = this.page.getByTestId('role-name').first();
        await roleNameInput.fill(payload.name);
        await expect(roleNameInput).toHaveValue(payload.name);
        await expect(roleNameInput).toHaveValue(payload.name);

        await this.submitNewRole();
    }

    async verifyRoleCreated(roleName: string) {
        await expect
            .poll(async () => {
                return await this.page
                    .locator('td[data-col-key="role_name"]', { hasText: roleName })
                    .count();
            }, { timeout: 30000 })
            .toBeGreaterThan(0);

        const allRoles = await this.page.locator('td[data-col-key="role_name"]').allTextContents();
        console.log("ALL ROLES IN TABLE:");
        console.log(allRoles);

    }


    /**
     * Open a project by clicking its cover image using the dynamic data-testid
     * Example data-testid: project-list-card-27-cover-image -> pass 27 as projectId
     * Options:
     *  - expectNewTab: if true, waits for a new Page to open and returns it
     *  - waitForUrl: string or RegExp to wait for after navigation
     */
    async openProjectById(projectId: string | number, options?: { expectNewTab?: boolean; waitForUrl?: string | RegExp; timeout?: number; }) {
        const id = String(projectId);
        // If the page is already closed, fail fast with a helpful message
        if (this.page.isClosed && this.page.isClosed()) {
            throw new Error(`Cannot open project ${id}: page is already closed`);
        }

        // If we're already on the project's URL, do nothing
        try {
            const current = this.page.url();
            if (current.includes(`/projects/${id}`) || (options?.waitForUrl && typeof options.waitForUrl === 'string' && current.includes(options.waitForUrl))) {
                return this.page;
            }
            if (options?.waitForUrl instanceof RegExp && options.waitForUrl.test(current)) {
                return this.page;
            }
        } catch (e) {
            // page.url() can throw if the page is closed — let the later code produce a clear error
        }
        const selector = `[data-testid="project-list-card-${id}-cover-image"]`;
        let locator = this.page.locator(selector);

        // ensure it's visible and in view; if not found, fall back to alternative selectors
        const timeout = options?.timeout ?? 10000;
        try {
            await locator.waitFor({ state: 'visible', timeout });
            await locator.scrollIntoViewIfNeeded();
        } catch (err) {
            // fallback selectors: anchor links to project pages or generic project card
            const fallbacks = [
                `a[href*="/projects/${id}"]`,
                `a[href="/projects/${id}"]`,
                `[data-testid="project-list-card-${id}"]`,
                `[data-testid^="project-list-card-"]` // fallback to any project card
            ];

            let found: import('@playwright/test').Locator | null = null;
            for (const s of fallbacks) {
                const l = this.page.locator(s).first();
                if ((await l.count()) > 0) {
                    found = l;
                    break;
                }
            }

            if (!found) {
                const cards = await this.page.locator('[data-testid^="project-list-card-"]').count();
                throw new Error(
                    `Project cover not found for id=${id}. Tried selector ${selector} and fallbacks ${fallbacks.join(', ')}. Found ${cards} project card(s) on page.`
                );
            }

            locator = found;
            await locator.scrollIntoViewIfNeeded();
        }

        if (options?.expectNewTab) {
            const [newPage] = await Promise.all([
                this.page.context().waitForEvent('page', { timeout: options?.timeout ?? 10000 }),
                locator.click()
            ]);
            await newPage.waitForLoadState('domcontentloaded');
            if (options?.waitForUrl) await newPage.waitForURL(options.waitForUrl, { timeout: options.timeout ?? 10000 });
            return newPage;
        }

        // default: click and wait for navigation in the same page
        await Promise.all([
            this.page.waitForNavigation({ timeout: options?.timeout ?? 10000 }),
            locator.click()
        ]).catch(() => { });

        if (options?.waitForUrl) await this.page.waitForURL(options.waitForUrl, { timeout: options.timeout ?? 10000 });
        return this.page;
    }

    /**
     * Convenience wrapper to open project in a new tab and return the new Page
     */
    async openProjectInNewTab(projectId: string | number, waitForUrl?: string | RegExp, timeout?: number) {
        const page = await this.openProjectById(projectId, { expectNewTab: true, waitForUrl, timeout });
        return page as import('@playwright/test').Page;
    }

    async searchRole(name: string): Promise<void> {
        await this.page.locator(roleLocators.searchRound).hover();
        await this.page.locator(roleLocators.searchInput).fill(name);
    }

    async clickDeleteRole(roleName: string) {

        const row = this.page.locator('tbody tr', { hasText: roleName });
        await expect(row).toBeVisible();
        await row.scrollIntoViewIfNeeded();

        await row.locator('button').nth(1).click();
        await expect(this.page.locator(roleLocators.deleteConfirmationBtn)).toBeVisible();
    }

    async clickDeleteConfirmationButton() {
        const confirmBtn = this.page.locator(roleLocators.deleteConfirmationBtn);
        await confirmBtn.click();
    }

    async clickCloseDeleteConfirmation() {
        const close = this.page.locator(roleLocators.deleteConfirmationModel_close);
        await close.click();
    }

    async clickEditRole(roleName: string) {
        await this.page
            .locator(`//tr[td[normalize-space()='${roleName}']]//a`)
            .click();
    }

    async editRole() {
        await this.page.locator(roleLocators.editRole_name).click();
        await this.page.locator(roleLocators.editRoleName_editable).press('Control+A');
        await this.page.locator(roleLocators.editRoleName_editable).press('Delete');
        await this.page.locator(roleLocators.roleNameInput_editable).fill('Edited Project Role');
    }

    async saveEditedRoleData() {
        await this.page.locator(roleLocators.editRole_saveBtn).click();
    }

    async verifyRoleEdited(editedRoleName: string) {
        await expect(
            this.page.locator('[data-testid="role-name-content"]')
        ).toHaveText(editedRoleName);
    }


    async ensureRoleVisible(roleName: string): Promise<void> {
        await expect(async () => {
            await this.searchRole(roleName);

            const row = this.page.locator('[data-col-key="role_name"]', {
                hasText: roleName
            });

            // reload only if not visible
            if (!(await row.first().isVisible().catch(() => false))) {
                await this.page.reload();
                await this.page.waitForLoadState('networkidle');
                await this.searchRole(roleName);
            }

            await expect(row).toBeVisible();

        }).toPass({ timeout: 15000 });
    }


    //materials
    async goToMaterialsTab() {

        const tab = this.page.locator(roleLocators.materialsTab);

        await tab.waitFor({ state: "visible", timeout: 30000 });
        await tab.click();

        await this.page.getByText("Add Material").waitFor({ timeout: 30000 });
    }

    async openAddMaterialModel() {

        const tab = this.page.locator(roleLocators.addMaterial_btn);
        await tab.waitFor({ state: "visible", timeout: 30000 });
        await tab.click();

        const browseFileOption = this.page.locator(roleLocators.materialBrowse_option);
        await browseFileOption.waitFor({ state: "visible", timeout: 30000 });
        await browseFileOption.click();

        await this.page.getByText("Drop file or browse").waitFor({ timeout: 30000 });
    }

    async uploadMaterial(filePath: string) {
        await this.page.setInputFiles(
            '[data-testid="material-add-upload"] input[type="file"]',
            filePath
        );
    }

    async clickAddFile() {
        const add = this.page.locator(roleLocators.imageAdd_btn);
        await add.waitFor({ state: "visible", timeout: 30000 });
        await add.click();
        await expect(this.page.getByText('Uploading')).toBeVisible();
        await expect(this.page.getByText('Uploading')).toBeHidden();

    }

    async verifyMaterialAdded(fileName: string) {
        await expect
            .poll(async () => {
                return await this.page
                    .locator('td[data-col-key="name"]', { hasText: fileName })
                    .count();
            }, { timeout: 30000 })
            .toBeGreaterThan(0);

        const allRoles = await this.page.locator('td[data-col-key="name"]').allTextContents();

    }

    async verifyDefaultStatusOfDownloadableToggle() {
        const toggle = this.page.locator(roleLocators.imageDownloadable_toggle);

        await expect(toggle).toBeVisible();
        await expect(toggle).toHaveAttribute('aria-checked', 'false');
    }

    async verifyEnableStatusOfDownloadableToggle() {
        const toggle = this.page.locator(roleLocators.imageDownloadable_toggle);

        await expect(toggle).toBeVisible();
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-checked', 'true');
    }

    async verifyDisableStatusOfDownloadableToggle() {
        const toggle = this.page.locator(roleLocators.imageDownloadable_toggle);

        await expect(toggle).toBeVisible();

        if ((await toggle.getAttribute('aria-checked')) === 'false') {
            await toggle.click();
        }
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-checked', 'false');
    }
}
