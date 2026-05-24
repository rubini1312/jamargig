import { APIRequestContext, expect, request } from "@playwright/test";
import { urls } from "@/utils/urls";

type ApiField = {
  id: number;
  name: string;
  label?: string;
  required: boolean;
  status: boolean;
  order: number;
};

export async function getAllPages(request: APIRequestContext, token: string) {
  const response = await request.get(
    urls.casting_base + "registration-pages",
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok()) {
    throw new Error(`getAllPages failed: ${response.status()} ${await response.text()}`);
  }

  const body = await response.json();
  if (!Array.isArray(body.data)) {
    throw new Error("Pages API did not return array");
  }

  return body.data;
}


type ApiFieldForPageIds = {
  id: number;
  label: string;
  name: string;
  status: boolean;
  order: number;
  required?: boolean;
};
export async function getFieldsByPageId(
  request: APIRequestContext,
  pageId: number,
  token: string
): Promise<ApiFieldForPageIds[]> {

  const url = urls.casting_base + `registration-pages/${pageId}/fields`;

  for (let attempt = 0; attempt < 5; attempt++) {

    const response = await request.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok()) {
      throw new Error(
        `getFieldsByPageId failed: ${response.status()} ${await response.text()}`
      );
    }

    const body: { data: ApiFieldForPageIds[] } = await response.json();

    if (!Array.isArray(body.data)) {
      throw new Error("Fields API did not return array");
    }

    const activeFields = body.data
      .filter((f) => f.status)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (activeFields.length > 0) {
      return activeFields;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.warn(`No active fields found for page ${pageId}`);
  return [];
}




type FieldConfig = { status: boolean; required?: boolean; };

export async function applyRegistrationConfig(
  request: APIRequestContext, token: string,
  defaultConfig: Record<number, Record<string, FieldConfig>>
) {
  for (const pageId of Object.keys(defaultConfig)) {

    const pageNumber = Number(pageId);
    const pageConfig = defaultConfig[pageNumber];

    const res = await request.get(
      urls.casting_base + `registration-pages/${pageNumber}/fields`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!res.ok()) {
      throw new Error(
        `Failed to fetch fields for page ${pageNumber}: ${res.status()}`
      );
    }

    const json = await res.json();
    const fields = json.data;

    if (!Array.isArray(fields)) {
      console.log(`Could not fetch fields for page ${pageNumber}`);
      continue;
    }

    for (const fieldName of Object.keys(pageConfig)) {

      const fieldConfig = pageConfig[fieldName];
      const exists = fields.find((f: any) => f.name === fieldName);

      if (!exists) {
        console.log(`${fieldName} not found on page ${pageNumber}`);
        continue;
      }

      const payload = {
        status: fieldConfig.status,
        required: fieldConfig.required ?? false
      };

      console.log(`Updating page ${pageNumber} → ${fieldName}`, payload);

      const patchRes = await request.patch(
        urls.casting_base + `registration-pages/${pageNumber}/fields/${fieldName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          data: payload
        }
      );

      if (!patchRes.ok()) {
        console.log(` ${fieldName}`, await patchRes.text());
      } else {
        console.log(`${fieldName}`);
      }
    }
  }
}


export async function getTalentUuidByName(
  request: APIRequestContext,
  token: string,
  talentName: string
): Promise<string> {

  let page = 1;

  while (true) {

    const res = await request.post(
      urls.casting_base + `talent/search?page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        data: {}
      }
    );

    expect(res.status()).toBe(200);

    const body = await res.json();

    const talent = body.data.find(
      (t: any) =>
        t.name?.trim() === talentName.trim() ||
        t.stage_name?.trim() === talentName.trim()
    );

    if (talent) {
      console.log(`Found on page ${page}`);
      return talent.uuid;
    }

    if (!body.data.length || body.to >= body.total) {
      break;
    }

    page++;
  }

  throw new Error(`Talent "${talentName}" not found in any page`);
}

export async function getProjectTalentUuidByName(
  request: APIRequestContext,
  token: string,
  projectId: number,
  talentName: string
): Promise<string> {

  const res = await request.post(
    urls.casting_base + `projects/${projectId}/talent/search?page=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        filter: {
          "in-projects": [projectId]
        }
      }
    }
  );

  console.log("Talent Search Status:", res.status());
  expect(res.status()).toBe(200);

  const body = await res.json();

  const talent = body.data.find(
    (t: any) => t.name === talentName
  );

  if (!talent) {
    throw new Error(`Talent "${talentName}" not found in project`);
  }

  return talent.uuid;
}

export async function getProjectTalentNames(
  request: APIRequestContext,
  token: string,
  projectId: number
): Promise<string[]> {

  const res = await request.post(
    urls.casting_base + `projects/${projectId}/talent/search?page=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        filter: { "in-projects": [projectId] }
      }
    }
  );

  expect(res.status()).toBe(200);

  const body = await res.json();

  const names = body.data.map((talent: any) => talent.name);

  return names;
}

export async function deleteTalent(
  request: APIRequestContext,
  token: string,
  uuid: string
): Promise<void> {

  const res = await request.delete(
    urls.casting_base + `talent/${uuid}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  console.log("Delete Talent Status:", res.status());

  expect([200, 204]).toContain(res.status());
}


export async function updateTalentRegistration(
  request: APIRequestContext,
  token: string,
  payload: any
) {

  console.log("Talent Registration Payload:");
  console.log(JSON.stringify(payload, null, 2));

  const res = await request.patch(
    urls.talent_base + "registration",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: payload
    }
  );

  console.log("Status:", res.status());

  expect(res.status()).toBe(201);

  return await res.json();
}

export async function getTalentSearchTotalCount(
  request: APIRequestContext,
  token: string,
  searchText?: string
): Promise<number> {

  const res = await request.post(
    urls.casting_base + `talent/search?page=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        ...(searchText ? { search: searchText } : {})
      }
    }
  );

  expect(res.status()).toBe(200);

  const body = await res.json();

  return body.total;
}


export async function getTalentUploadedMedia(
  request: APIRequestContext,
  token: string,
  projectId: number,
  talentUuid: string
) {

  const response = await request.get(
    urls.casting_base  + `projects/${projectId}/talent/${talentUuid}/media`,
    {
        headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }
  );

  expect(response.ok()).toBeTruthy();

  return await response.json();
}