import { test as base, expect } from '@playwright/test';
import { mockCaptcha } from '../../fixtures/captcha.fixture';

export const test = base.extend({
  context: async ({ context }, use) => {
    await mockCaptcha(context);
    await use(context);
  }
});

export { expect };
