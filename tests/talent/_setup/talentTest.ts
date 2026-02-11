import { test as base, expect } from '@playwright/test';
import { mockCaptcha } from '../../fixtures/captcha.fixture';
import { generateEmail } from '@/test-data/random-data';

type TalentFixtures = {
  talentEmail: string;
};

let sharedEmail: string;

export const test = base.extend<TalentFixtures>({
  context: async ({ context }, use) => {
    await mockCaptcha(context);
    await use(context);
  },

  talentEmail: async ({}, use) => {
    if (!sharedEmail) {
      sharedEmail = generateEmail();
      console.log('Generated talent email:', sharedEmail);
    }
    await use(sharedEmail);
  }
});

export { expect };
