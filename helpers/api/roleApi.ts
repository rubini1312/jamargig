import { urls } from "@/utils/urls";
import { APIRequestContext, expect } from "playwright/test";

export async function createRole(request: APIRequestContext, token: string, projectId: number): Promise<any> {

  const res = await request.post(
    urls.casting_base + `projects/${projectId}/roles`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        time_zone: "Asia/Colombo",
        height_unit: "cm",
        weight_unit: "kg",
        description: "<p>test for talent</p>",
        role_name: `Test role ${Date.now()}`,
        contract_type: 1,
        project_id: projectId
      }
    }
  );

  console.log("Create Role Status:", res.status());
  expect(res.status()).toBe(201);

  return await res.json();
}

export async function getProjectRoles(request: APIRequestContext, token: string, projectId: number): Promise<any> {

  const res = await request.get(
    urls.casting_base + `projects/${projectId}/roles`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  console.log("Get Roles Status:", res.status());
  expect(res.status()).toBe(200);

  return await res.json();
}

export async function deleteRole(request: APIRequestContext, token: string, projectId: number, roleId: number): Promise<void> {

  const res = await request.delete(
    urls.casting_base + `projects/${projectId}/roles/${roleId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  console.log("Delete Role Status:", res.status());

  expect([200, 204]).toContain(res.status());
}

export async function deleteAllRoles(
  request: APIRequestContext,
  token: string,
  projectId: number
): Promise<void> {

  const { data: roles } = await getProjectRoles(request, token, projectId);

  for (const role of roles ?? []) {
    await deleteRole(request, token, projectId, role.id);
  }
}
