import { APIRequestContext } from "@playwright/test";
import { getAccessTokenSmart } from "@/helpers/api/authApi";
import { urls } from "@/utils/urls";

export async function getAllPages(api: APIRequestContext) {
  const token = await getAccessTokenSmart(api);

  const url = urls.casting_base + "registration-pages";
  console.log("Calling URL:", url);

  const response = await api.get(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const body = await response.json();
  console.log("API pages raw:", body);

  if (!Array.isArray(body.data)) {
    throw new Error("Pages API did not return array");
  }

  return body.data;
}

export async function getFieldsByPageId(
  api: APIRequestContext,
  pageId: number
) {
  const token = await getAccessTokenSmart(api);

  const url = urls.casting_base + `registration-pages/${pageId}/fields`;
  console.log("Calling Fields URL:", url);

  const response = await api.get(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const body = await response.json();

  if (!Array.isArray(body.data)) {
    throw new Error("Fields API did not return array");
  }

  return body.data
    .filter((f: any) => f.status === true)
    .sort((a: any, b: any) => a.order - b.order);
}