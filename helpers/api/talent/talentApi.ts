import { urls } from "@/utils/urls";
import { APIRequestContext } from "playwright";

export async function registerTalent(
  request: APIRequestContext,
  token: string,
  talentName: string
) {

  const url = urls.talent_base + "registration";

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  console.log("----- TALENT REGISTRATION DEBUG -----");
  console.log("URL:", url);
  console.log("Token:", token);
  console.log("------------------------------------");

  // STEP 1
  const payload1 = {
    name: talentName,
    stage_name: "test-stage",
    location: {
      location: "Colorado, USA",
      longitude: -105.547816373,
      latitude: 38.998550562
    },
    gender: "female",
    birth: "1964-05-23",
    phone1: "7456325",
    terms_accepted: true
  };

  console.log("STEP1 Payload:", payload1);

  const step1 = await request.patch(url, {
    headers,
    data: payload1
  });

  console.log("STEP1 Status:", step1.status());
  console.log("STEP1 Response:", await step1.text());

  // STEP 2
  const payload2 = {
    self_rated_skills: [1, 27, 6671],
    unions: ["actors_equity_association"],
    description: "<p>test</p>"
  };

  console.log("STEP2 Payload:", payload2);

  const step2 = await request.patch(url, {
    headers,
    data: payload2
  });

  console.log("STEP2 Status:", step2.status());
  console.log("STEP2 Response:", await step2.text());

  // STEP 3
  const payload3 = {
    production_types: ["film", "tv_video"]
  };

  console.log("STEP3 Payload:", payload3);

  const step3 = await request.patch(url, {
    headers,
    data: payload3
  });

  console.log("STEP3 Status:", step3.status());
  console.log("STEP3 Response:", await step3.text());

  console.log("----------- END DEBUG -----------");

  if (![200, 201].includes(step3.status())) {
    throw new Error("Talent registration failed");
  }

  return true;
}



export async function applyForRound(
  request: APIRequestContext,
  token: string,
  tenantId: string,
  auditionId: number,
  roundId: number,
  roleId: number,
  questionId: number
) {

  const payload = {
    roles: [roleId],
    question_collection: [{
      question_id: questionId,
      value: "<p>My answer</p>"
    }],
    status: 1
  };

  const response = await request.post(
    `https://api.t.jamargig.com/api/${tenantId}/talent/casting/auditions/${auditionId}/rounds/${roundId}/application/`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      data: payload
    }
  );

  if (!response.ok()) {
    throw new Error(`Apply for round failed: ${response.status()} ${await response.text()}`);
  }

  return await response.json();
}