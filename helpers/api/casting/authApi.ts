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

export async function getAccessTokenSmartFromCastingForDynamicUser(
  request: APIRequestContext,
  email: string = validLogin.email,
  password: string,

): Promise<string> {

  const loginRes = await request.post(
    urls.casting_base + "login",
    {
      data: {
        type: 1,
        email,
        password,
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

export async function changePassword(
  request: APIRequestContext,
  token: string,
  newPassword: string
) {
  const response = await request.patch(
    urls.casting_base + "team/me",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: {
        password: newPassword,
        password_confirmation: newPassword,
      },
    }
  );

  // Print basic response info
  console.log("Status:", response.status());
  console.log("Status Text:", response.statusText());

  // Print response body (JSON or text)
  try {
    const body = await response.json();
    console.log("Response Body:", JSON.stringify(body, null, 2));
  } catch (err) {
    const text = await response.text();
    console.log("Response Text:", text);
  }

  return response;
}