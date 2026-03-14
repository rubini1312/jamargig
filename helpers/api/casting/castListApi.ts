import { APIRequestContext, expect } from "@playwright/test";
import { urls } from "@/utils/urls";

export async function createWorkingCastList(
  request: APIRequestContext,
  token: string,
  projectId: number,
  roleId: number,
  name: string
) {

  const res = await request.post(
    `${urls.casting_base}projects/${projectId}/wcl`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        name: name,
        collect: [
          {
            role_id: roleId
          }
        ]
      }
    }
  );

  expect(res.status()).toBe(201);

  const body = await res.json();

  console.log("WCL Response:", body);

  return body;
}