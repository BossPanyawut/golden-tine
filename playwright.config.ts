import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  // Auth flows hash passwords with argon2, deliberately CPU-expensive by
  // design. Many workers registering/logging in at once saturate the libuv
  // thread pool the native argon2 binding runs on, and the heaviest test
  // (register + logout + login = 3 hashes) can blow past the assertion
  // timeout. Keep workers at 2 and give assertions headroom rather than
  // weakening the hash cost — no real single user generates that load.
  workers: 2,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
