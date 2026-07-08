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

// Earn EXP by completing one high-priority task (20 EXP). Waits for the
// checkbox to reflect completed state — that only flips once the server
// action (which also awards the EXP) has finished and the page revalidated,
// so it's a reliable "the mutation has landed" signal before we navigate.
async function completeHighPriorityTask(
  page: import("@playwright/test").Page,
  title: string
) {
  await page.goto("/tasks?view=all");
  await page.getByPlaceholder("Add a task…").fill(title);
  await page.getByRole("combobox").first().click();
  await page.getByRole("option", { name: "High" }).click();
  await page.getByRole("button", { name: "Add task" }).click();
  const checkbox = page.getByRole("checkbox", { name: `${title} — done` });
  await checkbox.click();
  await expect(checkbox).toBeChecked();
}

test.describe("finance", () => {
  test("add income and expense, balance reflects both", async ({ page }) => {
    await registerFreshUser(page);
    await page.goto("/finance");

    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Income" }).click();
    await page.getByPlaceholder("0.00").fill("1000.00");
    await page.getByPlaceholder("Note").fill("Salary");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByText("Salary")).toBeVisible();

    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Expense" }).click();
    await page.getByPlaceholder("0.00").fill("250.00");
    await page.getByPlaceholder("Note").fill("Groceries");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByText("Groceries")).toBeVisible();

    await expect(page.getByText("฿750.00").first()).toBeVisible();
  });
});

test.describe("gamification", () => {
  test("completing a task earns EXP shown on the level bar", async ({ page }) => {
    await registerFreshUser(page);

    await page.goto("/gamification");
    await expect(page.getByText("Level 1")).toBeVisible();

    await completeHighPriorityTask(page, "Ship the thing");

    await page.goto("/gamification");
    await expect(page.getByText("20 / 100 EXP")).toBeVisible();
    await expect(page.getByText("20 spendable")).toBeVisible();
  });

  test("redeeming a reward spends EXP", async ({ page }) => {
    await registerFreshUser(page);
    await completeHighPriorityTask(page, "Earn some exp");

    await page.goto("/gamification");
    await page.getByRole("button", { name: "+ New reward" }).click();
    await page.getByLabel("Name").fill("Coffee break");
    await page.getByLabel("Cost (EXP)").fill("10");
    await page.getByRole("button", { name: "Create" }).click();

    await expect(page.getByRole("button", { name: "Redeem" })).toBeVisible();
    await page.getByRole("button", { name: "Redeem" }).click();

    // 20 earned − 10 spent = 10 spendable, and the redemption is logged.
    await expect(page.getByText("10 spendable")).toBeVisible();
    await expect(page.getByText("Recent redemptions")).toBeVisible();
  });
});
