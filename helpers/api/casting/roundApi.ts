import { urls } from "@/utils/urls";
import { APIRequestContext, expect } from "playwright/test";

const uniqueName = `test round ${Date.now()}`;


export async function createOnlineRound(request: APIRequestContext, token: string, projectId: number, roleId?: number): Promise<any> {

  const res = await request.post(
    urls.casting_base + `projects/${projectId}/rounds`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        roles: roleId ? [roleId] : [-1],
        enforce_profile_assessment: true,
        time_zone: "Asia/Colombo",
        instruction: "",
        enforce_location: true,
        enforce_selfie: true,
        round_name: uniqueName,
        round_type: 1,
        submission_type: 1,
        location: null,
        audition_numbers: null
      }
    }
  );

  console.log("Create Round Status:", res.status());
  expect(res.status()).toBe(201);

  return await res.json();
}


export async function createInPersonRound(request: APIRequestContext, token: string, projectId: number, roleId?: number): Promise<any> {

  const res = await request.post(
    urls.casting_base + `projects/${projectId}/rounds`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        roles: roleId ? [roleId] : [-1],
        enforce_profile_assessment: false,
        time_zone: "Asia/Colombo",
        instruction: "",
        enforce_location: true,
        enforce_selfie: true,
        round_name: uniqueName,
        round_type: 2,
        submission_type: 1,
        location: "Colorado, USA",
        lat: 38.998550562,
        lon: -105.547816373,
        longitude: -105.547816373,
        latitude: 38.998550562,
        radius: "0.1",
        "radius-unit": "km",
        location_raw: {
          Country: "USA",
          Geometry: {
            Point: [-105.547816373, 38.998550562]
          },
          Interpolated: false,
          Label: "Colorado, USA",
          Region: "Colorado",
          id: "-105.547816373:38.998550562"
        }
      }
    }
  );

  console.log("Create Location Round Status:", res.status());
  expect(res.status()).toBe(201);

  return await res.json();
}


export async function updateRoundSubmissionStatus(request: APIRequestContext, token: string, projectId: number, roundId: number, status: number = 1): Promise<any> {

  const res = await request.patch(
    urls.casting_base + `projects/${projectId}/rounds/${roundId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        accept_submission_status: status
      }
    }
  );

  console.log("Update Round Status:", res.status());
  expect(res.status()).toBe(201);

  return await res.json();
}


export async function getProjectRounds(request: APIRequestContext, token: string, projectId: number): Promise<any> {

  const res = await request.get(
    urls.casting_base + `projects/${projectId}/rounds`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  console.log("Get Rounds Status:", res.status());
  expect(res.status()).toBe(200);

  return await res.json();
}

export async function deleteRound(request: APIRequestContext, token: string, projectId: number, roundId: number): Promise<void> {

  const res = await request.delete(
    urls.casting_base + `projects/${projectId}/rounds/${roundId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  console.log("Delete Round Status:", res.status());
  expect(res.status()).toBe(200);
}


export async function deleteAllRounds(
  request: APIRequestContext,
  token: string,
  projectId: number
): Promise<void> {

  const roundsRes = await getProjectRounds(request, token, projectId);

  const rounds = roundsRes.data || [];

  for (const round of rounds) {
    const roundId = round.id;

    console.log(`Deleting round ${roundId}`);

    await deleteRound(request, token, projectId, roundId);
  }
}