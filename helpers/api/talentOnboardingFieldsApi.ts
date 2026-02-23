import { APIRequestContext, request } from "@playwright/test";
import { getAccessTokenSmart } from "@/helpers/api/authApi";
import { urls } from "@/utils/urls";


export async function getAllPages(api: APIRequestContext) {
  const response = await api.get(
    urls.casting_base + "registration-pages"
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

export async function getFieldsByPageId(
  api: APIRequestContext,
  pageId: number
) {
  const url = urls.casting_base + `registration-pages/${pageId}/fields`;

  // retry up to 5 times if backend not ready yet
  for (let attempt = 0; attempt < 5; attempt++) {

    const response = await api.get(url);

    if (!response.ok()) {
      throw new Error(
        `getFieldsByPageId failed: ${response.status()} ${await response.text()}`
      );
    }

    const body = await response.json();

    if (!Array.isArray(body.data)) {
      throw new Error("Fields API did not return array");
    }

    const activeFields = body.data
      .filter((f: any) => f.status === true)
      .sort((a: any, b: any) => a.order - b.order);

    if (activeFields.length > 0) {
      return activeFields;
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.warn(`⚠️ No active fields found for page ${pageId}`);
  return [];
}

export async function getAllFieldsByPageId(
  api: APIRequestContext,
  pageId: number
) {
  const url = urls.casting_base + `registration-pages/${pageId}/fields`;

  const response = await api.get(url);

  if (!response.ok()) {
    throw new Error(
      `getAllFieldsByPageId failed: ${response.status()} ${await response.text()}`
    );
  }

  const body = await response.json();

  if (!Array.isArray(body.data)) {
    throw new Error("Fields API did not return array");
  }

  return body.data; // no filtering
}

// export async function patchField(
//   api: APIRequestContext,
//   pageId: number,
//   fieldName: string,
//   payload: {
//     status: boolean;
//     required?: boolean;
//     label?: string;
//     description?: string;
//   }
// ) {
//   const token = await getAccessTokenSmart(api);

//   const fullUrl = `${urls.casting_base}registration-pages/${pageId}/fields/${fieldName}`;

//   const response = await api.patch(fullUrl, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//       "Content-Type": "application/json"
//     },
//     data: {
//       status: payload.status,
//       required: payload.required ?? false,
//       label: payload.label ?? fieldName,
//       description: payload.description ?? ""
//     }
//   });

//   console.log("PATCH status:", response.status());
//   console.log("PATCH response:", await response.text());
// }


type FieldConfig = {
  status: boolean;
  required?: boolean;
};

export async function applyRegistrationConfig(
  api: APIRequestContext,
  defaultConfig: Record<number, Record<string, FieldConfig>>
) {
  for (const pageId of Object.keys(defaultConfig)) {

    const pageNumber = Number(pageId);
    const pageConfig = defaultConfig[pageNumber];

    const res = await api.get(
      urls.casting_base + `registration-pages/${pageNumber}/fields`
    );

    if (!res.ok()) {
      throw new Error(
        `Failed to fetch fields for page ${pageNumber}: ${res.status()}`
      );
    }

    const json = await res.json();
    const fields = json.data;

    if (!Array.isArray(fields)) {
      console.log(`❌ Could not fetch fields for page ${pageNumber}`);
      continue;
    }

    for (const fieldName of Object.keys(pageConfig)) {

      const fieldConfig = pageConfig[fieldName];
      const exists = fields.find((f: any) => f.name === fieldName);

      if (!exists) {
        console.log(`⚠️ ${fieldName} not found on page ${pageNumber}`);
        continue;
      }

      const payload = {
        status: fieldConfig.status,
        required: fieldConfig.required ?? false
      };

      console.log(`Updating page ${pageNumber} → ${fieldName}`, payload);

      const patchRes = await api.patch(
        urls.casting_base + `registration-pages/${pageNumber}/fields/${fieldName}`,
        {
          data: payload
        }
      );

      if (!patchRes.ok()) {
        console.log(`❌ ${fieldName}`, await patchRes.text());
      } else {
        console.log(`✅ ${fieldName}`);
      }
    }
  }
}