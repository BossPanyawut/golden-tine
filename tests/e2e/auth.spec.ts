import { test, expect } from "@playwright/test";

test.describe("authentication", () => {
  test("register, log out, and log back in", async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;
    const password = "TestPassw0rd!";

    await page.goto("/register");
    await page.getByLabel("Name").fill("E2E Test User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm password").fill(password);
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/welcome back/i)).toBeVisible();

    await page.getByRole("button", { name: "Open user menu" }).click();
    await page.getByRole("menuitem", { name: /log out/i }).click();

    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("redirects unauthenticated visitors to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
