// import { test, expect } from '@playwright/test';
// import { getOtpFromMailtrap } from '../../helpers/mailtrapOtp';
// import { verifyTwoFAOn,verifyTwoFAOff } from "../../helpers/twoFAsetting";
// import { logout } from "../../helpers/logout";
// import LoginPage from "../../pages/casting/owner/login/loginPage";
// import * as data from "../../test-data/test-data.json";

// test('Login using OTP from Mailtrap', async ({ page, request }) => {
//   test.setTimeout(50000);
//   const login = new LoginPage(page);
//   await page.goto('/login');
//   await login.validLogin(data.email, data.password);
//   await page.waitForTimeout(5000);
//   // Navigate to general settings to check 2FA status
//   await page.goto('/settings/general-settings');
//   await page.waitForSelector("//div[@class='section-header-title']", { timeout: 6000 });
//   // Best Practice: Wait for a stable element to ensure the page is loaded
//   await expect(page.locator('.section-header-title')).toBeVisible();

//   // Call the function to ensure 2FA is enabled
//   const isTwoFAEnabled = await verifyTwoFAOn(page);

//   // === Part 2: Conditional OTP Login Test ===
//   // The 'if' block now correctly wraps the entire logout and re-login process.
//   if (isTwoFAEnabled) {
//     // Logout to prepare for OTP login test
//     await logout(page);
//     console.log('2FA setup confirmed. Proceeding with OTP login verification.');
//     // Attempt to log in again, which should now require an OTP
//     await page.goto('/login');
//     await login.validLogin(data.email, data.password);
//     await page.waitForTimeout(5000);
//     // The test will now correctly wait for the OTP input field to appear after the login attempt
//     const otpInput = page.locator('[data-testid="twofa-pin-input-input-0"]');
//     //await expect(otpInput).toBeVisible({ timeout: 15000 });

//     // Fetch and fill the OTP
//     const otp = await getOtpFromMailtrap(request, data.email, 20000);
//     await otpInput.click();
//     await page.keyboard.type(otp);

//     // Verify successful login by checking the URL
//     await expect(page).toHaveURL(/projects/, { timeout: 10000 });
//     console.log('Successfully logged in using OTP.');
//     await page.goto('/settings/general-settings');
//     // Clean up: Disable 2FA after test
//     const isTwoFADisabled = await verifyTwoFAOff(page);
//     if (isTwoFADisabled) {
//       console.log('2FA has been disabled after the test.');
//     } else {
//       console.warn('Failed to disable 2FA after the test.');
//     }
//   } else {
//     // Fail the test clearly if the precondition (2FA setup) was not met.
//     test.fail(true, "Test cannot proceed because 2FA could not be enabled or verified.");
//   }
// });
