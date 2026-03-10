import { test, expect } from "@playwright/test";
import { createUser, resetDatabase } from "./helpers/db";

test.beforeEach(async () => {
  await resetDatabase();
});

test("employee can create a supply request", async ({ page }) => {
  await createUser({
    email: "employee@example.com",
    password: "password123",
    role: "EMPLOYEE",
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill("employee@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/dashboard");

  await page.goto("/supplies");
  await page.getByPlaceholder("Item").fill("Gloves");
  await page.getByPlaceholder("Department").fill("Operations");
  await page.getByRole("spinbutton").fill("10");
  await page.getByRole("button", { name: "Create Request" }).click();

  await expect(page.getByText("Gloves")).toBeVisible();
});
