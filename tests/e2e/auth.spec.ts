import { test, expect } from "@playwright/test";
import { createUser, resetDatabase } from "./helpers/db";

test.beforeEach(async () => {
  await resetDatabase();
});

test("register flow creates a new account and redirects to login", async ({ page }) => {
  await page.goto("/register");

  await page.getByLabel("Name").fill("Test User");
  await page.getByLabel("Email").fill("test.user@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByLabel("Confirm password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/login\?registered=1/);
});

test("login flow redirects to dashboard and blocks unauthenticated dashboard access", async ({ page }) => {
  await createUser({
    email: "employee@example.com",
    password: "password123",
    role: "EMPLOYEE",
  });

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("Email").fill("employee@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
