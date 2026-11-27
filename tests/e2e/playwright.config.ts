import { defineConfig, devices } from '@playwright/test';

// Playbook Step 6: multi-role E2E + WCAG 2.2 AA against a production build
// running on localhost and wired to the LOCAL Supabase stack. Start it with
// `npm run test:e2e:local` (tests/e2e/run.mjs), which refuses non-local targets.
export default defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.ts/,
  outputDir: '../../test-results/e2e-local',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.REDTEAM_APP_URL || 'http://localhost:3100',
    trace: 'retain-on-failure',
    // Fade-ins caught mid-animation read as false contrast failures in axe.
    contextOptions: { reducedMotion: 'reduce' },
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    { name: 'desktop-1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile-375', use: { ...devices['Pixel 7'], viewport: { width: 375, height: 812 } } },
  ],
});
