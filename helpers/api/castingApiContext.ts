import { APIRequestContext, request as playwrightRequest } from "@playwright/test";
import { getAccessTokenSmart } from "./authApi";

export async function createCastingApiContext(
  requestContext: APIRequestContext
): Promise<APIRequestContext> {

  const token = await getAccessTokenSmart(requestContext);

  return await playwrightRequest.newContext({
    baseURL: "https://api.t.jamargig.com/api",
    extraHTTPHeaders: {
      Authorization: `Bearer ${token}`,
      Origin: "https://automation.casting.tjamargig.com",
      Referer: "https://automation.casting.tjamargig.com/",
      Accept: "application/json"
    }
  });
}