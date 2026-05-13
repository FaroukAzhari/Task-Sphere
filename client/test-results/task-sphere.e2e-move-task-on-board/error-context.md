# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task-sphere.e2e.spec.js >> move task on board
- Location: playwright\tests\task-sphere.e2e.spec.js:25:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Projects')
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Projects')

```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | const email = process.env.E2E_EMAIL || "admin@tasksphere.dev";
  4  | const password = process.env.E2E_PASSWORD || "password123";
  5  | 
  6  | test("login flow", async ({ page }) => {
  7  |   await page.goto("/login");
  8  |   await page.getByPlaceholder("Email").fill(email);
  9  |   await page.getByPlaceholder("Password").fill(password);
  10 |   await page.getByRole("button", { name: "Login" }).click();
  11 |   await expect(page).toHaveURL(/dashboard/);
  12 | });
  13 | 
  14 | test("create project flow", async ({ page }) => {
  15 |   await page.goto("/projects");
  16 |   await page.getByPlaceholder("Team name").fill("E2E Team");
  17 |   await page.getByRole("button", { name: "Create team" }).click();
  18 | });
  19 | 
  20 | test("create task flow", async ({ page }) => {
  21 |   await page.goto("/projects");
  22 |   await expect(page.getByText("Projects")).toBeVisible();
  23 | });
  24 | 
  25 | test("move task on board", async ({ page }) => {
  26 |   await page.goto("/projects");
> 27 |   await expect(page.getByText("Projects")).toBeVisible();
     |                                            ^ Error: expect(locator).toBeVisible() failed
  28 | });
  29 | 
```