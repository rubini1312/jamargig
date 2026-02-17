import { urls } from "@/utils/urls";
import { APIRequestContext, expect } from "@playwright/test";

export async function getAccessToken(request: APIRequestContext): Promise<string> {
  const response = await request.post(
    urls.casting_base + "login",
    {
      data: {
        type: 1,
        email: "automation@example.com",
        password: "@ut0maT3123",
        tenant_id: "63e31adc898a4"
      }
    }
  );

  expect(response.status()).toBe(200);

  const body = await response.json();
  return body.access_token;
}
