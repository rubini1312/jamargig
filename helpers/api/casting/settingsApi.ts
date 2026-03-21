import { APIRequestContext, expect } from "@playwright/test";
import { getAccessTokenSmartFromCasting } from "./authApi";
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


type SettingsOverrides = {
  two_factor_auth?: boolean;
  max_limit?: string;
  blocking_time?: string;
};

export async function updateCastingSettings(
  request: APIRequestContext,
  token: string,
  overrides: SettingsOverrides = {}
) {
  const payload = {
    notify_users: [],
    reply_to: null,
    demo_projects: true,
    demo_talent: true,

    material_restrictions: {
      total_storage_limit: 524288000,
      total_num_files: "25",
      siteUsage: [] 
    },

    passcode_attempt: {
      max_limit: overrides.max_limit ?? "5",
      blocking_time: overrides.blocking_time ?? "1"
    },

    two_factor_auth: overrides.two_factor_auth ?? false
  };

  const response = await request.patch(
    'https://api.t.jamargig.com/api/casting/settings',
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      data: payload
    }
  );

  const body = await response.json();

  console.log('Status:', response.status());
  console.log('Response:', body);

  expect(response.ok()).toBeTruthy();

  return body;
}
