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

export function getProjectPayload(overrides: Partial<any> = {}) {
  return {
    description: "<p>test description</p>",
    personnel_information: "",
    additional_info: "",
    other_info: "",
    phone: "",
    title: `Test Manual ${Date.now()}`,
    production_company: "test",
    location: "Colorado, USA",
    location_raw: {
      Country: "USA",
      Geometry: {
        Point: [-105.547816373, 38.998550562]
      },
      Interpolated: false,
      Label: "Colorado, USA",
      Region: "Colorado",
      id: "-105.547816373:38.998550562"
    },
    longitude: -105.547816373,
    latitude: 38.998550562,
    contract_type_id: 1,
    union: 1,
    production_types: [
      {
        id: 1,
        name: "theater",
        label: "Theater",
        order: 1,
        is_active: true
      }
    ],
    image:
      "https://d1saerzfk5q61c.cloudfront.net/63e31adc898a4/c/8961bcd8-a292-4361-be31-d5e8d00dbeb5_1772193256568.png",

    ...overrides 
  };
}