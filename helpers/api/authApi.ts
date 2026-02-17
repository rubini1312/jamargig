import { urls } from "@/utils/urls";
import { APIRequestContext, expect } from "@playwright/test";
import * as data from '../../test-data/test-data.json';

export async function getAccessToken(request: APIRequestContext): Promise<string> {
  const response = await request.post(
    urls.casting_base + "login",
    {
      data: {
        type: 1,
        email: data.email,
        password: data.password,
        tenant_id: data.tenant_id
      }
    }
  );

  expect(response.status()).toBe(200);

  const body = await response.json();
  return body.access_token;
}
