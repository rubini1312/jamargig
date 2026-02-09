
// Locator collection for Round (Round creation / listing)
// Follow the project's locator naming convention used in rolePageLocators.ts
export const roundLocators = {
    // rounds tab selection
    roundTab: '[data-testid="projects.single-tab"]',
	// list / create button
	roundListCreateButton: '[data-testid="round-list-create-button"]',

	// basic inputs
	roundNameInput: '[data-testid="round-name"]',

	// round type radio group
	roundTypeGroup: '[data-testid="round-type-group"]',
	roundType1: '[data-testid="round-type-1"]',
	roundType2: '[data-testid="round-type-2"]',

	// timezone select
	roundTimezone: '[data-testid="round-timezone"]',
	roundTimezoneInput: '[data-testid="round-timezone-input"]',

	//In person round locators
	roundLocationInput: '[data-testid="round-location-location-input"]',
	roundRadiusInput: '[data-testid="round-location-radius"]',
	roundUnitsInput: '[data-testid="round-location-units-input"]',
	roundLocationCheckbox: "[//div[@role='checkbox']]",
	roundDefaultNumberOfTalentsInput: '[data-testid="round-default-no-lineup"]',
	roundMinimumNumberOfTalentsInput: '[data-testid="round-min-no-lineup"]',

	// round date/time inputs
	roundDateFromInput: '[data-testid="round-round-date-from-input"]',
	roundDateToInput: '[data-testid="round-round-date-to-input"]',

	// submission type radio group
	roundSubmissionTypeGroup: '[data-testid="round-submission-type-group"]',
	roundSubmissionType1: '[data-testid="round-submission-type-1"]',
	roundSubmissionType2: '[data-testid="round-submission-type-2"]',
	roundSubmissionType3: '[data-testid="round-submission-type-3"]',

    //Assessment date picker
    roundAssessmentDateFromInput: '[data-testid="round-assessment-date-from-input"]',
    roundAssessmentDateToInput: '[data-testid="round-assessment-date-to-input"]',
    
	// display application numbers
	roundDisplayApplicationNumberGroup: '[data-testid="round-display-application-number-group"]',
	roundDisplayApplicationNumber0: '[data-testid="round-display-application-number-0"]',
	roundDisplayApplicationNumber1: '[data-testid="round-display-application-number-1"]',
	roundDisplayApplicationNumber2: '[data-testid="round-display-application-number-2"]',

	// submission date picker
	roundSubmissionDateFromInput: '[data-testid="round-submission-date-from-input"]',
	roundSubmissionDateToPicker: '[data-testid="round-submission-date-to-picker"]',
	roundSubmissionDateToInput: '[data-testid="round-submission-date-to-input"]',

	// other fields
	roundRoleQuestionsOnlyField: '[data-testid="round-role-questions-only-field"]',
	roundInstruction: 'div[data-testid="round-instruction-content"]',

	// actions
	roundNewSubmitButton: '[data-testid="round-new-submit-button"]'
};
