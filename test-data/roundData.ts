export function onlineRoundData(submissionTypeIndex: number, name: string) {
  return {
    name: name,
    typeIndex: 1,
    timezone: "Asia/Colombo",

    roundDateFrom: '2026-01-01 13:40:30',
    roundDateTo: '2026-01-31 13:40:30',

    submissionTypeIndex: submissionTypeIndex,

    displayApplicationNumberIndex: 1,

    submissionDateFrom: '2026-01-01 13:40:30',
    submissionDateTo: '2026-01-31 13:40:30',
    
    assessmentDateFrom: '2026-01-20 13:40:30',
    assessmentDateTo: '2026-01-30 13:40:30',

    instructionHtml: 'Automated round instruction for testing purposes - Audition round descriptions specify the requirements for each stage of the casting process'
  };
}

export function inPersonRoundData(submissionTypeIndex: number, name: string) {
  return {
    name: name,
    typeIndex: 2,
    timezone: 'Asia/Colombo',
    location: 'Colombo, LKA',
    radius: '50',
    units: 'Miles',
    defaultNumberOfTalents: '20',
    minimumNumberOfTalents: '5',
    roundDateFrom: '2026-01-01 13:40:30',
    roundDateTo: '2026-01-31 13:40:30',
    submissionTypeIndex: submissionTypeIndex,
    displayApplicationNumberIndex: 1,
    submissionDateFrom: '2026-01-01 13:40:30',
    submissionDateTo: '2026-01-31 13:40:30',
    assessmentDateFrom: '2026-01-20 13:40:30',
    assessmentDateTo: '2026-01-30 13:40:30',
    instructionHtml: 'Automated round instruction for testing purposes -Audition round descriptions specify the requirements for each stage of the casting process, which can vary by discipline and project. They generally outline the material to prepare, the required format (e.g., self-tape, in-person), and the specific skills being evaluated'
  };
}