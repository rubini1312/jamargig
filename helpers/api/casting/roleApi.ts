import { urls } from "@/utils/urls";
import { APIRequestContext, expect } from "playwright/test";

const uniqueName = `Test role ${Date.now()}`;

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
        role_name: uniqueName,
        contract_type: 1,
        project_id: projectId
      }
    }
  );

  console.log("Create Role Status:", res.status());
  expect(res.status()).toBe(201);

  return await res.json();
}

export async function createRoleWithroleImage(request: APIRequestContext, token: string, projectId: number): Promise<any> {

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
        role_name: uniqueName,
        image: "https://d1saerzfk5q61c.cloudfront.net/63e31adc898a4/c/8961bcd8-a292-4361-be31-d5e8d00dbeb5_1775800283669.png",
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

export async function addRoleMaterial(
  request: APIRequestContext,
  token: string,
  projectId: number,
  roleId: number
): Promise<any> {

  const res = await request.post(
    `${urls.casting_base}projects/${projectId}/roles/${roleId}/material`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },

      data: {
        collect: [
          {
            name: "test-role.jpg",
            url: "https://d1saerzfk5q61c.cloudfront.net/63e31adc898a4/c/8961bcd8-a292-4361-be31-d5e8d00dbeb5_1775793812916.png",
            size: 512596,
          },
        ],
      },
    }
  );

  console.log("Add Material Status:", res.status());
  const body = await res.json();
  console.log("Response:", body);

  expect(res.status()).toBe(201);

  return body;
}


export async function updateMaterialDownloadable(
  request: APIRequestContext,
  token: string,
  projectId: number,
  roleId: number,
  uuid: string,
  fileName: string,
  downloadable: boolean
) {
  const url = urls.casting_base +
    `projects/${projectId}/roles/${roleId}/material/${uuid}`;

  console.log("PATCH URL:", url);
  console.log("UUID:", uuid);
  console.log("Project:", projectId, "Role:", roleId);

  const res = await request.patch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    data: {
      name: fileName,
      downloadable: downloadable
    }
  });

  console.log("Update Material Status:", res.status());

  if (!res.ok()) {
    throw new Error(
      `Failed to update material: ${res.status()} ${await res.text()}`
    );
  }

  const json = await res.json();
  return json;
}


type Material = {
  uuid: string;
  name: string;
};

export async function getMaterialUuid(
  request: APIRequestContext,
  token: string,
  projectId: number,
  roleId: number,
  fileName?: string
): Promise<string> {

  const url = `${urls.casting_base}projects/${projectId}/roles/${roleId}/material`;

  const res = await request.get(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  console.log("Get Materials Status:", res.status());

  if (!res.ok()) {
    throw new Error(
      `Failed to fetch materials: ${res.status()} ${await res.text()}`
    );
  }

  const body: { data: Material[] } = await res.json();

  if (!Array.isArray(body.data) || body.data.length === 0) {
    throw new Error("No materials found");
  }

  if (fileName) {
    const found = body.data.find(m => m.name === fileName);

    if (!found) {
      throw new Error(`Material not found: ${fileName}`);
    }

    return found.uuid;
  }
  console.log(body.data[0].uuid);
  return body.data[0].uuid;
}