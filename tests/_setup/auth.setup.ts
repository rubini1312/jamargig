// tests/_setup/auth.setup.ts
import { chromium, expect, request } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import LoginPage from '../../pages/casting/owner/login/loginPage';
import { validLogin } from '@/test-data/loginData';
import { urls } from '@/utils/urls';

const authFile = path.resolve('playwright/.auth/auth.json');

async function globalSetup() {
  // Create API request context (used by validLoginwithUI for Mailtrap OTP retrieval)
  const apiContext = await request.newContext();

  // Launch browser
  const browser = await chromium.launch({
    headless: true, // change to false if you want to watch the login
  });

  const context = await browser.newContext({
    baseURL: urls.casting,
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  try {
    // Open the application login page
    await page.goto(urls.casting, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });

    // Perform real UI login (handles both normal login and OTP flow)
    const loginPage = new LoginPage(page);

    const twoFaStatus = await loginPage.validLoginwithUI(
      validLogin.email,
      validLogin.password,
      apiContext
    );

    console.log(`2FA status detected: ${twoFaStatus}`);

    // Ensure we are authenticated
    await expect(page).toHaveURL(/settings/, {
      timeout: 120000,
    });

    // Create auth directory if needed
    fs.mkdirSync(path.dirname(authFile), {
      recursive: true,
    });

    // Save the full authenticated browser state:
    // - cookies
    // - localStorage
    // - any other persisted auth state
    await context.storageState({
      path: authFile,
    });

    console.log(`Authentication state saved to: ${authFile}`);
  } finally {
    // Cleanup
    await browser.close();
    await apiContext.dispose();
  }
}

export default globalSetup;