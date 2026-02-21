export const projectLocators = {
    // create menu
    createBtn: '[data-testid="main-nav-create-action"]',
    newProject: '//div[@data-dropdown-option="true"]//div[contains(@class,"n-dropdown-option-body__label") and normalize-space()="New Project"]',

    // inputs / fields
    titleInput: '[data-testid="title"]',
    productionCompanyInput: '[data-testid="production-company"]',
    locationInput: '[data-testid="location-input"]',
    urlInput: '[data-testid="url"]',
    emailInput: '[data-testid="email"]',

    // rich text / CKEditor fields
    descriptionContent: 'div[data-testid="description-content"]',
    personnelInformationContent: 'div[data-testid="personnel-information-content"]',
    additionalInfoContent: 'div[data-testid="additional-info-content"]',
    otherInfoContent: 'div[data-testid="other-info-content"]',

    // contract / payment options
    contractTypePaid: '[data-testid="contract-type-1"]', // radio label wrapper
    contractTypePaidInput: '[data-testid="contract-type-1"] input[type="radio"]',
    contractTypeUnaid: '[data-testid="contract-type-2"]',
    contractTypeAcedamic: '[data-testid="contract-type-3"]',
    contractTypeVolunteer: '[data-testid="contract-type-4"]',
    contractTypeUnspecified: '[data-testid="contract-type-5"]',
    // date inputs
    contractDateFromInput: '[data-testid="contract-date-from-input"]',
    contractDateToPicker: '[data-testid="contract-date-to-picker"]',
    contractDateToInput: '[data-testid="contract-date-to-input"]',
    rehearsalDateFromInput: '[data-testid="rehearsal-date-from-input"]',
    rehearsalDateToInput: '[data-testid="rehearsal-date-to-input"]',

    // union radio options
    union1: '[data-testid="union-1"]',
    union1Input: '[data-testid="union-1"] input[type="radio"]',
    union2: '[data-testid="union-2"]',
    union2Input: '[data-testid="union-2"] input[type="radio"]',
    union3: '[data-testid="union-3"]',
    union3Input: '[data-testid="union-3"] input[type="radio"]',
    union4: '[data-testid="union-4"]',
    union4Input: '[data-testid="union-4"] input[type="radio"]',

    // production type / checkboxes
    productionType1: '[data-testid="production-type-1"]',

    // phone / country selector
    phoneDropdown: '[data-testid="phone-dropdown"]',
    phoneInput: '[data-testid="phone-input"]',

    // project image / upload area
    projectImage: '[data-testid="project-image"]',
    projectImageTrigger: '[data-testid="project-image-trigger"]',
    projectImageDragger: '[data-testid="project-image-dragger"]',
    projectImageFileInput: 'input.n-upload-file-input[type="file"]',

    // new project modal actions
    projectNewSubmitButton: '[data-testid="project-new-submit-button"]',
    projectNewCloseButton: '[data-testid="project-new-close-button"]',

    // generic project list / verification
    projectsList: '[data-testid="projects-list"]',
    projectCard: '[data-testid="project-card"]',

    //terms
    termsCheckbox: '[data-testid="non-disclosure-requirements"]',
    termsUrl: '[data-testid="terms-url"]',

    //project cover
    projectCoverimage : '[data-testid^="project-list-card-"][data-testid$="-cover-image"]'
};
