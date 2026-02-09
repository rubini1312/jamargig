import { Page } from "@playwright/test";
import { projectLocators } from "./projectPageLocators";

export default class ProjectPage {
  constructor(public page: Page) { }

  // Open create menu (left corner)
  async openCreateMenu() {
    await this.page.locator(projectLocators.createBtn).click();
    await this.page.waitForLoadState("networkidle");
  }

  // Select "New Project" from create dropdown
  async selectNewProject() {
    await this.page.locator(projectLocators.newProject).click();
    await this.page.locator(projectLocators.titleInput).waitFor({ state: "visible" });
  }

  // Fill simple inputs
  async fillTitle(title: string) {
    await this.page.locator(projectLocators.titleInput).fill(title);
  }

  async fillProductionCompany(name: string) {
    await this.page.locator(projectLocators.productionCompanyInput).fill(name);
  }

  async fillLocation(location: string) {
    // some location inputs use selection widgets; try fill then press Enter
    const loc = this.page.locator(projectLocators.locationInput);
    await loc.fill(location);
    await loc.press("Enter");
    await loc.press("Enter");
  }

  async fillUrl(url: string) {
    await this.page.locator(projectLocators.urlInput).fill(url);
  }

  async fillEmail(email: string) {
    await this.page.locator(projectLocators.emailInput).fill(email);
  }

  // Phone handling
  async openPhoneDropdown() {
    await this.page.locator(projectLocators.phoneDropdown).click();
    await this.page.locator(projectLocators.phoneDropdown).press("Enter").catch(() => { });
  }

  async fillPhoneInput(phone: string) {
    await this.page.locator(projectLocators.phoneInput).fill(phone);
    // press Enter in case the input is a select/search
    await this.page.locator(projectLocators.phoneInput).press("Enter").catch(() => { });
  }

  // Date inputs (pass values in app expected format, e.g. YYYY-MM-DD or visible format)
  async setContractDate(from: string, to?: string) {
    if (from) await this.page.locator(projectLocators.contractDateFromInput).fill(from);
    if (to) await this.page.locator(projectLocators.contractDateToInput).fill(to);
  }

  async setRehearsalDate(from: string, to?: string) {
    if (from) await this.page.locator(projectLocators.rehearsalDateFromInput).fill(from);
    if (to) await this.page.locator(projectLocators.rehearsalDateToInput).fill(to);
  }

  // Radio / checkbox selection
  async selectContractType(typeIndex: number) {
    // e.g. pass 1..5
    const selector = `[data-testid="contract-type-${typeIndex}"] input[type="radio"], [data-testid="contract-type-${typeIndex}"]`;
    const locator = this.page.locator(selector);
    await locator.first().click();
  }

  async selectUnion(optionIndex: number) {
    const selector = `[data-testid="union-${optionIndex}"] input[type="radio"], [data-testid="union-${optionIndex}"]`;
    await this.page.locator(selector).first().click();
  }

  async toggleProductionType(testId = "production-type-1") {
    await this.page.locator(`[data-testid="${testId}"]`).click();
  }

  // Upload project image (local path)
  async uploadProjectImage(filePath: string) {
    // uses the file input inside the upload component
    await this.page.setInputFiles(projectLocators.projectImageFileInput, filePath);
  }

  // Fill CKEditor contenteditable fields by selector (robust: set HTML, dispatch events, fallback to typing)
  /*   async fillRichText(selector: string, html: string) {
      // wait for editor editable area to be visible
      await this.page.waitForSelector(selector, { state: "visible", timeout: 7000 });
  
      const editable = this.page.locator(selector);
      await editable.click({ force: true });
  
      // try to set innerHTML and emit events that CKEditor might listen to
      await this.page.evaluate(
        ({ selector, html }) => {
          const el = document.querySelector(selector) as HTMLElement | null;
          if (!el) return false;
  
          // Focus and set HTML
          el.focus();
          el.innerHTML = html;
  
          // Dispatch common events CKEditor may listen to
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
  
          // Some CKEditor implementations watch for 'blur' to sync
          el.dispatchEvent(new Event("blur", { bubbles: true }));
  
          return true;
        },
        { selector, html }
      );
  
      // brief pause to let editor process the change
      await this.page.waitForTimeout(250);
  
      // verify the content was set; if not, fallback to typing the plain text
      const currentHtml = await this.page.evaluate((s: string) => {
        const el = document.querySelector(s) as HTMLElement | null;
        return el ? el.innerHTML : null;
      }, selector);
  
      const plain = html.replace(/<[^>]*>/g, "").trim();
      const hasPlain = currentHtml && currentHtml.includes(plain) && plain.length > 0;
  
      if (!hasPlain) {
        // fallback: clear and type plain text (simulate user input)
        await editable.click({ force: true });
        // select all + delete (some editors respond to keyboard)
        await this.page.keyboard.press("Control+A").catch(() => {});
        await this.page.keyboard.press("Backspace").catch(() => {});
        if (plain.length) {
          await this.page.keyboard.type(plain, { delay: 20 });
        }
        // give editor time to sync
        await this.page.waitForTimeout(300);
      }
    } */
  async fillDescription(description: string) {
    await this.page.locator(projectLocators.descriptionContent).fill(description);
  }

