// tests/_setup/auth.setup.ts
import { chromium, expect, request } from '@playwright/test';
import fs from 'fs';
import path from 'path';

import LoginPage from '../../pages/casting/owner/login/loginPage';
import { validLogin } from '@/test-data/loginData';
import { urls } from '@/utils/urls';

const authFile = path.resolve('playwright/.auth/auth.json');

async function globalSetup() {
  const apiContext = await request.newContext();

  const browser = await chromium.launch({
    headless: true, // set false if you want to watch the login
  });

  const context = await browser.newContext({
    baseURL: urls.casting,
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  try {
    // Open login page
    await page.goto(urls.casting, {
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });

    // Perform UI login (supports normal login and 2FA)
    const loginPage = new LoginPage(page);

    const twoFaStatus = await loginPage.validLoginwithUI(
      validLogin.email,
      validLogin.password,
      apiContext
    );

    console.log(`2FA status detected: ${twoFaStatus}`);

    // Ensure login is complete
    await expect(page).toHaveURL(/settings/, {
      timeout: 120000,
    });

    // Small extra delay to ensure all storage is populated
    await page.waitForTimeout(2000);

    // Debug: print all localStorage keys
    const localStorageData = await page.evaluate(() => ({ ...localStorage }));
    console.log(
      'Local Storage:',
      JSON.stringify(localStorageData, null, 2)
    );

    // Create auth directory if needed
    fs.mkdirSync(path.dirname(authFile), {
      recursive: true,
    });

    // Save full authenticated state (cookies + localStorage)
    await context.storageState({
      path: authFile,
    });

    console.log(`Authentication state saved to: ${authFile}`);
  } finally {
    await browser.close();
    await apiContext.dispose();
  }
}

export default globalSetup;