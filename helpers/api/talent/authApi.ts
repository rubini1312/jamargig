import { validLogin } from "@/test-data/loginData";
import { getOtpFromMailtrap } from "@/utils/mailtrapOtp";
import { urls } from "@/utils/urls";
import { APIRequestContext } from "playwright";

export async function getTalentAccessToken(
  request: APIRequestContext,
  email: string
): Promise<string> {

  const otpUrl =
    `https://api.t.jamargig.com/api/${validLogin.tenant_id}/talent/casting/passcode`;

  console.log("OTP URL:", otpUrl);

  const otpRequest = await request.post(otpUrl, {
    data: {
      email,
      recaptcha_token: "automation_token"
    }
  });

  const otpStatus = otpRequest.status();
  const otpBody = await otpRequest.json();

  console.log("OTP Status:", otpStatus);
  console.log("OTP Response:", otpBody);

  if (otpStatus !== 201) {
    throw new Error("Failed to request OTP");
  }

  // 🔴 IMPORTANT — get verify URL from response
  const verifyUrl = otpBody.data.code_endpoint;
  console.log("Verify URL:", verifyUrl);

  // wait for email
  await new Promise(r => setTimeout(r, 10000));

  const otp = await getOtpFromMailtrap(request, email);

  console.log("OTP:", otp);

  const verifyRes = await request.post(verifyUrl, {
    data: {
      email,
      passcode: otp
    }
  });

  const verifyStatus = verifyRes.status();
  const verifyBody = await verifyRes.text();

  console.log("Verify Status:", verifyStatus);
  console.log("Verify Response:", verifyBody);

  if (verifyStatus !== 200) {
    throw new Error("Talent OTP verify failed");
  }

  const body = JSON.parse(verifyBody);

  return body.access_token;
}