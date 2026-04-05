import { expect, Page } from "@playwright/test";
import { projectLocators } from "./projectPageLocators";

export default class ProjectPage {
  constructor(public page: Page) { }

  // ---------- OPEN CREATE MENU ----------
  async openCreateMenu() {
    const btn = this.page.locator(projectLocators.createBtn);

    await btn.waitFor({ state: "visible", timeout: 15000 });
    await btn.click();

    // wait dropdown visible (NOT networkidle)
    await this.page.locator(projectLocators.newProject)
      .waitFor({ state: "visible", timeout: 15000 });
  }

  // ---------- SELECT NEW PROJECT ----------
  async selectNewProject() {
    const item = this.page.locator(projectLocators.newProject);

    await item.waitFor({ state: "visible", timeout: 15000 });
    await item.click();

    await this.page.locator(projectLocators.titleInput)
      .waitFor({ state: "visible", timeout: 30000 });
  }

  async fillTitle(title: string) {
    await this.page.locator(projectLocators.titleInput).fill(title);
  }

  async fillProductionCompany(name: string) {
    await this.page.locator(projectLocators.productionCompanyInput).fill(name);
  }

  async fillLocation(location: string) {
    const loc = this.page.locator(projectLocators.locationInput);
    await loc.fill(location);
    await loc.press("Enter").catch(() => { });
  }

  async fillUrl(url: string) {
    await this.page.locator(projectLocators.urlInput).fill(url);
  }

  async fillEmail(email: string) {
    await this.page.locator(projectLocators.emailInput).fill(email);
  }

  async openPhoneDropdown() {
    const dd = this.page.locator(projectLocators.phoneDropdown);
    await dd.click();
    await dd.press("Enter").catch(() => { });
  }

  async fillPhoneInput(phone: string) {
    const input = this.page.locator(projectLocators.phoneInput);
    await input.fill(phone);
    await input.press("Enter").catch(() => { });
  }

  async setContractDate(from?: string, to?: string) {
    if (from) await this.page.locator(projectLocators.contractDateFromInput).fill(from);
    if (to) await this.page.locator(projectLocators.contractDateToInput).fill(to);
  }

  async setRehearsalDate(from?: string, to?: string) {
    if (from) await this.page.locator(projectLocators.rehearsalDateFromInput).fill(from);
    if (to) await this.page.locator(projectLocators.rehearsalDateToInput).fill(to);
  }

  async selectContractType(typeIndex: number) {
    const selector = `[data-testid="contract-type-${typeIndex}"] input[type="radio"], [data-testid="contract-type-${typeIndex}"]`;
    await this.page.locator(selector).first().click();
  }

  async selectUnion(optionIndex: number) {
    const selector = `[data-testid="union-${optionIndex}"] input[type="radio"], [data-testid="union-${optionIndex}"]`;
    await this.page.locator(selector).first().click();
  }

  async toggleProductionType(testId = "production-type-1") {
    await this.page.locator(`[data-testid="${testId}"]`).click();
  }

  async uploadProjectImage(filePath: string) {
    await this.page.setInputFiles(projectLocators.projectImageFileInput, filePath);
  }

  async fillDescription(description: string) {
    await this.page.locator(projectLocators.descriptionContent).fill(description);
  }

  async fillPersonnelInformationContent(val: string) {
    await this.page.locator(projectLocators.personnelInformationContent).fill(val);
  }

  async fillAdditionalInfoContent(val: string) {
    await this.page.locator(projectLocators.additionalInfoContent).fill(val);
  }

  async fillOtherInfoContent(val: string) {
    await this.page.locator(projectLocators.otherInfoContent).fill(val);
  }

  // ---------- SUBMIT PROJECT (FIXED FOR SKELETON LOADER) ----------
  async submitNewProject(projectTitle?: string) {
    const submitBtn = this.page.locator(projectLocators.projectNewSubmitButton);

    await submitBtn.waitFor({ state: "visible", timeout: 15000 });
    await submitBtn.click();

    // wait modal close
    await this.page.locator(projectLocators.titleInput)
      .waitFor({ state: "detached", timeout: 60000 })
      .catch(() => { });

    // 🔥 wait skeleton loader disappear
    await this.page.locator(".n-skeleton")
      .first()
      .waitFor({ state: "detached", timeout: 60000 })
      .catch(() => { });

    // small settle
    await this.page.waitForTimeout(500);

    if (projectTitle) {
      await this.page.getByText(projectTitle)
        .waitFor({ state: "visible", timeout: 60000 });
    }
  }

  async clickTermsCheckbox() {
    await this.page.locator(projectLocators.termsCheckbox).click();
  }

  async fillTermsUrl(url: string) {
    await this.page.locator(projectLocators.termsUrl).fill(url);
  }

  async createNewProject(payload: any) {
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

    if (payload.contractFrom || payload.contractTo)
      await this.setContractDate(payload.contractFrom, payload.contractTo);

    if (payload.rehearsalFrom || payload.rehearsalTo)
      await this.setRehearsalDate(payload.rehearsalFrom, payload.rehearsalTo);

    if (payload.contractTypeIndex) await this.selectContractType(payload.contractTypeIndex);
    if (payload.unionIndex) await this.selectUnion(payload.unionIndex);
    if (payload.productionTypeTestId) await this.toggleProductionType(payload.productionTypeTestId);
    if (payload.imagePath) await this.uploadProjectImage(payload.imagePath);

    if (payload.descriptionHtml) await this.fillDescription(payload.descriptionHtml);
    if (payload.personnelHtml) await this.fillPersonnelInformationContent(payload.personnelHtml);
    if (payload.additionalHtml) await this.fillAdditionalInfoContent(payload.additionalHtml);
    if (payload.otherHtml) await this.fillOtherInfoContent(payload.otherHtml);

    if (payload.acceptTerms) await this.clickTermsCheckbox();
    if (payload.termsUrl) await this.fillTermsUrl(payload.termsUrl);

    await this.submitNewProject(payload.title);
  }

  async isProjectPresent(name: string) {
    return (await this.page.locator(`text=${name}`).count()) > 0;
  }

  async openSearchedProject(name: string): Promise<void> {
    await expect(async () => {

      // refresh to get latest data (important for API-created projects)
      await this.page.reload();
      await this.page.waitForLoadState('networkidle');

      const searchIcon = this.page.locator(projectLocators.projectSearchIcon);
      await expect(searchIcon).toBeVisible();
      await searchIcon.hover();

      const searchInput = this.page.locator('input[placeholder*="Search"]:visible');
      await expect(searchInput).toBeVisible();

      await searchInput.fill(name);

      // wait for result
      const projectResult = this.page.locator('[data-testid^="project-list-card-"]', {
        hasText: name,
      });

      await expect(projectResult).toBeVisible();

      // click project
      await projectResult.first().click();

    }).toPass({ timeout: 20000 });

    // ensure navigation happened
    await expect(this.page).toHaveURL(/\/projects\/\d+/);
    
  }

  async clickDeleteProject(projectName: string, projectId: number) {

    const projectCard = this.page
      .locator('[data-testid="project-list-content"]')
      .filter({ hasText: projectName });

    await expect(projectCard).toBeVisible({ timeout: 10000 });

    const dropdown = this.page.getByTestId(
      `project-list-dropdown-action-${projectId}-trigger`
    );

    await expect(dropdown).toBeVisible();

    await dropdown.click();
  }

  
  async clickDeleteConfirmationBtn() {
    await this.page.locator(projectLocators.deleteConfirmationBtn).click();

  }

}
