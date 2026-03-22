
const uniqueTitle = `Automation Question-${Date.now()}-${Math.floor(Math.random() * 1000)}`;


export const questionData = {
  questionText: uniqueTitle,
  questionDescription: 'Automated question description for testing purposes',
  radioButtonOptions: ['Yes', 'No', 'Maybe'],
  dropdownOptions: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
};


export const editQuestionData = {
  questionText: `Automation edited uestion ${Date.now()}`,
  questionDescription: 'Automated edited question description for testing purposes',
  radioButtonOptions: ['Yes', 'No', 'Maybe'],
  dropdownOptions: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
};

export function getQuestionData() {
  return {
    questionText: `Automation Question-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    questionDescription: 'Automated question description for testing purposes',
    radioButtonOptions: ['Yes', 'No', 'Maybe'],
    dropdownOptions: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
  };
}