
// Locators for question page elements
export const questionLocators = {
    // question tab selection
    //questionTab: '[data-testid="projects.question-tab"]',
    questionTab:"//a[@title='Questions']",
    // list / create button
    questionListCreateButton: '[data-testid="create-question-button"]',
    // question text input
    questionTextInput: '[data-testid="question-question"]',
    // question type radio group
    questionTypeGroup: '[data-testid="question-type"]',
    //Text question type
    questionType1: '[data-testid="question-type-option-1"]',
    //Checkbox question type
    questionType2: '[data-testid="question-type-option-2"]',
    //Radio button question type
    questionType3: '[data-testid="question-type-option-3"]',
    //Drop down question type
    questionType4: '[data-testid="question-type-option-4"]',
    //Media question type
    questionType5: '[data-testid="question-type-option-5"]',
    //questionType6: '[data-testid="question-type-option-6"]',
    //Availability question type
    questionType7: '[data-testid="question-type-option-7"]',

    //checkbox,radio button,drop down, availability options
    questionCheckboxOptionsInput0: '[data-testid="question-options-option-0"]',
    questionCheckboxOptionsInput1: '[data-testid="question-options-option-1"]',
    questionCheckboxOptionsInput2: '[data-testid="question-options-option-2"]',
    questionCheckboxOptionsInput3: '[data-testid="question-options-option-3"]',
    questionCheckboxOptionsInput4: '[data-testid="question-options-option-4"]',
    //button to add more checkbox options
    questionAddCheckboxOptionButton: '[data-testid="question-options-add-option"]',


    //Question description input
    questionDescriptionInput: '[data-testid="question-description-content"]',
    // Checkboxes
    questionRequiredCheckbox: 'input[type="checkbox"]',
    //Status toggle
    questionStatusToggle: '[data-testid="question-status"]',
    // question round
    
    //questionRoundSelect: '[data-testid="question-rounds"]',
    //questionRoundSelect:"//div[@data-testid='question-rounds']//div[@class='n-base-selection n-base-selection--multiple']",
    //question role
    //questionRoleSelect: '[data-testid="question-roles"]',
    //questionRoleSelect:"//div[@data-testid='question-roles']//div[@class='n-base-selection n-base-selection--multiple']",

    // actions
    questionSaveButton: '[data-testid="questions-form-save-button"]',

    // individual checkboxes
    imageCheckbox: '.n-checkbox-group .n-checkbox >> nth=0',
    videoCheckbox: '.n-checkbox-group .n-checkbox >> nth=1',
    AudioCheckbox: '.n-checkbox-group .n-checkbox >> nth=2',
    pdfCheckbox: '.n-checkbox-group .n-checkbox >> nth=3',


    //delete
    deleteBtn : '[data-testid="questions-list-actions-delete-button"]',
    deleteConfirmationBtn : "//span[normalize-space()='Confirm']",
    deleteConfirmationPopup : "//div[@class='ck-body-wrapper']",
    emptyQuestionTable : "//div[@class='empty']",

    //search question 
	searchQuestion: '[data-testid="questions-list-search-search-icon"]',
	searchInput : "//input[@placeholder='Search...']",

    //edit question
    valueRequiredError : "//div[@class='n-form-item-feedback__line']",
    valueRequiredAlert : "//div[@class='n-alert-body__content']",
    editQuestion_closeBtn : '[data-testid="questions-form-close-button"]',
    editQuestion_updateBtn : '[data-testid="questions-form-save-button"]',
    questionOptions_removeBtn : '[data-testid="question-options-remove-option"]',
    deleteQuestion_closemodel : "//button[@aria-label='close']//i[@class='n-base-icon']//*[name()='svg']"
    
};



