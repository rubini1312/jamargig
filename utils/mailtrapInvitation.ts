import { APIRequestContext } from '@playwright/test';

export class MailtrapService {
  private baseUrl = process.env.MAILTRAP_BASE_URL!;
  private accountId = process.env.MAILTRAP_ACCOUNT_ID!;
  private inboxId = process.env.MAILTRAP_INBOX_ID!;
  private apiToken = process.env.MAILTRAP_API_TOKEN!;

  constructor(private request: APIRequestContext) {}

  private async wait(ms: number) {
    return new Promise(res => setTimeout(res, ms));
  }

  /**
   * Get latest email for a specific recipient
   */
  private async getLatestMessage(email: string, timeoutMs = 30000): Promise<any> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const res = await this.request.get(
        `${this.baseUrl}/accounts/${this.accountId}/inboxes/${this.inboxId}/messages`,
        { headers: { 'Api-Token': this.apiToken } }
      );

      if (!res.ok()) {
        await this.wait(3000);
        continue;
      }

      const messages = await res.json();

      const filtered = messages.filter((m: any) =>
        m.to_email?.includes(email)
      );

      if (!filtered.length) {
        await this.wait(3000);
        continue;
      }

      filtered.sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );

      return filtered[0];
    }

    throw new Error(`No email received for ${email}`);
  }

  /**
   * Get OTP from email
   */
  async getOtp(email: string): Promise<string> {
    const message = await this.getLatestMessage(email);

    const res = await this.request.get(
      `${this.baseUrl}/accounts/${this.accountId}/inboxes/${this.inboxId}/messages/${message.id}/body.txt`,
      { headers: { 'Api-Token': this.apiToken } }
    );

    const body = await res.text();

    const otpMatch = body.match(/\b\d{4,6}\b/);

    if (!otpMatch) throw new Error('OTP not found');

    console.log('✅ OTP:', otpMatch[0]);
    return otpMatch[0];
  }

  /**
   * Get invitation link from email
   */
  async getInvitationLink(email: string): Promise<string> {
    const message = await this.getLatestMessage(email);

    const res = await this.request.get(
      `${this.baseUrl}/accounts/${this.accountId}/inboxes/${this.inboxId}/messages/${message.id}/body.html`,
      { headers: { 'Api-Token': this.apiToken } }
    );

    const body = await res.text();

    // Prefer "Accept Invitation" link
    const match = body.match(
      /<a[^>]*href="([^"]+)"[^>]*>.*Accept Invitation.*<\/a>/i
    );

    if (match) {
      console.log('✅ Invitation Link:', match[1]);
      return match[1];
    }

    // fallback: first link
    const fallback = body.match(/href="(https?:\/\/[^"]+)"/);

    if (fallback) return fallback[1];

    throw new Error('Invitation link not found');
  }
}