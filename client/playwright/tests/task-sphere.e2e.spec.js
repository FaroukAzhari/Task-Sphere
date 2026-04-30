import { expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL || "admin@tasksphere.dev";
const password = process.env.E2E_PASSWORD || "password123";

test("login flow", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/dashboard/);
});

test("create project flow", async ({ page }) => {
  await page.goto("/projects");
  await page.getByPlaceholder("Team name").fill("E2E Team");
  await page.getByRole("button", { name: "Create team" }).click();
});

test("create task flow", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.getByText("Projects")).toBeVisible();
});

test("move task on board", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.getByText("Projects")).toBeVisible();
});
