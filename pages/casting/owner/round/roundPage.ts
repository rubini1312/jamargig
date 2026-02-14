import { Page } from "@playwright/test";
import { roundLocators } from "./roundPageLocators";

export default class RoundPage {
    constructor(public page: Page) { }

    async gotoRoundsTab() {
        if (this.page.isClosed && this.page.isClosed()) {
            throw new Error('Cannot click Rounds tab: the Page is already closed. Ensure navigation to the project finished (wait for navigation) before interacting.');
        }

        const tab = this.page.locator(roundLocators.roundTab);
        try {
            await tab.waitFor({ state: 'visible', timeout: 5000 });
        } catch (e) {
            // If still on projects list, open first project and retry
            const firstProjectLink = this.page.locator('a[href^="/projects/"]').first();
            if ((await firstProjectLink.count()) > 0) {
                await Promise.all([
                    this.page.waitForNavigation(),
                    firstProjectLink.click()
                ]).catch(() => { });
                await this.page.waitForLoadState('networkidle');
                await tab.waitFor({ state: 'visible' });
            } else {
                throw new Error('Rounds tab not visible and no project link found — ensure the test opened a project before calling gotoRoundsTab.');
            }
        }

        await tab.click();
        await this.page.waitForLoadState('networkidle');
    }

    async openCreateRound() {
        await this.page.locator(roundLocators.roundListCreateButton).click();
        await this.page.locator(roundLocators.roundNameInput).waitFor({ state: 'visible' });
    }

    async fillRoundName(name: string) {
        await this.page.locator(roundLocators.roundNameInput).fill(name);
    }

    async selectRoundType(index: number) {
        const selector = `[data-testid="round-type-${index}"] input[type=radio], [data-testid="round-type-${index}"]`;
        await this.page.locator(selector).first().click();
    }

    async setTimezone(value: string) {
        await this.selectDropdownOption(roundLocators.roundTimezone, value);
    }

   async setLocation(value: string) {
    const input = this.page.locator(roundLocators.roundLocationInput);

    await input.scrollIntoViewIfNeeded();
    await input.fill(value);

    const option = this.page.getByRole('option', { name: value }).first();

    try {
        await option.waitFor({
        state: 'visible',
        timeout: 5000
        });

        await option.click();
        return;

    } catch {
        // fallback if dropdown didn't show
        await input.press('Enter');
    }
  }

    async setRadius(value: string) {
        await this.page.locator(roundLocators.roundRadiusInput).fill(value);
    }
    async setDefaultNumberOfTalents(value: string) {
        await this.page.locator(roundLocators.roundDefaultNumberOfTalentsInput).fill(value);
    }
    async setMinimumNumberOfTalents(value: string) {
        await this.page.locator(roundLocators.roundMinimumNumberOfTalentsInput).fill(value);
    }


    /*   async setDateFrom(value: string) {
        const input = this.page.locator(roundLocators.roundDateFromInput);
        await input.scrollIntoViewIfNeeded();
        if ((await input.count()) > 0) {
          await input.fill(value);
          await input.press('Enter').catch(() => {});
        }
      } */

    /*   async setDateTo(value: string) {
        const picker = this.page.locator(roundLocators.roundDateToInput);
        await picker.scrollIntoViewIfNeeded();
    
        const inner = picker.locator('input[type="text"], input.n-input__input-el, input');
        if ((await inner.count()) > 0) {
          await inner.first().fill(value);
          await inner.first().press('Enter').catch(() => {});
          return;
        }
    
        // fallback: click and try to select day text
        await picker.click();
        const dayMatch = String(value).match(/\b(\d{1,2})\b/);
        if (dayMatch) {
          const day = dayMatch[1];
          const dayLocator = this.page.locator(`div.n-date-picker >> text="${day}"`).first();
          if ((await dayLocator.count()) > 0) {
            await dayLocator.click();
            return;
          }
        }
    
        await this.page.keyboard.type(String(value));
      } */

    async setRoundDate(from?: string, to?: string) {
        if (from) await this.page.locator(roundLocators.roundDateFromInput).fill(from);
        await this.page.locator(roundLocators.roundDateFromInput).press("Enter");
        if (to) await this.page.locator(roundLocators.roundDateToInput).fill(to);
        await this.page.locator(roundLocators.roundDateToInput).press("Enter");
    }

    async setSubmissionDate(from?: string, to?: string) {
        if (from) await this.page.locator(roundLocators.roundSubmissionDateFromInput).fill(from);
        await this.page.locator(roundLocators.roundSubmissionDateFromInput).press("Enter");
        if (to) await this.page.locator(roundLocators.roundSubmissionDateToInput).fill(to);
        await this.page.locator(roundLocators.roundSubmissionDateToInput).press("Enter");
    }

