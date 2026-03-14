// Locator collection for Role (New Role modal / Role listing)
// Follow the project's locator naming convention used in projectPageLocators.ts
export const roleLocators = {
  // roles tab / create button
  rolesTab: '[data-testid="projects.roles-tab"]',
  createRoleButton: '[data-testid="create-role-button"]',

  // basic inputs
  roleNameInput: '[data-testid="role-name"]',
  roleImageDragger: '[data-testid="role-image-dragger"]',
  roleImage: '[data-testid="role-image"]',
  roleDescriptionContent: 'div[data-testid="role-description-content"]',
  roleNumberOfPeopleInput: '[data-testid="role-number-of-people"]',

  // contract type radio options (wrappers and inputs)
  roleContractType1: '[data-testid="role-contract-type-1"]',
  roleContractType1Input: '[data-testid="role-contract-type-1"] input[type="radio"]',
  roleContractType2: '[data-testid="role-contract-type-2"]',
  roleContractType2Input: '[data-testid="role-contract-type-2"] input[type="radio"]',
  roleContractType3: '[data-testid="role-contract-type-3"]',
  roleContractType3Input: '[data-testid="role-contract-type-3"] input[type="radio"]',
  roleContractType4: '[data-testid="role-contract-type-4"]',
  roleContractType4Input: '[data-testid="role-contract-type-4"] input[type="radio"]',
  roleContractType5: '[data-testid="role-contract-type-5"]',
  roleContractType5Input: '[data-testid="role-contract-type-5"] input[type="radio"]',

  // date inputs
  roleContractDateFromInput: '[data-testid="role-contract-date-from-input"]',
  roleContractDateToInput: '[data-testid="role-contract-date-to-input"]',
  roleRehearsalDateFromInput: '[data-testid="role-rehearsal-date-from-input"]',
  roleRehearsalDateToPicker: '[data-testid="role-rehearsal-date-to-picker"]',

  // demographic / selection fields
  roleGenderDropDown: '[data-testid="role-gender"]',
  roleMinAgeInput: '[data-testid="role-min-age"]',
  roleMaxAgeInput: '[data-testid="role-max-age"]',
  roleEthnicityDropDown: '[data-testid="role-ethnicity"]',
  roleSkillsFieldDropDown: '[data-testid="role-skills-field"]',
  roleLanguagesDropDown: '[data-testid="role-languages"]',
  roleNudityStatusDropDown: '[data-testid="role-nudity-status"]',

  // physical attributes
  roleMinHeightInput: '[data-testid="role-min-height"]',
  roleMaxHeightInput: '[data-testid="role-max-height"]',
  roleHeightUnit: '[data-testid="role-height-unit"]',
  roleMinWeightInput: '[data-testid="role-min-weight"]',
  roleMaxWeightInput: '[data-testid="role-max-weight"]',
  roleWeightUnit: '[data-testid="role-weight-unit"]',

  // actions
  roleNewSubmitButton: '[data-testid="role-new-submit-button"]',
  roleNewCloseButton: '[data-testid="role-new-close-button"]',

  searchRound: "//div[@class='n-input-wrapper']",
  searchInput: "//input[@placeholder='Search...']",

  //delete round 
  deleteConfirmationBtn: '[data-testid="role-list-delete-accept"]',
  deleteConfirmationModel_close: "//button[@aria-label='close']"
  , emptyRoundMessage: "//div[@class='empty']",

  //edit
  editRole_name: '[data-testid="role-name-content"]',
  editRoleName_editable : "//div[@class='n-form-item n-form-item--medium-size n-form-item--top-labelled editing']//div[@class='editable-field-content-inner']",
  editRole_description: 'data-testid="role-description-content"',
  editRoleDescription_editable : "//div[@aria-label='Editor editing area: main']",
  emptyRoleName_error :"//div[@class='n-form-item-feedback__line']",
  roleNameInput_editable : 'input[data-testid="role-name"]',
  editRole_saveBtn : "//span[normalize-space()='Save']"

};
