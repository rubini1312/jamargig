import { Page, expect } from '@playwright/test';
import LoginPage from "../pages/casting/owner/login/loginPage";
import * as data from "../test-data/test-data.json";
import { logout } from './logout';

/**
 * Navigates to settings and ensures that Two-Factor Authentication is enabled.
 * If 2FA is already on, it confirms this and returns true.
 * If 2FA is off, it attempts to turn it on and verifies success.
 * @param page The Playwright Page object.
 * @returns {Promise<boolean>} Returns true if 2FA is verified as ON, otherwise false.
 */
export async function verifyTwoFAOn(page: Page): Promise<boolean> {
  try {
    // Use a more specific locator if possible, but this is based on your original code
    const toggle = page.getByRole('switch').first();
    await expect(toggle).toBeVisible({ timeout: 5000 }); // Wait for the toggle to be ready

    const currentState = await toggle.getAttribute('aria-checked');

    if (currentState === 'false') {
      console.log('2FA is currently OFF. Enabling it now...');
      await toggle.click();

      // IMPORTANT: Wait for the state to change to 'true' after the click
      await expect(toggle).toHaveAttribute('aria-checked', 'true', { timeout: 3000 });
      await page.getByRole('button', { name: 'Save' }).scrollIntoViewIfNeeded();
      await page.getByRole('button', { name: 'Save' }).click();
      console.log('Successfully enabled 2FA.');

    } else if (currentState === 'true') {
      console.log('2FA is already ON. No action needed.');
    } else {
      // This case handles if the attribute is missing or has an unexpected value
      throw new Error("Could not determine the state of the 2FA toggle. 'aria-checked' attribute not found.");
    }

    // Final verification that it is enabled and interactive
    await expect(toggle).toHaveAttribute('tabindex', '0');
    return true; // Return true indicating success

  } catch (error) {
    console.error('Failed to enable or verify Two-Factor Authentication:', error);
    return false; // Return false if any step in the try block fails
  }
}

export async function verifyTwoFAOff(page: Page): Promise<boolean> {
  try {
    // Use a more specific locator if possible, but this is based on your original code
    const toggle = page.getByRole('switch').first();
    await expect(toggle).toBeVisible({ timeout: 5000 }); // Wait for the toggle to be ready

    const currentState = await toggle.getAttribute('aria-checked');

    if (currentState === 'true') {
      console.log('2FA is currently ON. Disabling it now...');
      await toggle.click();

      // IMPORTANT: Wait for the state to change to 'false' after the click
      await expect(toggle).toHaveAttribute('aria-checked', 'false', { timeout: 3000 });
      await page.getByRole('button', { name: 'Save' }).scrollIntoViewIfNeeded();
      await page.getByRole('button', { name: 'Save' }).click();
      console.log('Successfully disabled 2FA.');

    } else if (currentState === 'false') {
      console.log('2FA is already OFF. No action needed.');
    } else {
      // This case handles if the attribute is missing or has an unexpected value
      throw new Error("Could not determine the state of the 2FA toggle. 'aria-checked' attribute not found.");
    }

    // Final verification that it is enabled and interactive
    await expect(toggle).toHaveAttribute('tabindex', '0');
    return true; // Return true indicating success

  } catch (error) {
    console.error('Failed to disable or error:', error);
    return false; // Return false if any step in the try block fails
  }
}