  async fillPersonnelInformationContent(personalinfor: string) {
    await this.page.locator(projectLocators.personnelInformationContent).fill(personalinfor);
  }

  async fillAdditionalInfoContent(additionalinfor: string) {
    await this.page.locator(projectLocators.additionalInfoContent).fill(additionalinfor);
  }

  async fillOtherInfoContent(otherinfor: string) {
    await this.page.locator(projectLocators.otherInfoContent).fill(otherinfor);
  }

  // Submit / create project button
  async submitNewProject() {
    await this.page.locator(projectLocators.projectNewSubmitButton).click();
    // wait for modal to close
    await this.page.locator(projectLocators.titleInput).waitFor({ state: "detached", timeout: 7000 }).catch(() => { });
    await this.page.waitForLoadState("networkidle");
  }

  // Terms: click checkbox, fill URL, and check state
  async clickTermsCheckbox() {
    await this.page.locator(projectLocators.termsCheckbox).click();
  }

  async fillTermsUrl(url: string) {
    await this.page.locator(projectLocators.termsUrl).fill(url);
  }

  async isTermsChecked(): Promise<boolean> {
    const attr = await this.page.locator(projectLocators.termsCheckbox).getAttribute('aria-checked');
    return attr === 'true' || attr === 'True' || attr === '1';
  }

  // Composite: create a new project with provided payload
  async createNewProject(payload: {
    title: string;
    productionCompany?: string;
    location?: string;
    descriptionHtml?: string;
    personnelHtml?: string;
    additionalHtml?: string;
    otherHtml?: string;
    url?: string;
    email?: string;
    phone?: string;
    contractFrom?: string;
    contractTo?: string;
    rehearsalFrom?: string;
    rehearsalTo?: string;
    contractTypeIndex?: number;
    unionIndex?: number;
    productionTypeTestId?: string;
    imagePath?: string;
    termsUrl?: string;
    acceptTerms?: boolean;
  }) {
    await this.openCreateMenu();
    await this.selectNewProject();

    await this.fillTitle(payload.title);
    if (payload.productionCompany) await this.fillProductionCompany(payload.productionCompany);
    if (payload.location) await this.fillLocation(payload.location);
    if (payload.url) await this.fillUrl(payload.url);
    if (payload.email) await this.fillEmail(payload.email);

    if (payload.phone) {
      await this.openPhoneDropdown();
      await this.fillPhoneInput(payload.phone);
    }

    if (payload.contractFrom || payload.contractTo) await this.setContractDate(payload.contractFrom ?? "", payload.contractTo);
    if (payload.rehearsalFrom || payload.rehearsalTo) await this.setRehearsalDate(payload.rehearsalFrom ?? "", payload.rehearsalTo);
    if (payload.contractTypeIndex) await this.selectContractType(payload.contractTypeIndex);
    if (payload.unionIndex) await this.selectUnion(payload.unionIndex);
    if (payload.productionTypeTestId) await this.toggleProductionType(payload.productionTypeTestId);
    if (payload.imagePath) await this.uploadProjectImage(payload.imagePath);

    if (payload.descriptionHtml) {
      await this.fillDescription(payload.descriptionHtml);
      await this.page.waitForTimeout(200);
    }
    if (payload.personnelHtml) {
      await this.fillPersonnelInformationContent(payload.personnelHtml);
      await this.page.waitForTimeout(200);
    }
    if (payload.additionalHtml) {
      await this.fillAdditionalInfoContent(payload.additionalHtml);
      await this.page.waitForTimeout(200);
    }
    if (payload.otherHtml) {
      await this.fillOtherInfoContent(payload.otherHtml);
      await this.page.waitForTimeout(200);
    }

    // terms handling
    if (payload.acceptTerms) {
      await this.clickTermsCheckbox();
      await this.page.waitForTimeout(100);
    }

    if (payload.termsUrl) {
      await this.fillTermsUrl(payload.termsUrl);
      await this.page.waitForTimeout(100);
    }

    await this.submitNewProject();
  }

  // Verify project exists in projects list by name
  async isProjectPresent(name: string) {
    // try project card filter first
    const cards = this.page.locator(projectLocators.projectCard).filter({ hasText: name });
    const count = await cards.count();
    if (count > 0) return true;

    // fallback search in whole page
    return (await this.page.locator(`text=${name}`).count()) > 0;
  }
}