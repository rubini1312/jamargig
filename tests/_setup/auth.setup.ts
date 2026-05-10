// auth.setup.ts
import { chromium, request } from '@playwright/test';
import { validLogin } from '@/test-data/loginData';
import { getAccessTokenSmartFromCasting } from '@/helpers/api/casting/authApi';
import fs from 'fs';
import path from 'path';
import { urls } from '@/utils/urls';

const authFile = path.resolve('playwright/.auth/auth.json');

async function globalSetup() {
  // API context for token retrieval
  const apiContext = await request.newContext();

  try {
    // ------------------------------------------------------------
    // 1. Get access token via API
    // ------------------------------------------------------------
    const token = await getAccessTokenSmartFromCasting(
      apiContext,
      validLogin.email
    );

    // ------------------------------------------------------------
    // 2. Launch browser and create context
    // ------------------------------------------------------------
    const browser = await chromium.launch({ headless: true });

    const context = await browser.newContext({
      // Increase page load timeout for slow environments
      baseURL: urls.casting,
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    // ------------------------------------------------------------
    // 3. Navigate with a larger timeout and wait only for DOM load
    //    (avoids hanging on slow resources)
    // ------------------------------------------------------------
    await page.goto(urls.casting, {
      waitUntil: 'domcontentloaded',
      timeout: 120000, // 2 minutes
    });

    // Optional: wait a few seconds for app scripts to initialize
    await page.waitForTimeout(3000);

    // ------------------------------------------------------------
    // 4. Inject token into localStorage
    // ------------------------------------------------------------
    await page.evaluate((accessToken: string) => {
      localStorage.setItem('accessToken', accessToken);
    }, token);

    // ------------------------------------------------------------
    // 5. Reload and wait for authenticated page
    // ------------------------------------------------------------
    await page.reload({
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });

    // Wait until redirected to projects page
    await page.waitForURL('**/projects', {
      timeout: 120000,
    });

    // ------------------------------------------------------------
    // 6. Save storage state
    // ------------------------------------------------------------
    fs.mkdirSync(path.dirname(authFile), { recursive: true });

    await context.storageState({
      path: authFile,
    });

    console.log(`Authentication state saved to: ${authFile}`);

    // ------------------------------------------------------------
    // 7. Cleanup
    // ------------------------------------------------------------
    await browser.close();
  } finally {
    await apiContext.dispose();
  }
}

export default globalSetup;