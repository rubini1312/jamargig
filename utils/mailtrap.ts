// utils/mailtrap.ts
import { APIRequestContext } from '@playwright/test';

export type MailtrapMessage = {
  id: number;
  subject?: string;
  to?: Array<{ email?: string; name?: string }>;
  to_email?: string;
  text_body?: string | null;
  html_body?: string | null;
  sent_at?: string;
  [k: string]: any;
};

/**
 * Poll Mailtrap for an incoming message to the given inbox and (optionally) recipient.
 * Returns the raw message object or null on timeout.
 */
export async function pollMailtrapForMessage(
  request: APIRequestContext,
  inboxId: string | number,
  opts?: {
    recipientEmail?: string; // optionally filter messages sent to this email address
    subjectContains?: string; // optionally filter by subject substring
    intervalMs?: number;
    timeoutMs?: number;
    apiBase?: string; // <-- new optional absolute base, e.g. 'https://mailtrap.io/api/v1'
  }
): Promise<MailtrapMessage | null> {
  const intervalMs = opts?.intervalMs ?? 2000;
  const timeoutMs = opts?.timeoutMs ?? 60000;
  const recipientLower = opts?.recipientEmail?.toLowerCase();
  const start = Date.now();

  // normalize API base: ensure protocol and remove trailing slashes
  let apiBaseNormalized = opts?.apiBase ? opts.apiBase.replace(/\/+$/, '') : 'https://mailtrap.io/api/v1';
  if (!/^https?:\/\//i.test(apiBaseNormalized)) {
    apiBaseNormalized = `https://${apiBaseNormalized}`;
  }

  while (Date.now() - start < timeoutMs) {
    const url = `${apiBaseNormalized}/inboxes/${inboxId}/messages`;

    const res = await request.get(url, {
      params: { per_page: '20', sort_by: 'created_at', sort_direction: 'desc' }
    });

    // non-OK -> include body snippet in the thrown error (helps debug 401/403/html redirects)
    if (!res.ok()) {
      const text = await res.text().catch(() => '<unreadable body>');
      throw new Error(`Mailtrap API returned ${res.status()} ${res.statusText()} for ${url}\nResponse snippet: ${text.slice(0, 1000)}`);
    }

    // check Content-Type before parsing JSON
    const ct = (res.headers()['content-type'] || '').toLowerCase();
    if (!ct.includes('application/json') && !ct.includes('+json')) {
      const text = await res.text().catch(() => '<unreadable body>');
      throw new Error(
        `Expected JSON from Mailtrap API but got Content-Type: ${ct || '<none>'} for ${url}\nResponse snippet: ${text.slice(0, 1000)}`
      );
    }

    // safe to parse JSON now
    let messages: MailtrapMessage[];
    try {
      messages = (await res.json()) as MailtrapMessage[];
    } catch (err) {
      const text = await res.text().catch(() => '<unreadable body>');
      throw new Error(`Failed to parse Mailtrap JSON response for ${url}: ${(err as Error).message}\nResponse snippet: ${text.slice(0, 1000)}`);
    }

    for (const m of messages) {
      // quick filters: recipient or subject
      let toMatch = true;
      if (recipientLower) {
        const recipients: string[] = [];
        if (Array.isArray(m.to)) {
          for (const r of m.to) if (r?.email) recipients.push(String(r.email).toLowerCase());
        }
        if (m.to_email) recipients.push(String(m.to_email).toLowerCase());
        toMatch = recipients.some(r => r.includes(recipientLower) || recipientLower.includes(r));
      }
      let subjectMatch = true;
      if (opts?.subjectContains) {
        subjectMatch = Boolean(m.subject && m.subject.toLowerCase().includes(opts.subjectContains.toLowerCase()));
      }

      if (toMatch && subjectMatch) {
        return m;
      }
    }

    await new Promise(r => setTimeout(r, intervalMs));
  }

  return null;
}

/**
 * Extract an OTP-like code from message body. Tries text_body then html_body.
 * Adjust regex depending on expected OTP format (digits length, alphanumeric, etc.)
 */
export function extractOtpFromMessage(m: MailtrapMessage, regex?: RegExp): string | null {
  const body = (m.text_body || m.html_body || '').toString();
  if (!body) return null;
  const pattern = regex ?? /\b(\d{4,8})\b/; // default: 4-8 digit OTP
  const match = body.match(pattern);
  return match ? match[1] : null;
}