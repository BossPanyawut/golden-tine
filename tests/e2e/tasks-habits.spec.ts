import { test, expect } from "@playwright/test";

async function registerFreshUser(page: import("@playwright/test").Page) {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const password = "TestPassw0rd!";

  await page.goto("/register");
  await page.getByLabel("Name").fill("E2E Test User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("tasks", () => {
  test("quick-add a task and mark it complete", async ({ page }) => {
    await registerFreshUser(page);

    const title = `Write quotation draft ${Date.now()}`;
    // "Today" (the default view) only shows tasks due today — this task has
    // no due date, so switch to "All" to see it.
    await page.goto("/tasks?view=all");
    await page.getByPlaceholder("Add a task…").fill(title);
    await page.getByRole("button", { name: "Add task" }).click();

    await expect(page.getByText(title)).toBeVisible();

    const checkbox = page.getByRole("checkbox", { name: `${title} — done` });
    await checkbox.click();
    await expect(checkbox).toBeChecked();
  });
});

test.describe("habits", () => {
  test("create a daily habit and check in today", async ({ page }) => {
    await registerFreshUser(page);

    const name = `Drink water ${Date.now()}`;
    await page.goto("/habits");
    await page.getByRole("button", { name: "+ New habit" }).click();
    await page.getByLabel("Name").fill(name);
    await page.getByRole("button", { name: "Create habit" }).click();

    await expect(page.getByText(name)).toBeVisible();

    const checkbox = page.getByRole("checkbox", { name: `Check in: ${name}` });
    await checkbox.click();

    await expect(page.getByText("1 day streak")).toBeVisible();
  });
});
