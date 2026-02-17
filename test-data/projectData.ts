import { generateEmail, generatePhone } from "./random-data";

export const projectData = {
  title: "Automation Static Project",
  productionCompany: "Launchpad6",
  location: "Remote",
  url: "https://example.com",
  email: generateEmail(),
  phone: generatePhone(),
  contractFrom: "26 Dec 2025",
  contractTo: "31 Jan 2026",
  rehearsalFrom: "01 Nov 2025",
  rehearsalTo: "10 Nov 2025",
  contractTypeIndex: 1,
  unionIndex: 1,
  productionTypeTestId: "production-type-1",
  imagePath: "test-files/images/test-project.jpg",
  descriptionHtml: "Automated test project descriptions",
  personnelHtml: "Personnel info",
  additionalHtml: "Additional info",
  otherHtml: "Other info",
  acceptTerms: true,
  termsUrl: "https://jamargig.com/terms-and-conditions/"
};
