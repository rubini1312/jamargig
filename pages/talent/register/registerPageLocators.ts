
// Locators for talent register page 
export const talentRegisterLocators = {

  //talent user details
  fullNameInput: "[data-testid='auth-name']",
  stageNameInput: "//div[@label='Stage Name']//input",
  locationInput: "//input[@class='n-base-selection-input']",
  genderSelector: "[data-testid='auth-gender']",
  dobPicker: "//input[@placeholder='Select Date']",
  termsAndConditionCheckBox : "//div[@class='n-checkbox-box__border']",
  continueButton: "role=button[name='Continue']",

  //upload profile
  uploadInput: "input[type='file']",
  cropImageSaveButton : "//span[normalize-space()='Save']",

  selfRatedSkillsDropdown: "[data-testid='auth-self_rated_skills-field']",
  selfRatedSkillsInput: "[data-testid='auth-self_rated_skills-input']",

  unionsDropdown: "[data-testid='auth-unions']",
  descriptionInput: "[data-testid='auth-description-content']",
  productionTypeSelector: "[data-testid='auth-production_types-field']",

  dropDownOptions: "[role='option']"

};



