import { APIRequestContext, expect } from "@playwright/test";
import {  getAccessTokenSmartFromCasting } from "./authApi";
import { urls } from "@/utils/urls";

export async function isTwoFactorEnabled(request: APIRequestContext): Promise<boolean> {
  const token = await getAccessTokenSmartFromCasting(request);

  const response = await request.get(
    urls.casting_base + "settings",
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  expect(response.status()).toBe(200);

  const body = await response.json();

  const enabled =
    body?.data?.two_factor_authentication?.settings?.enabled;

  return Boolean(enabled);
}
