import { urls } from "@/utils/urls";
import { APIRequestContext, expect } from "@playwright/test";
import { validLogin } from "@/test-data/loginData";
import { getOtpFromMailtrap } from "../mailtrapOtp";

export async function getAccessTokenSmart(
  request: APIRequestContext,
  email: string = validLogin.email
): Promise<string> {

  const loginRes = await request.post(
    urls.casting_base + "login",
    {
      data: {
        type: 1,
        email,
        password: validLogin.password,
        tenant_id: validLogin.tenant_id
      }
    }
  );

  const body = await loginRes.json();

  console.log("Login status:", loginRes.status());
  console.log("Login body:", JSON.stringify(body, null, 2));

  // NO 2FA
  if (body.access_token) {
    console.log("Login success without 2FA");
    return body.access_token;
  }

  // 2FA REQUIRED
  console.log("2FA detected");

  const codeEndpoint: string = body?.data?.code_endpoint;

  if (!codeEndpoint) {
    throw new Error("No code_endpoint found in login response");
  }

  console.log("OTP verify endpoint:", codeEndpoint);

  // GET OTP FROM MAILTRAP
  const otp = await getOtpFromMailtrap(request, email);
  console.log("OTP fetched:", otp);

  // VERIFY OTP
  const verifyRes = await request.post(codeEndpoint, {
    data: {
      email,
      passcode: otp
    }
  });

  console.log("Verify status:", verifyRes.status());

  const verifyBody = await verifyRes.json();
  console.log("Verify body:", JSON.stringify(verifyBody, null, 2));

  expect(verifyRes.status()).toBe(200);

  return verifyBody.access_token;
}