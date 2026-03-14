import { urls } from "@/utils/urls";
import { APIRequestContext, expect } from "@playwright/test";
import { validLogin } from "@/test-data/loginData";
import { getOtpFromMailtrap } from "@/utils/mailtrapOtp";

export async function getAccessTokenSmartFromCasting(
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

  if (body.access_token) {
    return body.access_token;
  }

  const codeEndpoint: string = body?.data?.code_endpoint;
  await new Promise(r => setTimeout(r, 10000));
  const otp = await getOtpFromMailtrap(request, email);

  const fullVerifyUrl = codeEndpoint.startsWith("http")
    ? codeEndpoint
    : urls.casting_base.replace("/api/", "/") + codeEndpoint.replace("/api/", "");

  console.log("VERIFY FULL URL:", fullVerifyUrl);

  const verifyRes = await request.post(fullVerifyUrl, {
    headers: {
      "X-Tenant": validLogin.tenant_id
    },
    data: {
      email,
      passcode: otp
    }
  });

  console.log("Verify status:", verifyRes.status());
  console.log("Verify body:", await verifyRes.text());

  if (verifyRes.status() !== 200) {
    throw new Error("OTP verify failed");
  }

  const verifyBody = await verifyRes.json();
  return verifyBody.access_token;
}