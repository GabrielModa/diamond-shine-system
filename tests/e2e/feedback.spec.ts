import { test, expect } from "@playwright/test";
import { createUser, resetDatabase } from "./helpers/db";

test.beforeEach(async () => {
  await resetDatabase();
});

test("supervisor can submit feedback", async ({ page }) => {
  const employee = await createUser({
    email: "employee@example.com",
    password: "password123",
    role: "EMPLOYEE",
  });

  await createUser({
    email: "supervisor@example.com",
    password: "password123",
    role: "SUPERVISOR",
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill("supervisor@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/dashboard");

  await page.goto("/feedback");
  await page.getByPlaceholder("Employee ID").fill(employee.id);
  await page.getByPlaceholder("Comments").fill("Strong performance this sprint.");
  await page.getByRole("spinbutton").fill("9");
  await page.getByRole("button", { name: "Create Feedback" }).click();

  await expect(page.getByText("Strong performance this sprint.")).toBeVisible();
});
