import { APIRequestContext, expect } from '@playwright/test';

const BASE_URL = process.env.MAILTRAP_BASE_URL!;
const ACCOUNT_ID = process.env.MAILTRAP_ACCOUNT_ID!;
const INBOX_ID = process.env.MAILTRAP_INBOX_ID!;
const API_TOKEN = process.env.MAILTRAP_API_TOKEN!;

/**
 * Fetch latest OTP sent to given email from Mailtrap
 */
export async function getOtpFromMailtrap(
  request: APIRequestContext,
  email: string,
  timeoutMs = 20000
): Promise<string> {

  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {

    // 1️⃣ Fetch all messages
    const messagesResponse = await request.get(
      `${BASE_URL}/accounts/${ACCOUNT_ID}/inboxes/${INBOX_ID}/messages`,
      {
        headers: {
          'Api-Token': API_TOKEN,
        },
      }
    );

    expect(messagesResponse.ok()).toBeTruthy();
    const messages = await messagesResponse.json();

    // 2️⃣ Filter messages for this user + OTP subject
    const filtered = messages.filter(
      (m: any) =>
        m.to_email === email &&
        m.subject?.includes('User Passcode') // optional but recommended
    );

    if (filtered.length === 0) {
      await wait(3000);
      continue;
    }

    // 3️⃣ Sort newest → oldest
    filtered.sort(
      (a: any, b: any) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    );

    const latestMessage = filtered[0];

    // 4️⃣ Fetch message body.txt
    const bodyResponse = await request.get(
      `${BASE_URL}/accounts/${ACCOUNT_ID}/inboxes/${INBOX_ID}/messages/${latestMessage.id}/body.txt`,
      {
        headers: {
          'Api-Token': API_TOKEN,
        },
      }
    );

    expect(bodyResponse.ok()).toBeTruthy();
    const bodyText = await bodyResponse.text();

    // 5️⃣ Extract OTP (4–6 digits)
    const otpMatch = bodyText.match(/\b\d{4,6}\b/);
    if (otpMatch) {
      return otpMatch[0];
    }

    // OTP not yet in body → retry
    await wait(3000);
  }

  throw new Error('OTP not received from Mailtrap within timeout');
}

/**
 * Simple async wait
 */
function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
