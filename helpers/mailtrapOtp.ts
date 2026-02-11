import { APIRequestContext, Page, expect } from '@playwright/test';

const BASE_URL = process.env.MAILTRAP_BASE_URL!;
const ACCOUNT_ID = process.env.MAILTRAP_ACCOUNT_ID!;
const INBOX_ID = process.env.MAILTRAP_INBOX_ID!;
const API_TOKEN = process.env.MAILTRAP_API_TOKEN!;

/**
 * Fetch OTP from Mailtrap
 */
export async function getOtpFromMailtrap(
  request: APIRequestContext,
  email: string,
  timeoutMs = 18000
): Promise<string> {

  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const res = await request.get(
        `${BASE_URL}/accounts/${ACCOUNT_ID}/inboxes/${INBOX_ID}/messages`,
        { headers: { 'Api-Token': API_TOKEN } }
      );

      if (!res.ok()) {
        await wait(3000);
        continue;
      }

      const messages = await res.json();

      const filtered = messages.filter((m: any) =>
        m.to_email?.includes(email)
      );

      if (!filtered.length) {
        await wait(3000);
        continue;
      }

      filtered.sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );

      const latest = filtered[0];

      const bodyRes = await request.get(
        `${BASE_URL}/accounts/${ACCOUNT_ID}/inboxes/${INBOX_ID}/messages/${latest.id}/body.txt`,
        { headers: { 'Api-Token': API_TOKEN } }
      );

      if (!bodyRes.ok()) {
        await wait(3000);
        continue;
      }

      const bodyText = await bodyRes.text();
      const otpMatch = bodyText.match(/\b\d{4,6}\b/);

      if (otpMatch) {
        console.log("✅ OTP FOUND:", otpMatch[0]);
        return otpMatch[0];
      }

    } catch (e) {
      console.log("Mailtrap retry...");
    }

    await wait(3000);
  }

  throw new Error("OTP not received from Mailtrap");
}

function wait(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

/**
 * Enter OTP in UI
 */
export async function enterOtp(page: Page, code: string) {

  const container = page.locator('[data-testid="auth-passcode"]');

  await container.waitFor({
    state: "visible",
    timeout: 60000
  });

  const inputs = container.locator('input');
  const digits = code.split("");

  for (let i = 0; i < digits.length; i++) {
    await inputs.nth(i).fill(digits[i]);
  }

  console.log("OTP entered");
}