    async setAssessmentDate(from?: string, to?: string) {
        if (from) await this.page.locator(roundLocators.roundAssessmentDateFromInput).fill(from);
        await this.page.locator(roundLocators.roundAssessmentDateFromInput).press("Enter");
        if (to) await this.page.locator(roundLocators.roundAssessmentDateToInput).fill(to);
        await this.page.locator(roundLocators.roundAssessmentDateToInput).press("Enter");
    }

    async setSubmissionType(index: number) {
        const selector = `[data-testid="round-submission-type-${index}"] input[type=radio], [data-testid="round-submission-type-${index}"]`;
        await this.page.locator(selector).first().click();
    }

    async setDisplayApplicationNumber(index: number) {
        const selector = `[data-testid="round-display-application-number-${index}"] input[type=radio], [data-testid="round-display-application-number-${index}"]`;
        await this.page.locator(selector).first().click();
    }

    async toggleRoleQuestionsOnlyField(checked?: boolean) {
        const box = this.page.locator(roundLocators.roundRoleQuestionsOnlyField);
        if ((await box.count()) === 0) return;
        const current = await box.getAttribute('aria-checked');
        if (checked === undefined) {
            await box.click();
            return;
        }
        const isChecked = current === 'true' || current === '1';
        if (isChecked !== checked) await box.click();
    }

    // Fill CKEditor area reliably by setting innerHTML and dispatching events
    async fillInstruction(instruction: string) {
        await this.page.locator(roundLocators.roundInstruction).fill(instruction);
    }

    async submitNewRound() {
        await this.page.locator(roundLocators.roundNewSubmitButton).click();
        // wait for the create dialog to close (round name input detached) or network idle
        await this.page.locator(roundLocators.roundNameInput).waitFor({ state: 'detached', timeout: 7000 }).catch(() => { });
        await this.page.waitForLoadState('networkidle');
    }

    async closeNewRoundModal() {
        // Try common close selectors; be permissive to match different UIs
        const candidates = [
            '[data-testid="round-new-close-button"]',
            'button:has-text("Close")',
            'button[aria-label="Close"]',
            'button:has-text("Cancel")'
        ];
        for (const s of candidates) {
            const btn = this.page.locator(s).first();
            if ((await btn.count()) > 0 && (await btn.isVisible())) {
                await btn.click();
                await this.page.locator(roundLocators.roundNameInput).waitFor({ state: 'detached', timeout: 5000 }).catch(() => { });
                return;
            }
        }
        // Fallback: try to close any open dialog by pressing Escape
        await this.page.keyboard.press('Escape');
        await this.page.locator(roundLocators.roundNameInput).waitFor({ state: 'detached', timeout: 5000 }).catch(() => { });
    }

    // Generic helper copied from RolePage to robustly select options from custom selects
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

    async createNewRound(payload: {
        name: string;
        typeIndex?: number;
        timezone?: string;
        location?: string;
        radius?: string;
        units?: string;
        defaultNumberOfTalents?: string;
        minimumNumberOfTalents?: string;
        roundDateFrom?: string;
        roundDateTo?: string;
        submissionTypeIndex?: number;
        displayApplicationNumberIndex?: number;
        submissionDateFrom?: string;
        submissionDateTo?: string;
        assessmentDateFrom?: string;
        assessmentDateTo?: string;
        instructionHtml?: string;
    }) {
        await this.openCreateRound();
        await this.fillRoundName(payload.name);
        if (payload.typeIndex) await this.selectRoundType(payload.typeIndex);
        if (payload.timezone) await this.setTimezone(payload.timezone);
        if (payload.location) await this.setLocation(payload.location);
        if (payload.radius) await this.setRadius(payload.radius);
        if (payload.units) await this.selectDropdownOption(roundLocators.roundUnitsInput, payload.units);
        if (payload.defaultNumberOfTalents) await this.setDefaultNumberOfTalents(payload.defaultNumberOfTalents);
        if (payload.minimumNumberOfTalents) await this.setMinimumNumberOfTalents(payload.minimumNumberOfTalents);
        if (payload.roundDateFrom || payload.roundDateTo) await this.setRoundDate(payload.roundDateFrom ?? "", payload.roundDateTo);
        if (payload.submissionTypeIndex) await this.setSubmissionType(payload.submissionTypeIndex);
        if (payload.displayApplicationNumberIndex) await this.setDisplayApplicationNumber(payload.displayApplicationNumberIndex);
        if (payload.submissionDateFrom || payload.submissionDateTo) await this.setSubmissionDate(payload.submissionDateFrom ?? "", payload.submissionDateTo);
        if (payload.assessmentDateFrom || payload.assessmentDateTo) await this.setAssessmentDate(payload.assessmentDateFrom ?? "", payload.assessmentDateTo);
        if (payload.instructionHtml) await this.fillInstruction(payload.instructionHtml);
        await this.submitNewRound();
    }

    async isRoundPresent(name: string) {
        const loc = this.page.locator(`text=${name}`);
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
}
