import { expect, Page } from "@playwright/test";
import { questionLocators } from "./questionPageLocators";

export default class QuestionPage {
    constructor(public page: Page) { }

    async openFirstProjectIfNeeded() {
        const url = this.page.url();

        // already inside project
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

    async gotoQuestionsTab() {
    await this.openFirstProjectIfNeeded();

    const tab = this.page.getByText("Questions");
    await tab.waitFor({ state: "visible", timeout: 30000 });
    await tab.click();

    await this.page.getByText("Create Question").waitFor({ timeout: 30000 });
    }


    async openCreateQuestion() {
        await this.page.locator(questionLocators.questionListCreateButton).click();
        await this.page.locator(questionLocators.questionTextInput).waitFor({ state: 'visible' });
    }

    async fillQuestionText(text: string) {
        await this.page.locator(questionLocators.questionTextInput).fill(text);
    }

    async selectQuestionType(typeIndex: number) {
        // First, open the type dropdown
        const typeDropdown = this.page.locator(questionLocators.questionTypeGroup);
        await typeDropdown.click();
        await this.page.waitForTimeout(300); // Wait for dropdown options to render

        const selector = `[data-testid="question-type-option-${typeIndex}"] input[type=radio], [data-testid="question-type-option-${typeIndex}"]`;
        const loc = this.page.locator(selector).first();

        try {
            await loc.waitFor({ state: 'visible', timeout: 2000 });
            await loc.click();
            return;
        } catch (e) {
            // Try clicking the container directly if radio input isn't visible
            const container = this.page.locator(`[data-testid="question-type-option-${typeIndex}"]`).first();
            if ((await container.count()) > 0) {
                try {
                    await container.scrollIntoViewIfNeeded();
                    await container.click();
                    return;
                } catch (err) {
                    // last resort: force click
                    await container.click({ force: true });
                    return;
                }
            }

            // Fallback: try selecting by role radio inside the type group
            const groupRadio = this.page.locator(`${questionLocators.questionTypeGroup} >> input[type=radio], ${questionLocators.questionTypeGroup} >> [role="radio"]`).nth(typeIndex - 1);
            if ((await groupRadio.count()) > 0) {
                await groupRadio.click().catch(async () => {
                    await groupRadio.click({ force: true });
                });
                return;
            }

            throw new Error(`Could not select question type ${typeIndex} — no matching locator found or clickable.`);
        }
    }

    async fillCheckboxOption(optionIndex: number, value: string) {
        const locator = `[data-testid="question-options-option-${optionIndex}"]`;
        const input = this.page.locator(locator);
        
        // Wait for the input to exist and be visible
        try {
            await input.waitFor({ state: 'visible', timeout: 3000 });
        } catch (e) {
            console.log(`✗ Option ${optionIndex} not found:`, e);
            return;
        }
        
        // Scroll into view
        try {
            await input.scrollIntoViewIfNeeded();
        } catch (e) {
            // Continue anyway
        }
        
        // Fill the value
        try {
            await input.fill(value);
            console.log(`✓ Filled option ${optionIndex}: "${value}"`);
        } catch (e) {
            console.log(`✗ Could not fill option ${optionIndex}:`, e);
        }
    }


    async addCheckboxOption() {
        const addButton = this.page.locator(questionLocators.questionAddCheckboxOptionButton);
        
        // Wait for button to be visible
        await addButton.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
        
        // Scroll into view if needed
        try {
            await addButton.scrollIntoViewIfNeeded();
        } catch (e) {
            // If scroll fails, try clicking anyway
        }
        
        // Click the add button with explicit timeout
        try {
            await addButton.click({ timeout: 3000 });
            console.log('✓ Added checkbox option');
        } catch (e) {
            console.log('✗ Could not click Add button:', e);
            return;
        }
        
        // Wait for new option field to appear
        await this.page.waitForTimeout(500);
    }


    async fillQuestionDescription(description: string) {
        await this.page.locator(questionLocators.questionDescriptionInput).scrollIntoViewIfNeeded();
        await this.page.locator(questionLocators.questionDescriptionInput).fill(description);
    }

    async toggleRequiredCheckbox(checked?: boolean) {
        const box = this.page.locator(questionLocators.questionRequiredCheckbox).first();
        if ((await box.count()) === 0) return;
        const current = await box.getAttribute('aria-checked');
        if (checked === undefined) {
            await box.click();
            return;
        }
        const isChecked = current === 'true' || current === '1';
        if (isChecked !== checked) await box.click();
    }

    async toggleStatusToggle(checked?: boolean) {
        const toggle = this.page.locator(questionLocators.questionStatusToggle).first();
        if ((await toggle.count()) === 0) return;
        const current = await toggle.getAttribute('aria-checked');
        if (checked === undefined) {
            await toggle.click();
            return;
        }
        const isChecked = current === 'true' || current === '1';
        if (isChecked !== checked) await toggle.click();
    }

    
    async getAvailableRounds(): Promise<string[]> {

        const dropdown = this.page.locator('[data-testid="question-rounds"] .n-base-selection');
        await dropdown.click({ force: true });

        // select visible menu
        const menu = this.page.locator('.n-base-select-menu').filter({ has: this.page.locator('.n-base-select-option') }).last();
        await menu.waitFor({ state: 'visible', timeout: 5000 });

        const options = menu.locator('.n-base-select-option');
        await options.first().waitFor({ timeout: 5000 });

        const count = await options.count();
        const roundNames: string[] = [];

        for (let i = 0; i < count; i++) {
            const text = await options.nth(i).innerText();
            if (text.trim()) roundNames.push(text.trim());
        }

        console.log('Available rounds:', roundNames);

        await this.page.keyboard.press('Escape');
        return roundNames;
    }


    async getAvailableRoles(): Promise<string[]> {
        const field = this.page.locator('[data-testid="question-roles-field"]');

        await field.locator('.n-base-selection-tags').click({ force: true });

        const menu = this.page.locator('.n-base-select-menu').last();
        await menu.waitFor({ state: 'visible', timeout: 5000 });

        const options = menu.locator('.n-base-select-option');
        await options.first().waitFor();

        const names: string[] = [];
        const count = await options.count();

        for (let i = 0; i < count; i++) {
            names.push((await options.nth(i).innerText()).trim());
        }

        await this.page.keyboard.press('Escape');
        return names;
    }


    async setQuestionRound(value: string) {
        const field = this.page.locator('[data-testid="question-rounds-field"]');

        // open dropdown
        await field.locator('.n-base-selection').click({ force: true });

        // wait for menu portal
        const menu = this.page.locator('.n-base-select-menu').last();
        await menu.waitFor({ state: 'visible', timeout: 10000 });

        // wait until options appear
        await this.page.waitForTimeout(500);

        const option = menu.locator('.n-base-select-option').filter({ hasText: value }).first();

        // fallback: try typing
        if (await option.count() === 0) {
            await this.page.keyboard.type(value);
            await this.page.waitForTimeout(500);
        }

        await option.waitFor({ state: 'visible', timeout: 10000 });
        await option.click({ force: true });
    }


    
    async setQuestionRole(value: string) {
        const field = this.page.locator('[data-testid="question-roles-field"]');

        // wait until roles field is enabled after round selection
        await field.waitFor({ state: 'visible', timeout: 10000 });

        const input = field.locator('.n-base-selection-tags');

        // wait until clickable
        await input.waitFor({ state: 'visible', timeout: 10000 });

        // click + focus
        await input.click({ force: true });
        await input.focus();

        // open dropdown via keyboard
        await this.page.keyboard.press('ArrowDown');

        // wait for menu portal
        const menu = this.page.locator('.n-base-select-menu').last();
        await menu.waitFor({ state: 'visible', timeout: 1000 });

        // select option container
        const option = menu.locator('.n-base-select-option', { hasText: value }).first();
        await option.waitFor({ state: 'visible', timeout: 1000 });
        await option.click({ force: true });

    }


    async submitQuestion() {
    await this.page.locator(questionLocators.questionSaveButton).click();

    // wait modal close
    await this.page.locator(questionLocators.questionTextInput)
        .waitFor({ state: 'detached', timeout: 10000 })
        .catch(() => {});

    // wait for question to appear instead
    await this.page.waitForTimeout(500); // UI settle
}


    async closeNewQuestionModal() {
        // Try common close selectors; be permissive to match different UIs
        const candidates = [
            '[data-testid="question-new-close-button"]',
            'button:has-text("Close")',
            'button[aria-label="Close"]',
            'button:has-text("Cancel")'
        ];
        for (const s of candidates) {
            const btn = this.page.locator(s).first();
            if ((await btn.count()) > 0 && (await btn.isVisible())) {
                await btn.click();
                await this.page.locator(questionLocators.questionTextInput).waitFor({ state: 'detached', timeout: 5000 }).catch(() => { });
                return;
            }
        }
        // Fallback: try to close any open dialog by pressing Escape
        await this.page.keyboard.press('Escape');
        await this.page.locator(questionLocators.questionTextInput).waitFor({ state: 'detached', timeout: 5000 }).catch(() => { });
    }

    // Generic helper copied from RoundPage to robustly select options from custom selects
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

            try {
                const toggle = dropdown.locator('button, .n-base-selection, .n-select, .n-input');
                if ((await toggle.count()) > 0) await toggle.first().click({ force: true });
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

        // If options appear only after typing inside a dialog/input, try that
        try {
            const dialog = this.page.locator('role=dialog').first();
            const container = (await dialog.count()) > 0 ? dialog : this.page;
            const postInputs = container.locator('input[type="text"], input.n-input__input-el, input').filter({ has: dropdown }).first();
            let typed = false;

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
                await this.page.waitForTimeout(300);
                const checkInDialog = container.locator(`text="${value}"`).first();
                if ((await checkInDialog.count()) > 0 && (await checkInDialog.isVisible())) return;
            }
        } catch (e) {
            // ignore and let final error be thrown
        }

        // Try focusing inputs inside dropdown itself
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
                        await this.page.waitForTimeout(200);
                        const check = dropdown.locator(`text="${value}"`).first();
                        if ((await check.count()) > 0 && (await check.isVisible())) return;
                    }
                }
                await dropdown.click({ force: true }).catch(() => { });
                await this.page.waitForTimeout(100);
            }
        } catch (e) {
            // ignore
        }

        try {
            await this.page.keyboard.type(value, { delay: 50 });
            await this.page.keyboard.press('Enter');
            await this.page.waitForTimeout(100);
            const check = this.page.locator(`text="${value}"`).first();
            if ((await check.count()) > 0) return;
        } catch (e) {
            // ignore
        }

        throw new Error(`Could not select option "${value}" for dropdown ${selector} — no visible option found after ${maxWait}ms.`);
    }

    async createNewQuestion(payload: {
        text: string;
        typeIndex: number;
        options?: string[];
        description?: string;
        required?: boolean;
        active?: boolean;
        roundNames?: string;
        roleNames?: string;
    }) {
        await this.openCreateQuestion();
        await this.fillQuestionText(payload.text);
        await this.selectQuestionType(payload.typeIndex);

        // Add options for checkbox/radio/dropdown/availability questions (types 2-7)
        if (payload.options && payload.options.length > 0) {
            for (let i = 0; i < payload.options.length; i++) {
                if (i > 0) await this.addCheckboxOption();
                await this.fillCheckboxOption(i, payload.options[i]);
            }
        }

        if (payload.description) await this.fillQuestionDescription(payload.description);
        if (payload.required !== undefined) await this.toggleRequiredCheckbox(payload.required);
        if (payload.active !== undefined) await this.toggleStatusToggle(payload.active);
        if (payload.roundNames && payload.roundNames.length > 0) {
            for (const roundName of payload.roundNames) {
                await this.setQuestionRound(roundName);
            }
        }
        if (payload.roleNames && payload.roleNames.length > 0) {
            for (const roleName of payload.roleNames) {
                await this.setQuestionRole(roleName);
            }
        }

        await this.submitQuestion();
    }

    async isQuestionPresent(text: string) {
        const loc = this.page.locator(`text=${text}`);
        return (await loc.count()) > 0;
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
        if (this.page.isClosed && this.page.isClosed()) {
            throw new Error(`Cannot open project ${id}: page is already closed`);
        }

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

        const timeout = options?.timeout ?? 5000;
        try {
            await locator.waitFor({ state: 'visible', timeout });
            await locator.scrollIntoViewIfNeeded();
        } catch (err) {
            const fallbacks = [
                `a[href*="/projects/${id}"]`,
                `a[href="/projects/${id}"]`,
                `[data-testid="project-list-card-${id}"]`,
                `[data-testid^="project-list-card-"]`
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

        await locator.click();

        await Promise.race([
            this.page.waitForURL(/\/projects\/\d+/, { timeout: 15000 }).catch(()=>{}),
            this.page.locator(questionLocators.questionTab)
                .waitFor({ state: 'visible', timeout: 15000 })
                .catch(()=>{})
        ]);


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
}
